// src/components/Recommended.jsx
import React, { useState, useEffect } from "react";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    getDoc,
    setDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import "./Recommended.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";
import { faHeart as fasHeart, faMapMarkerAlt, faDog, faCat, faPoundSign, faStar, faTrophy, faEye } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../firebase/firebaseAuth";

export default function Recommended({ ads = [], title, subtitle, browseLink }) {
    const [usersMap, setUsersMap] = useState({});
    const { currentUser } = useAuth();
    const [favourites, setFavourites] = useState({});

    // Fetch favorites
    useEffect(() => {
        if (!currentUser) return;

        async function fetchFavourites() {
            try {
                const favSnap = await getDocs(collection(db, "users", currentUser.uid, "favourites"));
                const favMap = {};
                favSnap.docs.forEach(doc => {
                    favMap[doc.id] = true;
                });
                setFavourites(favMap);
            } catch (error) {
                console.error("Error fetching favourites:", error);
            }
        }

        fetchFavourites();
    }, [currentUser]);

    useEffect(() => {
        async function enrichAds() {
            if (!ads || ads.length === 0) return;

            // Fetch all review data
            const revSnap = await getDocs(query(collection(db, "reviews"), where("approved", "==", true)));
            const reviews = revSnap.docs.map(doc => doc.data());

            // Build map of advertId → rating stats
            const stats = {};
            reviews.forEach(r => {
                if (!stats[r.advertId]) stats[r.advertId] = { sum: 0, count: 0 };
                stats[r.advertId].sum += r.rating;
                stats[r.advertId].count += 1;
            });

            // Fetch owner data
            const ownerIds = [...new Set(ads.map(ad => ad.ownerId).filter(Boolean))];
            const newUsersMap = {};

            await Promise.all(ownerIds.map(async (uid) => {
                const udoc = await getDoc(doc(db, "users", uid));
                if (udoc.exists()) {
                    newUsersMap[uid] = udoc.data();
                }
            }));

            setUsersMap(newUsersMap);

            // Enrich ads with ratings
            ads.forEach(ad => {
                const { sum = 0, count = 0 } = stats[ad.id] || {};
                ad.avgRating = count > 0 ? sum / count : 0;
                ad.reviewCount = count;
            });
        }

        enrichAds();
    }, [ads]);

    // Toggle favorite
    const toggleFavourite = async (e, adId) => {
        e.preventDefault(); // Prevent link navigation

        if (!currentUser) {
            alert("Please log in to save favourites.");
            return;
        }

        try {
            const favRef = doc(db, "users", currentUser.uid, "favourites", adId);
            const isFav = favourites[adId];

            if (isFav) {
                await deleteDoc(favRef);
            } else {
                await setDoc(favRef, {
                    advertId: adId,
                    addedAt: new Date()
                });
            }

            setFavourites(prev => ({
                ...prev,
                [adId]: !isFav
            }));
        } catch (err) {
            console.error("Failed to toggle favourite:", err);
        }
    };

    // Helper function to capitalize
    const capitalize = (str) => {
        if (typeof str !== "string" || str.length === 0) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Helper function to humanize
    const humanize = (str) => {
        if (!str) return "";
        return str
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    return (
        <div>
            <section className="recommended-studs-section">
                <div className="recommended-studs-container">
                    <h2 className="recommended-studs-title">
                        <FontAwesomeIcon icon={faTrophy} className="recommended-studs-trophy-icon" />
                        {title || "Top Rated Studs"}
                        <FontAwesomeIcon icon={faTrophy} className="recommended-studs-trophy-icon" />
                    </h2>

                    {subtitle ? (
                        <p className="recommended-studs-subtitle">{subtitle}</p>
                    ) : (
                        <p className="recommended-studs-subtitle">Our highest rated and most reviewed studs</p>
                    )}

                    <div className="recommended-studs-grid">
                        {ads.filter(dog => !dog.sold).map(dog => {
                            const breedLabel = dog.breedOrType ? humanize(dog.breedOrType) : "Unknown Breed";
                            const title = dog.title || dog.name || "Unnamed Stud";
                            // Location info or placeholder
                            const user = usersMap[dog.ownerId] || {};
                            const { city, county } = user;
                            const areaLabel =
                                city || county
                                    ? [city, county].filter(Boolean).join(", ")
                                    : dog.location
                                        ? `${dog.location.latitude?.toFixed(4)}, ${dog.location.longitude?.toFixed(4)}`
                                        : "Location N/A";

                            // Check if intent is sale to hide rating (case-insensitive)
                            const isSaleIntent = dog.intent && dog.intent.toLowerCase() === "sale";

                            return (
                                <div className="recommended-studs-card" key={dog.id}>
                                    <div className="recommended-studs-card-header">
                                        <div className="recommended-studs-price">
                                            <FontAwesomeIcon icon={faPoundSign} />
                                            <span>{dog.price || dog.fee || "200"}</span>
                                        </div>
                                        <div className="recommended-studs-controls">
                                            <div className="recommended-studs-trophy">
                                                <FontAwesomeIcon icon={faTrophy} />
                                            </div>
                                            <button
                                                className={`recommended-studs-favorite ${favourites[dog.id] ? "active" : ""}`}
                                                onClick={(e) => toggleFavourite(e, dog.id)}
                                                aria-label="Toggle Favourite"
                                            >
                                                <FontAwesomeIcon icon={favourites[dog.id] ? fasHeart : farHeart} />
                                            </button>
                                        </div>
                                    </div>

                                    <Link to={`/advert-details/${dog.id}`} className="recommended-studs-image-container">
                                        <img
                                            src={dog.images?.[0] || "https://placehold.co/400x300"}
                                            alt={title}
                                            className="recommended-studs-image"
                                        />
                                        <div className="recommended-studs-overlay">
                                            <span>View Details</span>
                                        </div>
                                    </Link>

                                    <div className="recommended-studs-content">
                                        <h3 className="recommended-studs-card-title">
                                            {title.length > 58 ? title.slice(0, 58) + "..." : title}
                                        </h3>

                                        {/* Spacer div to push details to bottom */}
                                        <div className="recommended-studs-spacer"></div>

                                        {/* Divider above details section */}
                                        <div className="recommended-studs-details-divider"></div>

                                        <div className="recommended-studs-details">
                                            <div className="recommended-studs-detail-item">
                                                <FontAwesomeIcon icon={dog.category === "cats" ? faCat : faDog} />
                                                <span>{breedLabel}</span>
                                            </div>
                                            <div className="recommended-studs-detail-item">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                <span>{areaLabel}</span>
                                            </div>
                                        </div>

                                        <div className="recommended-studs-card-footer">
                                            {/* Only show rating if intent is not sale */}
                                            {!isSaleIntent && (
                                                <div className="recommended-studs-rating">
                                                    <FontAwesomeIcon icon={faStar} className="recommended-studs-star-icon" />
                                                    <span className="recommended-studs-rating-value">
                                                        {dog.avgRating ? dog.avgRating.toFixed(1) : "N/A"}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="recommended-studs-views">
                                                <FontAwesomeIcon icon={faEye} />
                                                <span>{dog.views ?? 0}</span>
                                            </div>

                                            {/* Only show reviews if intent is not sale */}
                                            {!isSaleIntent && (
                                                <div className="recommended-studs-reviews">
                                                    <span>{dog.reviewCount}</span>
                                                    <span> {dog.reviewCount === 1 ? 'Review' : 'Reviews'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="recommended-studs-more">
                    <Link to={browseLink || "/browse"} className="recommended-studs-more-button">
                        Browse More Studs
                    </Link>
                </div>
            </section>
        </div>
    );
}