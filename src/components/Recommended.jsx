// src/components/Recommended.jsx
import React, { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import "./Recommended.css";

export default function Recommended() {
    const [dogs, setDogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommended() {
            setLoading(true);
            try {
                // 1️⃣ Fetch all approved adverts
                const adsSnap = await getDocs(
                    query(collection(db, "studAds"), where("approved", "==", true))
                );
                const ads = adsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2️⃣ Fetch all approved reviews
                const revSnap = await getDocs(
                    query(collection(db, "reviews"), where("approved", "==", true))
                );
                const reviews = revSnap.docs.map(doc => doc.data());

                // 3️⃣ Build a map of { advertId: { sumRating, count } }
                const stats = {};
                reviews.forEach(r => {
                    if (!stats[r.advertId]) stats[r.advertId] = { sum: 0, count: 0 };
                    stats[r.advertId].sum += r.rating;
                    stats[r.advertId].count += 1;
                });

                // 4️⃣ Attach avgRating & reviewCount to each ad
                const enriched = ads.map(ad => {
                    const { sum = 0, count = 0 } = stats[ad.id] || {};
                    return {
                        ...ad,
                        avgRating: count > 0 ? sum / count : 0,
                        reviewCount: count
                    };
                });

                // 5️⃣ Sort by avgRating desc, then reviewCount desc
                enriched.sort((a, b) => {
                    if (b.avgRating !== a.avgRating) {
                        return b.avgRating - a.avgRating;
                    }
                    return b.reviewCount - a.reviewCount;
                });

                // 6️⃣ Pick the top 8 (or whatever you like)
                setDogs(enriched.slice(0, 8));
            } catch (error) {
                console.error("Error fetching recommended studs:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommended();
    }, []);

    // Function to render rating stars
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating - fullStars >= 0.5;

        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className="star full">★</span>);
        }

        // Add half star if needed
        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">★</span>);
        }

        // Add empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
        }

        return stars;
    };

    return (
        <section className="recommended-section">
            <div className="container">
                <div className="section-header">
                    <h2>
                        <span className="award-icon">🏆</span>
                        Top Rated Stud Dogs
                        <span className="award-icon">🏆</span>
                    </h2>
                    <p className="section-subtitle">Our highest rated and most reviewed studs</p>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading top studs...</div>
                ) : (
                    <div className="stud-grid">
                        {dogs.map(dog => (
                            <Link to={`/stud-details/${dog.id}`} className="stud-card" key={dog.id}>
                                <div className="stud-image-wrapper">
                                    <div className="stud-image-container">
                                        <img
                                            src={dog.images?.[0] || "https://placehold.co/400x300"}
                                            alt={dog.name}
                                            className="stud-image"
                                        />
                                        {dog.fee && (
                                            <div className="stud-price">£{dog.fee}</div>
                                        )}
                                        <div className="award-badge">
                                            <span className="award-badge-icon">🏆</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stud-details">
                                    <h3 className="stud-name">{dog.name}</h3>
                                    <p className="stud-breed">{dog.breed}</p>
                                    <div className="stud-rating">
                                        <div className="stars">
                                            {renderStars(dog.avgRating)}
                                        </div>
                                        <span className="review-count">
                                            {dog.avgRating.toFixed(1)} ({dog.reviewCount} {dog.reviewCount === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}