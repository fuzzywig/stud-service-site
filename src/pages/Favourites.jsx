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
import {
    FaHeart,
    FaTrash,
    FaStar,
    FaRegStar,
    FaMapMarkerAlt,
    FaShoppingCart,
    FaDog
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {Helmet} from "react-helmet-async";

export default function Favourites() {
    const [user, setUser] = useState(null);
    const [favouriteAds, setFavouriteAds] = useState([]);
    const [groupedFavourites, setGroupedFavourites] = useState({
        forSale: {},
        forStud: {},
        forRescue: {}
    });

    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState("grid");
    const [activeTab, setActiveTab] = useState("all");
    const auth = getAuth();
    const navigate = useNavigate();
    const shouldRenderForRescue = activeTab === 'all' || activeTab === 'forRescue';

    // watch auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    // fetch favourites
    useEffect(() => {
        if (!user) {
            setFavouriteAds([]);
            setGroupedFavourites({
                forSale: {},
                forStud: {},
                forRescue: {}
            });
            setLoading(false);
            return;
        }

        const fetchFavourites = async () => {
            setLoading(true);
            try {
                // 1) load favourite IDs
                const favSnap = await getDocs(
                    collection(db, "users", user.uid, "favourites")
                );
                const adIds = favSnap.docs.map(d => d.id);

                // 2) fetch each advert from allListings (skip unreadable ones)
                const adverts = await Promise.all(
                    adIds.map(async adId => {
                        try {
                            const adSnap = await getDoc(doc(db, "allListings", adId));
                            if (!adSnap.exists()) return null;

                            const adData = adSnap.data();
                            // pull owner location
                            let ownerCity = "", ownerCounty = "";
                            if (adData.ownerId) {
                                const uSnap = await getDoc(doc(db, "users", adData.ownerId));
                                if (uSnap.exists()) {
                                    const u = uSnap.data();
                                    ownerCity = u.city || "";
                                    ownerCounty = u.county || "";
                                }
                            }

                            return { id: adSnap.id, ...adData, ownerCity, ownerCounty };
                        } catch (e) {
                            console.warn("Can't read advert", adId, e);
                            return null;
                        }
                    })
                );

                // 3) filter out nulls
                const filteredAds = adverts.filter(ad => ad !== null);
                setFavouriteAds(filteredAds);

                console.log("Fetched intents:", filteredAds.map(ad => ad.intent));

                // 4) separate by listing type (for sale vs for stud) and then group by breed
                const forSaleAds = filteredAds.filter(ad =>
                    ["sale", "forSale"].includes((ad.intent || "").toLowerCase())
                );
                const forStudAds = filteredAds.filter(ad =>
                    ["stud", "forStud"].includes((ad.intent || "").toLowerCase())
                );
                const forRescueAds = filteredAds.filter(ad =>
                    ["rescue", "forRescue"].includes((ad.intent || "").toLowerCase())
                );

                // 5) group by breed
                const forSaleGrouped = forSaleAds.reduce((acc, ad) => {
                    const b = ad.breedOrType || "Other";
                    acc[b] = acc[b] || [];
                    acc[b].push(ad);
                    return acc;
                }, {});

                const forStudGrouped = forStudAds.reduce((acc, ad) => {
                    const b = ad.breedOrType || "Other";
                    acc[b] = acc[b] || [];
                    acc[b].push(ad);
                    return acc;
                }, {});

                const forRescueGrouped = forRescueAds.reduce((acc, ad) => {
                    const b = ad.breedOrType || "Other";
                    acc[b] = acc[b] || [];
                    acc[b].push(ad);
                    return acc;
                }, {});

                // 6) sort breed keys
                const sortedForSale = Object.keys(forSaleGrouped)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = forSaleGrouped[key];
                        return acc;
                    }, {});

                const sortedForStud = Object.keys(forStudGrouped)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = forStudGrouped[key];
                        return acc;
                    }, {});

                const sortedForRescue = Object.keys(forRescueGrouped)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = forRescueGrouped[key];
                        return acc;
                    }, {});

                setGroupedFavourites({
                    forSale: sortedForSale,
                    forStud: sortedForStud,
                    forRescue: sortedForRescue
                });
            } catch (err) {
                console.error("Error fetching favourites:", err);
                setFavouriteAds([]);
                setGroupedFavourites({
                    forSale: {},
                    forStud: {},
                    forRescue: {}
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFavourites();
    }, [user]);

    // remove one
    const handleRemoveFavourite = async (adId) => {
        if (!auth.currentUser) return;
        await deleteDoc(
            doc(db, "users", auth.currentUser.uid, "favourites", adId)
        );
        setFavouriteAds((prev) => {
            const updatedAds = prev.filter((ad) => ad.id !== adId);

            // rebuild groupings
            const forSaleAds = updatedAds.filter(ad =>
                ["sale", "forSale"].includes((ad.intent || "").toLowerCase())
            );
            const forStudAds = updatedAds.filter(ad =>
                ["stud", "forStud"].includes((ad.intent || "").toLowerCase())
            );
            const forRescueAds = updatedAds.filter(ad =>
                ["rescue", "forRescue"].includes((ad.intent || "").toLowerCase())
            );

            const forSaleGrouped = forSaleAds.reduce((acc, ad) => {
                const b = ad.breedOrType || "Other";
                if (!acc[b]) acc[b] = [];
                acc[b].push(ad);
                return acc;
            }, {});

            const forStudGrouped = forStudAds.reduce((acc, ad) => {
                const b = ad.breedOrType || "Other";
                if (!acc[b]) acc[b] = [];
                acc[b].push(ad);
                return acc;
            }, {});

            const forRescueGrouped = forRescueAds.reduce((acc, ad) => {
                const b = ad.breedOrType || "Other";
                if (!acc[b]) acc[b] = [];
                acc[b].push(ad);
                return acc;
            }, {});

            setGroupedFavourites({
                forSale: forSaleGrouped,
                forStud: forStudGrouped,
                forRescue: forRescueGrouped
            });

            return updatedAds;
        });
    };

    // Count total favorites for each type - ADD NULL CHECKS HERE
    const forSaleCount = Object.values(groupedFavourites?.forSale || {}).flat().length;
    const forRescueCount = Object.values(groupedFavourites?.forRescue || {}).flat().length;
    const forStudCount = Object.values(groupedFavourites?.forStud || {}).flat().length;
    const totalCount = forSaleCount + forStudCount + forRescueCount;

    if (loading) {
        return (
            <div className="favourites-loading-container">
                <div className="favourites-loader" />
                <p>Loading your favourites...</p>
            </div>
        );
    }

    // Determine which listings to display based on active tab
    const renderListings = () => {
        if (totalCount === 0) {
            return (
                <div className="empty-state">
                    <FaRegStar className="empty-icon" />
                    <h3>No Favourites Yet</h3>
                    <p>You haven't added any adverts to your favourites.</p>
                    <button className="browse-btn" onClick={() => navigate("/browse")}>
                        Browse Listings
                    </button>
                </div>
            );
        }

        const shouldRenderForSale = activeTab === 'all' || activeTab === 'forSale';
        const shouldRenderForStud = activeTab === 'all' || activeTab === 'forStud';

        return (
            <>
                {shouldRenderForSale && forSaleCount > 0 && (
                    <div className="listing-type-container">
                        <h2 className="listing-type-title">
                            <FaShoppingCart className="listing-type-icon" /> For Sale
                        </h2>
                        <div className="breed-groups-container">
                            {Object.entries(groupedFavourites?.forSale || {}).map(([breed, ads]) => (
                                <div className="breed-group" key={`sale-${breed}`}>
                                    <h3 className="breed-group-title">{breed}</h3>
                                    <div className={`favourites-${selectedView}`}>
                                        {ads.map((ad) => renderFavouriteItem(ad))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {shouldRenderForStud && forStudCount > 0 && (
                    <div className="listing-type-container">
                        <h2 className="listing-type-title">
                            <FaDog className="listing-type-icon" /> For Stud
                        </h2>
                        <div className="breed-groups-container">
                            {Object.entries(groupedFavourites?.forStud || {}).map(([breed, ads]) => (
                                <div className="breed-group" key={`stud-${breed}`}>
                                    <h3 className="breed-group-title">{breed}</h3>
                                    <div className={`favourites-${selectedView}`}>
                                        {ads.map((ad) => renderFavouriteItem(ad))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {shouldRenderForRescue && forRescueCount > 0 && (
                    <div className="listing-type-container">
                        <h2 className="listing-type-title">
                            <FaHeart className="listing-type-icon" /> For Adoption
                        </h2>
                        <div className="breed-groups-container">
                            {Object.entries(groupedFavourites?.forRescue || {}).map(([breed, ads]) => (
                                <div className="breed-group" key={`rescue-${breed}`}>
                                    <h3 className="breed-group-title">{breed}</h3>
                                    <div className={`favourites-${selectedView}`}>
                                        {ads.map((ad) => renderFavouriteItem(ad))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'forSale' && forSaleCount === 0 && (
                    <div className="empty-state">
                        <FaRegStar className="empty-icon" />
                        <h3>No 'For Sale' Favourites</h3>
                        <p>You haven't added any 'For Sale' adverts to your favourites.</p>
                        <button className="browse-btn" onClick={() => navigate("/browse")}>
                            Browse Listings
                        </button>
                    </div>
                )}

                {activeTab === 'forStud' && forStudCount === 0 && (
                    <div className="empty-state">
                        <FaRegStar className="empty-icon" />
                        <h3>No 'For Stud' Favourites</h3>
                        <p>You haven't added any 'For Stud' adverts to your favourites.</p>
                        <button className="browse-btn" onClick={() => navigate("/browse")}>
                            Browse Listings
                        </button>
                    </div>
                )}

                {activeTab === 'forRescue' && forRescueCount === 0 && (
                    <div className="empty-state">
                        <FaRegStar className="empty-icon" />
                        <h3>No 'For Adoption' Favourites</h3>
                        <p>You haven't added any rescue adverts to your favourites.</p>
                        <button className="browse-btn" onClick={() => navigate("/browse")}>
                            Browse Listings
                        </button>
                    </div>
                )}
            </>
        );
    };

    // Render a single favourite item
    const renderFavouriteItem = (ad) => (
        <div className="favourite-item" key={ad.id}>
            <div className="favourite-image-container">
                <img
                    src={ad.images?.[0] || "https://placehold.co/400x300"}
                    alt={ad.title || ad.breed}
                    className="favourite-image"
                />
                <div className="favourite-badge">
                    <FaStar /> Favourite
                </div>
            </div>

            <div className="favourite-content">
                <h3 className="favourite-title">{ad.title || ad.breedOrType}</h3>
                <div className="favourite-details">
                    <span className="favourite-breed">{ad.breedOrType}</span>
                    <span className="favourite-listing-type">
                        {ad.intent === 'stud' || ad.listingType === 'forStud' ? 'For Stud' :
                            ad.intent === 'rescue' ? 'For Adoption' : 'For Sale'}
                    </span>
                    {ad.age != null && (
                        <span className="favourite-age">
                            {ad.age} {ad.age === 1 ? "year" : "years"} old
                        </span>
                    )}
                    {(ad.price != null || ad.adoptionFee != null) && (
                        <span className="favourite-fee">
                            £{ad.intent === 'rescue' ? ad.adoptionFee : ad.price}
                        </span>
                    )}
                </div>
                <div className="favourite-actions">
                    <button
                        className="view-details-btn"
                        onClick={() => navigate(`/advert-details/${ad.id}`)}
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
    );

    return (

        <>
            <Helmet>
                <title>Your Favourites | My Pet Connect</title>
                <meta name="robots" content="noindex,follow" />
            </Helmet>

        <div className="favourites-container">
            <div className="favourites-header">
                <h2 className="favourites-title">
                    <FaHeart className="heart-icon" /> My Favourites
                </h2>
                <div className="favourites-controls">
                    <div className="favourites-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'forSale' ? 'active' : ''}`}
                            onClick={() => setActiveTab('forSale')}
                        >
                            For Sale ({forSaleCount})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'forStud' ? 'active' : ''}`}
                            onClick={() => setActiveTab('forStud')}
                        >
                            For Stud ({forStudCount})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'forRescue' ? 'active' : ''}`}
                            onClick={() => setActiveTab('forRescue')}
                        >
                            For Adoption ({forRescueCount})
                        </button>
                    </div>
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
            </div>

            {renderListings()}
        </div>

            </>
    );
}