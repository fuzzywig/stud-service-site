import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebase";
import {
    doc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
} from "firebase/firestore";
import "./Favourites.css";
import { FaHeart, FaTrash, FaStar, FaRegStar, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Favourites() {
    const [user, setUser] = useState(null);
    const [favouriteAds, setFavouriteAds] = useState([]);
    const [groupedFavourites, setGroupedFavourites] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState("grid");
    const auth = getAuth();

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (!user) {
            setFavouriteAds([]);
            setGroupedFavourites({});
            setLoading(false);
            return;
        }

        const fetchFavourites = async () => {
            try {
                const favouritesSnap = await getDocs(
                    collection(db, "users", user.uid, "favourites")
                );

                const adIds = favouritesSnap.docs.map((doc) => doc.id);

                const adverts = await Promise.all(
                    adIds.map(async (adId) => {
                        const adDoc = await getDoc(doc(db, "studAds", adId));
                        if (!adDoc.exists()) return null;

                        const adData = adDoc.data();

                        // Fetch city/county from user
                        let ownerCity = "";
                        let ownerCounty = "";
                        if (adData.ownerId) {
                            const userDoc = await getDoc(doc(db, "users", adData.ownerId));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                ownerCity = userData.city || "";
                                ownerCounty = userData.county || "";
                            }
                        }

                        return {
                            id: adDoc.id,
                            ...adData,
                            ownerCity,
                            ownerCounty,
                        };
                    })
                );

                const filteredAds = adverts.filter(Boolean);
                setFavouriteAds(filteredAds);

                // Group ads by breed
                const grouped = filteredAds.reduce((acc, ad) => {
                    const breed = ad.breed || "Other";
                    if (!acc[breed]) {
                        acc[breed] = [];
                    }
                    acc[breed].push(ad);
                    return acc;
                }, {});

                // Sort breeds alphabetically
                const sortedGrouped = Object.keys(grouped)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = grouped[key];
                        return acc;
                    }, {});

                setGroupedFavourites(sortedGrouped);
            } catch (error) {
                console.error("Error fetching favourites:", error);
                setFavouriteAds([]);
                setGroupedFavourites({});
            } finally {
                setLoading(false);
            }
        };

        fetchFavourites();
    }, [user]);

    const handleRemoveFavourite = async (adId) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        await deleteDoc(doc(db, "users", currentUser.uid, "favourites", adId));

        setFavouriteAds((prev) => {
            const updated = prev.filter((ad) => ad.id !== adId);
            const newGrouped = {};
            updated.forEach((ad) => {
                const breed = ad.breed || "Other";
                if (!newGrouped[breed]) {
                    newGrouped[breed] = [];
                }
                newGrouped[breed].push(ad);
            });

            setGroupedFavourites(newGrouped);
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="favourites-loading-container">
                <div className="favourites-loader"></div>
                <p>Loading your favourites...</p>
            </div>
        );
    }

    return (
        <div className="favourites-container">
            <div className="favourites-header">
                <h2 className="favourites-title">
                    <FaHeart className="heart-icon" /> My Favourite Studs
                </h2>
                <div className="view-toggle">
                    <button
                        className={`view-btn ${selectedView === "grid" ? "active" : ""}`}
                        onClick={() => setSelectedView("grid")}
                    >
                        Grid View
                    </button>
                    <button
                        className={`view-btn ${selectedView === "list" ? "active" : ""}`}
                        onClick={() => setSelectedView("list")}
                    >
                        List View
                    </button>
                </div>
            </div>

            {favouriteAds.length === 0 ? (
                <div className="empty-state">
                    <FaRegStar className="empty-icon" />
                    <h3>No Favourites Yet</h3>
                    <p>You haven't added any stud adverts to your favourites.</p>
                    <button className="browse-btn" onClick={() => navigate("/browse")}>
                        Browse Studs
                    </button>
                </div>
            ) : (
                <div className="breed-groups-container">
                    {Object.entries(groupedFavourites).map(([breed, ads]) => (
                        <div className="breed-group" key={breed}>
                            <h3 className="breed-group-title">{breed}</h3>
                            <div className={`favourites-${selectedView}`}>
                                {ads.map((ad) => (
                                    <div className="favourite-item" key={ad.id}>
                                        <div className="favourite-image-container">
                                            <img
                                                src={ad.images?.[0] || "https://placehold.co/400x300"}
                                                alt={ad.title}
                                                className="favourite-image"
                                            />
                                            <div className="favourite-badge">
                                                <FaStar /> Favourite
                                            </div>
                                        </div>

                                        <div className="favourite-content">
                                            <h3 className="favourite-title">{ad.title}</h3>
                                            <div className="favourite-details">
                                                <span className="favourite-breed">{ad.breed}</span>
                                                <span className="favourite-age">
                          {ad.age} {ad.age === 1 ? "year" : "years"} old
                        </span>
                                                <span className="favourite-fee">£{ad.fee}</span>
                                                {(ad.ownerCity || ad.ownerCounty) && (
                                                    <span className="favourite-location">
                            <FaMapMarkerAlt /> {ad.ownerCity}
                                                        {ad.ownerCity && ad.ownerCounty ? ", " : ""}
                                                        {ad.ownerCounty}
                          </span>
                                                )}
                                            </div>
                                            <div className="favourite-actions">
                                                <button
                                                    className="view-details-btn"
                                                    onClick={() => navigate(`/stud-details/${ad.id}`)}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => handleRemoveFavourite(ad.id)}
                                                >
                                                    <FaTrash /> Remove
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
