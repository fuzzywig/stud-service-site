import React, { useState, useEffect } from "react";
import { collection, deleteDoc,setDoc, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrophy, faCrown, faMedal, faStar, faFire, faChartLine,
    faEye, faHeart, faPaw, faAward, faGem, faBolt,
    faMapMarkerAlt, faPoundSign, faDog, faCat
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";
import "./TopStudsPage.css";

export default function TopStudsPage() {
    const [dogStuds, setDogStuds] = useState([]);
    const [catStuds, setCatStuds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favourites, setFavourites] = useState({});
    const [user, setUser] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [activeCategory, setActiveCategory] = useState('dogs'); // 'dogs' or 'cats'
    const auth = getAuth();

    // Track auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => setUser(u));
        return () => unsub();
    }, [auth]);

    // Load user's favorites
    useEffect(() => {
        if (!user) return;

        async function fetchFavourites() {
            try {
                const favSnap = await getDocs(collection(db, "users", user.uid, "favourites"));
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
    }, [user]);

    useEffect(() => {
        async function fetchTopStuds() {
            try {
                setLoading(true);

                // Fetch all approved studs
                const studsQuery = query(
                    collection(db, "allListings"),
                    where("approved", "==", true),
                    where("intent", "==", "stud")
                );

                const studsSnap = await getDocs(studsQuery);
                const allStuds = studsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Separate dogs and cats
                const dogs = allStuds.filter(s => s.category === "dogs");
                const cats = allStuds.filter(s => s.category === "cats");

                // Fetch all reviews to calculate ratings
                const revSnap = await getDocs(
                    query(collection(db, "reviews"), where("approved", "==", true))
                );
                const reviews = revSnap.docs.map(doc => doc.data());

                // Calculate rating stats
                const stats = {};
                reviews.forEach(r => {
                    if (!stats[r.advertId]) stats[r.advertId] = { sum: 0, count: 0 };
                    stats[r.advertId].sum += r.rating;
                    stats[r.advertId].count += 1;
                });

                // Fetch owner data
                const ownerIds = [...new Set(allStuds.map(ad => ad.ownerId).filter(Boolean))];
                const usersMap = {};

                await Promise.all(ownerIds.map(async (uid) => {
                    const udoc = await getDoc(doc(db, "users", uid));
                    if (udoc.exists()) {
                        usersMap[uid] = udoc.data();
                    }
                }));

                // Enrich studs with ratings and calculate performance score
                const enrichStuds = (studs) => {
                    return studs.map(stud => {
                        const { sum = 0, count = 0 } = stats[stud.id] || {};
                        const avgRating = count > 0 ? sum / count : 0;
                        const user = usersMap[stud.ownerId] || {};

                        // Calculate performance score
                        const viewScore = Math.min((stud.views || 0) / 1000, 1) * 40;
                        const ratingScore = (avgRating / 5) * 40;
                        const reviewScore = Math.min(count / 50, 1) * 20;
                        const performanceScore = viewScore + ratingScore + reviewScore;

                        return {
                            ...stud,
                            avgRating,
                            reviewCount: count,
                            performanceScore,
                            ownerData: user
                        };
                    });
                };

                // Enrich and sort both categories
                const enrichedDogs = enrichStuds(dogs).sort((a, b) => b.performanceScore - a.performanceScore);
                const enrichedCats = enrichStuds(cats).sort((a, b) => b.performanceScore - a.performanceScore);

                setDogStuds(enrichedDogs);
                setCatStuds(enrichedCats);

            } catch (err) {
                console.error("Error loading top studs:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchTopStuds();
    }, []);

    const toggleFavourite = async (e, adId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            alert("Please log in to save favourites.");
            return;
        }

        try {
            const favRef = doc(db, "users", user.uid, "favourites", adId);
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

    const getRankIcon = (rank) => {
        if (rank === 1) return { icon: faCrown, class: "rank-gold" };
        if (rank === 2) return { icon: faTrophy, class: "rank-silver" };
        if (rank === 3) return { icon: faMedal, class: "rank-bronze" };
        return { icon: faAward, class: "rank-standard" };
    };

    const getPerformanceTier = (score) => {
        if (score >= 80) return { tier: "Diamond Elite", icon: faGem, class: "tier-diamond" };
        if (score >= 60) return { tier: "Platinum", icon: faBolt, class: "tier-platinum" };
        if (score >= 40) return { tier: "Gold", icon: faStar, class: "tier-gold" };
        return { tier: "Rising Star", icon: faChartLine, class: "tier-rising" };
    };

    const humanize = (str) => {
        if (!str) return "";
        return str
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    if (loading) {
        return (
            <div className="elite-loading">
                <FontAwesomeIcon icon={faTrophy} className="elite-loading-icon" spin />
                <p>Loading Elite Performers...</p>
            </div>
        );
    }

    // Get current category data
    const currentStuds = activeCategory === 'dogs' ? dogStuds : catStuds;
    const categoryIcon = activeCategory === 'dogs' ? faDog : faCat;
    const categoryName = activeCategory === 'dogs' ? 'Dog' : 'Cat';

    return (
        <div className="elite-studs-page">
            {/* Animated background elements */}
            <div className="elite-bg-glow"></div>
            <div className="elite-particles"></div>

            {/* Hero Section */}
            <section className="elite-hero">
                <div className="elite-hero-content">
                    <div className="elite-badge-container">
                        <FontAwesomeIcon icon={faCrown} className="elite-crown-icon" />
                    </div>
                    <h1 className="elite-title">
                        <span className="elite-title-accent">Elite</span> Hall of Fame
                    </h1>
                    <p className="elite-subtitle">
                        Where Excellence Meets Recognition
                    </p>

                    {/* Filter Buttons */}
                    <div className="elite-filter-container">
                        <button
                            className={`elite-filter-btn ${activeCategory === 'dogs' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('dogs')}
                        >
                            <FontAwesomeIcon icon={faDog} />
                            <span>Elite Dogs ({dogStuds.length})</span>
                        </button>
                        <button
                            className={`elite-filter-btn ${activeCategory === 'cats' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('cats')}
                        >
                            <FontAwesomeIcon icon={faCat} />
                            <span>Elite Cats ({catStuds.length})</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Explanation Section */}
            <section className="elite-explanation">
                <div className="elite-explanation-content">
                    <div className="elite-explanation-grid">
                        <div className="elite-explanation-card">
                            <FontAwesomeIcon icon={faTrophy} className="elite-explanation-icon" />
                            <h3>Merit-Based Rankings</h3>
                            <p>Our sophisticated algorithm combines views, ratings, and reviews to identify truly exceptional studs. This isn't just popularity – it's proven excellence backed by real breeding success.</p>
                        </div>
                        <div className="elite-explanation-card">
                            <FontAwesomeIcon icon={faChartLine} className="elite-explanation-icon" />
                            <h3>Performance Metrics</h3>
                            <p>Every stud here has earned their position through consistent high ratings, extensive positive reviews, and genuine interest from the breeding community.</p>
                        </div>
                        <div className="elite-explanation-card">
                            <FontAwesomeIcon icon={faGem} className="elite-explanation-icon" />
                            <h3>Elite Recognition</h3>
                            <p>Being featured here means standing among the top 1% of all studs. These are proven sires with exceptional genetics, temperament, and breeding success rates.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Top 3 Showcase */}
            {currentStuds.length >= 3 && (
                <section className="elite-podium-section">
                    <h2 className="elite-section-title">
                        <FontAwesomeIcon icon={faCrown} /> Top 3 {categoryName} Champions <FontAwesomeIcon icon={faCrown} />
                    </h2>
                    <div className="elite-podium">
                        {/* Silver - 2nd Place */}
                        <div className="elite-podium-spot elite-podium-second">
                            <div className="elite-podium-card">
                                <div className="elite-rank-badge rank-silver">
                                    <FontAwesomeIcon icon={faTrophy} />
                                    <span>2nd</span>
                                </div>
                                <Link to={`/advert-details/${currentStuds[1].id}`} className="elite-podium-image">
                                    <img src={currentStuds[1].images?.[0] || "https://placehold.co/400x300"} alt={currentStuds[1].name} />
                                    <div className="elite-podium-overlay">
                                        <span>View Profile</span>
                                    </div>
                                </Link>
                                <div className="elite-podium-info">
                                    <h3 className="elite-podium-name">{currentStuds[1].name || "Unknown"}</h3>
                                    <p className="elite-podium-breed">{currentStuds[1].breedOrType ? humanize(currentStuds[1].breedOrType) : "Unknown Breed"}</p>
                                </div>
                                <div className="elite-podium-stats">
                                    <span><FontAwesomeIcon icon={faStar} /> {currentStuds[1].avgRating.toFixed(1)}</span>
                                    <span><FontAwesomeIcon icon={faEye} /> {currentStuds[1].views || 0}</span>
                                </div>
                            </div>
                            <div className="elite-podium-base elite-podium-base-2">2</div>
                        </div>

                        {/* Gold - 1st Place */}
                        <div className="elite-podium-spot elite-podium-first">
                            <div className="elite-crown-animation">
                                <FontAwesomeIcon icon={faCrown} />
                            </div>
                            <div className="elite-podium-card">
                                <div className="elite-rank-badge rank-gold">
                                    <FontAwesomeIcon icon={faCrown} />
                                    <span>1st</span>
                                </div>
                                <Link to={`/advert-details/${currentStuds[0].id}`} className="elite-podium-image">
                                    <img src={currentStuds[0].images?.[0] || "https://placehold.co/400x300"} alt={currentStuds[0].name} />
                                    <div className="elite-podium-overlay">
                                        <span>View Profile</span>
                                    </div>
                                </Link>
                                <div className="elite-podium-info">
                                    <h3 className="elite-podium-name">{currentStuds[0].name || "Unknown"}</h3>
                                    <p className="elite-podium-breed">{currentStuds[0].breedOrType ? humanize(currentStuds[0].breedOrType) : "Unknown Breed"}</p>
                                </div>
                                <div className="elite-podium-stats">
                                    <span><FontAwesomeIcon icon={faStar} /> {currentStuds[0].avgRating.toFixed(1)}</span>
                                    <span><FontAwesomeIcon icon={faEye} /> {currentStuds[0].views || 0}</span>
                                </div>
                            </div>
                            <div className="elite-podium-base elite-podium-base-1">1</div>
                        </div>

                        {/* Bronze - 3rd Place */}
                        <div className="elite-podium-spot elite-podium-third">
                            <div className="elite-podium-card">
                                <div className="elite-rank-badge rank-bronze">
                                    <FontAwesomeIcon icon={faMedal} />
                                    <span>3rd</span>
                                </div>
                                <Link to={`/advert-details/${currentStuds[2].id}`} className="elite-podium-image">
                                    <img src={currentStuds[2].images?.[0] || "https://placehold.co/400x300"} alt={currentStuds[2].name} />
                                    <div className="elite-podium-overlay">
                                        <span>View Profile</span>
                                    </div>
                                </Link>
                                <div className="elite-podium-info">
                                    <h3 className="elite-podium-name">{currentStuds[2].name || "Unknown"}</h3>
                                    <p className="elite-podium-breed">{currentStuds[2].breedOrType ? humanize(currentStuds[2].breedOrType) : "Unknown Breed"}</p>
                                </div>
                                <div className="elite-podium-stats">
                                    <span><FontAwesomeIcon icon={faStar} /> {currentStuds[2].avgRating.toFixed(1)}</span>
                                    <span><FontAwesomeIcon icon={faEye} /> {currentStuds[2].views || 0}</span>
                                </div>
                            </div>
                            <div className="elite-podium-base elite-podium-base-3">3</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Show message if category has less than 3 studs */}
            {currentStuds.length > 0 && currentStuds.length < 3 && (
                <section className="elite-limited-section">
                    <div className="elite-limited-message">
                        <FontAwesomeIcon icon={faAward} className="elite-limited-icon" />
                        <h3>Limited Elite {categoryName} Studs Available</h3>
                        <p>Only {currentStuds.length} elite {activeCategory === 'dogs' ? 'dog' : 'cat'} stud{currentStuds.length === 1 ? '' : 's'} currently meet our prestigious standards</p>
                    </div>
                </section>
            )}

            {/* Elite Grid - Rest of the studs */}
            {currentStuds.length > 3 && (
                <section className="elite-grid-section">
                    <h2 className="elite-section-title">
                        <FontAwesomeIcon icon={faFire} /> More Elite {categoryName} Studs <FontAwesomeIcon icon={faFire} />
                    </h2>
                    <div className="elite-grid">
                        {currentStuds.slice(3).map((stud, index) => {
                            const rank = index + 4;
                            const rankInfo = getRankIcon(rank);
                            const tierInfo = getPerformanceTier(stud.performanceScore);
                            const breedLabel = stud.breedOrType ? humanize(stud.breedOrType) : "Unknown Breed";
                            const title = stud.title || stud.name || "Unnamed Stud";
                            const { city, county } = stud.ownerData || {};
                            const areaLabel = city || county
                                ? [city, county].filter(Boolean).join(", ")
                                : "Location N/A";

                            return (
                                <div
                                    key={stud.id}
                                    className={`elite-card ${hoveredCard === stud.id ? 'elite-card-hovered' : ''}`}
                                    onMouseEnter={() => setHoveredCard(stud.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    {/* Rank Badge */}
                                    <div className={`elite-rank-corner ${rankInfo.class}`}>
                                        <FontAwesomeIcon icon={rankInfo.icon} />
                                        <span>#{rank}</span>
                                    </div>

                                    {/* Performance Tier */}
                                    <div className={`elite-tier-badge ${tierInfo.class}`}>
                                        <FontAwesomeIcon icon={tierInfo.icon} />
                                        <span>{tierInfo.tier}</span>
                                    </div>

                                    {/* Favorite Button */}
                                    <button
                                        className={`elite-favorite-btn ${favourites[stud.id] ? 'active' : ''}`}
                                        onClick={(e) => toggleFavourite(e, stud.id)}
                                    >
                                        <FontAwesomeIcon icon={favourites[stud.id] ? faHeart : farHeart} />
                                    </button>

                                    {/* Image */}
                                    <Link to={`/advert-details/${stud.id}`} className="elite-card-image">
                                        <img src={stud.images?.[0] || "https://placehold.co/400x300"} alt={title} />
                                        <div className="elite-card-overlay">
                                            <div className="elite-overlay-content">
                                                <FontAwesomeIcon icon={faPaw} className="elite-overlay-icon" />
                                                <span>View Elite Profile</span>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="elite-card-content">
                                        <h3 className="elite-card-title">
                                            {title.length > 50 ? title.slice(0, 50) + "..." : title}
                                        </h3>

                                        <div className="elite-card-details">
                                            <div className="elite-detail">
                                                <FontAwesomeIcon icon={stud.category === "cats" ? faCat : faDog} />
                                                <span>{breedLabel}</span>
                                            </div>
                                            <div className="elite-detail">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                <span>{areaLabel}</span>
                                            </div>
                                        </div>

                                        {/* Stats Bar */}
                                        <div className="elite-stats-bar">
                                            <div className="elite-stat">
                                                <FontAwesomeIcon icon={faStar} className="stat-icon-gold" />
                                                <span>{stud.avgRating ? stud.avgRating.toFixed(1) : "N/A"}</span>
                                            </div>
                                            <div className="elite-stat">
                                                <FontAwesomeIcon icon={faEye} />
                                                <span>{stud.views || 0}</span>
                                            </div>
                                            <div className="elite-stat">
                                                <span className="elite-review-count">{stud.reviewCount}</span>
                                                <span className="elite-review-label">Reviews</span>
                                            </div>
                                        </div>

                                        {/* Price Badge */}
                                        <div className="elite-price-badge">
                                            <FontAwesomeIcon icon={faPoundSign} />
                                            <span>{stud.price || stud.fee || "200"}</span>
                                        </div>

                                        {/* Performance Meter */}
                                        <div className="elite-performance-meter">
                                            <div className="elite-meter-label">Performance Score</div>
                                            <div className="elite-meter-bar">
                                                <div
                                                    className="elite-meter-fill"
                                                    style={{ width: `${stud.performanceScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* No studs message */}
            {currentStuds.length === 0 && (
                <section className="elite-empty-section">
                    <div className="elite-empty-message">
                        <FontAwesomeIcon icon={categoryIcon} className="elite-empty-icon" />
                        <h3>No Elite {categoryName} Studs Yet</h3>
                        <p>Be the first to list an elite {activeCategory === 'dogs' ? 'dog' : 'cat'} stud!</p>
                        <Link to="/create-listing" className="elite-cta-primary">
                            List Your Stud
                        </Link>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="elite-cta-section">
                <div className="elite-cta-content">
                    <h2>Want to Join the Elite?</h2>
                    <p>List your stud and start building your reputation today</p>
                    <div className="elite-cta-buttons">
                        <Link to="/create-listing" className="elite-cta-primary">
                            List Your Stud
                        </Link>
                        <Link to="/browse" className="elite-cta-secondary">
                            Browse All Studs
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}