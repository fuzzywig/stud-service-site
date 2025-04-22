import React, { useEffect, useState } from "react";
import "./BrowseStuds.css";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, getDoc, where } from "firebase/firestore";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { auth } from "../firebase/firebaseAuth";

function BrowseStuds() {
    const [adverts, setAdverts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favourites, setFavourites] = useState([]);

    const user = auth.currentUser;

    useEffect(() => {
        const fetchAdverts = async () => {
            try {
                const q = query(
                    collection(db, "studAds"),
                    where("approved", "==", true),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const ads = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log("📦 Approved adverts fetched:", ads); // ✅ Log here
                setAdverts(ads);
            } catch (err) {
                console.error("🔥 Failed to fetch adverts:", err.message);
            } finally {
                setLoading(false);
            }
        };


        const fetchFavourites = async () => {
            if (!user) return;
            const favRef = collection(db, "users", user.uid, "favourites");
            const favSnap = await getDocs(favRef);
            const favIds = favSnap.docs.map(doc => doc.id);
            setFavourites(favIds);
        };

        fetchAdverts();
        fetchFavourites();
    }, [user]);

    const toggleFavourite = async (adId) => {
        if (!user) return alert("Please log in to use favourites.");
        const favRef = doc(db, "users", user.uid, "favourites", adId);

        if (favourites.includes(adId)) {
            await deleteDoc(favRef);
            setFavourites(favourites.filter(id => id !== adId));
        } else {
            await setDoc(favRef, { advertId: adId });
            setFavourites([...favourites, adId]);
        }
    };

    return (
        <div className="browse-container">
            {/* Filters column (desktop) */}
            <div className="filters-column desktop-only">
                <h2>Filter by Breed</h2>
                <select>
                    <option>All Breeds</option>
                    <option>French Bulldog</option>
                    <option>Poodle</option>
                    <option>Labrador</option>
                    <option>Golden Retriever</option>
                </select>

                <h2>Postcode</h2>
                <input type="text" placeholder="Enter postcode" />
                <button className="filter-button">Apply Filters</button>
            </div>

            {/* Mobile Filters */}
            <div className="mobile-filter-bar mobile-only">
                <select>
                    <option>All Breeds</option>
                    <option>French Bulldog</option>
                    <option>Poodle</option>
                    <option>Labrador</option>
                    <option>Golden Retriever</option>
                </select>
                <input type="text" placeholder="Postcode" />
                <button className="filter-button">Apply</button>
            </div>

            {/* Stud Cards */}
            <div className="studs-column">
                {loading && <p>Loading adverts...</p>}

                {!loading && adverts.length === 0 && (
                    <p>No adverts found. Be the first to post!</p>
                )}

                {!loading && adverts.map((ad) => {
                    const createdAt = ad.createdAt?.seconds
                        ? new Date(ad.createdAt.seconds * 1000)
                        : new Date();

                    const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                        <Link
                            to={`/stud-details/${ad.id}`}
                            state={{ scrollY: window.scrollY }}
                            className="stud-card-link"
                            key={ad.id}
                        >
                            <div className="stud-card">
                                <img
                                    src={ad.images?.[0] || "https://placehold.co/150x150"}
                                    alt={ad.name}
                                    className="stud-image"
                                />
                                <div className="stud-details">
                                    <div className="stud-top">
                                        <span className="live-days">
                                            {daysSince === 0
                                                ? "Posted today"
                                                : `Live for ${daysSince} day${daysSince > 1 ? "s" : ""}`}
                                        </span>
                                        <FaHeart
                                            className={`fav-icon ${favourites.includes(ad.id) ? "active" : ""}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleFavourite(ad.id);
                                            }}
                                        />
                                    </div>
                                    <h3>Breed: {ad.breed}</h3>
                                    <p>Age: {ad.age} years</p>
                                    <p className="description-preview">
                                        {ad.description?.slice(0, 100)}...
                                    </p>
                                    <div className="breeder-info">
                                        Breeder: {ad.name}, {ad.location}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default BrowseStuds;
