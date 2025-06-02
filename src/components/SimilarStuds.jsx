// src/components/SimilarStuds.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import "./SimilarStuds.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faDog, faPoundSign, faStar, faEye } from "@fortawesome/free-solid-svg-icons";

function SimilarStuds({ breedOrType, intent, currentAdvertId }) {
    const [similarAds, setSimilarAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usersMap, setUsersMap] = useState({});
    const [ratingsMap, setRatingsMap] = useState({});

    useEffect(() => {
        async function fetchSimilarAds() {
            if (!breedOrType || !intent) return;

            try {
                // Fetch similar ads by breedOrType and intent from allListings
                const q = query(
                    collection(db, "allListings"),
                    where("breedOrType", "==", breedOrType),
                    where("intent", "==", intent),
                    where("approved", "==", true)
                );
                const snap = await getDocs(q);

                const ads = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(ad => ad.id !== currentAdvertId); // Exclude current advert

                const shuffled = ads.sort(() => 0.5 - Math.random());
                const limitedAds = shuffled.slice(0, 8); // 8 ads max
                setSimilarAds(limitedAds);

                // Fetch user data for these ads
                const ownerIds = Array.from(new Set(limitedAds.map(ad => ad.ownerId).filter(Boolean)));
                const map = {};
                await Promise.all(
                    ownerIds.map(async uid => {
                        if (uid) {
                            const udoc = await getDoc(doc(db, "users", uid));
                            if (udoc.exists()) map[uid] = udoc.data();
                        }
                    })
                );
                setUsersMap(map);

                // Fetch ratings for these ads
                const ratingsMap = {};
                await Promise.all(
                    limitedAds.map(async ad => {
                        // Query for reviews
                        const reviewsQ = query(
                            collection(db, "reviews"),
                            where("advertId", "==", ad.id),
                            where("approved", "==", true)
                        );
                        const reviewsSnap = await getDocs(reviewsQ);
                        const reviews = reviewsSnap.docs.map(d => d.data());

                        if (reviews.length > 0) {
                            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                            ratingsMap[ad.id] = {
                                avgRating: totalRating / reviews.length,
                                reviewCount: reviews.length
                            };
                        } else {
                            ratingsMap[ad.id] = { avgRating: 0, reviewCount: 0 };
                        }
                    })
                );
                setRatingsMap(ratingsMap);

            } catch (error) {
                console.error("Error fetching similar ads:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSimilarAds();
    }, [breedOrType, intent, currentAdvertId]);

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

    if (loading) {
        return (
            <section className="similar-studs-section">
                <div className="similar-studs-container">
                    <h2 className="similar-studs-title">
                        Similar {intent === 'sale' ? 'Pets for Sale' : 'Studs'}
                    </h2>
                    <div className="similar-studs-loading">
                        Loading similar {intent === 'sale' ? 'pets' : 'studs'}...
                    </div>
                </div>
            </section>
        );
    }

    if (!similarAds.length) return null;

    return (
        <section className="similar-studs-section">
            <div className="similar-studs-container">
                <h2 className="similar-studs-title">
                    Similar {intent === 'sale' ? 'Pets for Sale' : 'Studs'}
                </h2>
                <div className="similar-studs-grid">
                    {similarAds.map(ad => {
                        const breedLabel = ad.breedOrType || ad.breed || "Unknown Breed";
                        const title = ad.title || ad.name || "Unnamed";

                        // Location info
                        const user = usersMap[ad.ownerId] || {};
                        const { city, county } = user;
                        const areaLabel = city || county
                            ? [city, county].filter(Boolean).join(", ")
                            : ad.city || ad.location?.city || "Location N/A";

                        // Rating info
                        const rating = ratingsMap[ad.id] || { avgRating: 0, reviewCount: 0 };

                        // Get main image based on mainImageIndex
                        const mainImage = ad.mainImageIndex !== undefined && ad.images?.[ad.mainImageIndex]
                            ? ad.images[ad.mainImageIndex]
                            : ad.images?.[0] || "https://placehold.co/400x300";

                        return (
                            <div className="similar-studs-card" key={ad.id}>
                                <div className="similar-studs-card-header">
                                    <div className="similar-studs-price">
                                        <FontAwesomeIcon icon={faPoundSign} />
                                        <span>{ad.price || ad.fee || "POA"}</span>
                                    </div>
                                </div>

                                <Link to={`/advert-details/${ad.id}`} className="similar-studs-image-container">
                                    <img
                                        src={mainImage}
                                        alt={title}
                                        className="similar-studs-image"
                                    />
                                    <div className="similar-studs-overlay">
                                        <span>View Details</span>
                                    </div>
                                </Link>

                                <div className="similar-studs-content">
                                    <h3 className="similar-studs-card-title">
                                        {title.length > 58 ? title.slice(0, 58) + "..." : title}
                                    </h3>

                                    {/* Spacer div to push details to bottom */}
                                    <div className="similar-studs-spacer"></div>

                                    {/* Divider above details section */}
                                    <div className="similar-studs-details-divider"></div>

                                    <div className="similar-studs-details">
                                        <div className="similar-studs-detail-item">
                                            <FontAwesomeIcon icon={faDog} />
                                            <span>{breedLabel}</span>
                                        </div>
                                        <div className="similar-studs-detail-item">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                                            <span>{areaLabel}</span>
                                        </div>
                                    </div>

                                    <div className="similar-studs-card-footer">
                                        <div className="similar-studs-rating">
                                            <FontAwesomeIcon icon={faStar} className="similar-studs-star-icon" />
                                            <span className="similar-studs-rating-value">
                                                {rating.avgRating ? rating.avgRating.toFixed(1) : "0.0"}
                                            </span>
                                        </div>

                                        <div className="similar-studs-views">
                                            <FontAwesomeIcon icon={faEye} />
                                            <span>{ad.views ?? 0}</span>
                                        </div>

                                        <div className="similar-studs-reviews">
                                            <span>{rating.reviewCount}</span>
                                            <span> {rating.reviewCount === 1 ? 'Review' : 'Reviews'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default SimilarStuds;