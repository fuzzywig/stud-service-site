// src/pages/MyAdvertsPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPencilAlt, faTrashAlt,
    faInfoCircle, faTimes, faSync, faCheck, faHeart
} from "@fortawesome/free-solid-svg-icons";
import {
    collection, getDocs, query, where,
    updateDoc, deleteDoc, doc, getDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase.js";

import "./MyAdvertsPage.css";

export default function MyAdvertsPage() {
    const navigate = useNavigate();

    // State management
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userAds, setUserAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [showTooltip, setShowTooltip] = useState(false);
    const [filters, setFilters] = useState({
        sortBy: "newest"
    });

    // Check info panel preference
    useEffect(() => {
        if (localStorage.getItem("hideMyAdsInfoPanel") === "true") {
            setShowInfoPanel(false);
        }
    }, []);

    // Dismiss info panel handler
    const handleDismissInfoPanel = () => {
        setShowInfoPanel(false);
        localStorage.setItem("hideMyAdsInfoPanel", "true");
    };

    // Toggle tooltip
    const toggleTooltip = () => {
        setShowTooltip(!showTooltip);
    };

    // Authentication check
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) setCurrentUserId(user.uid);
            else navigate("/login");
        });
        return unsub;
    }, [navigate]);

    // Fetch user's ads with favorite counts
    useEffect(() => {
        const fetchUserAds = async () => {
            if (!currentUserId) return;

            setLoading(true);
            try {
                const adsSnap = await getDocs(
                    query(collection(db, "allListings"), where("ownerId", "==", currentUserId))
                );

                const rawAds = adsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Enrich each advert with calculated age and fetch favorite counts
                const enrichedAds = await Promise.all(rawAds.map(async (ad) => {
                    const ageLabel = formatAge(ad.dob);

                    // Try to get favorite count from favoritesCounts collection
                    let favoriteCount = 0;
                    try {
                        const countDoc = await getDoc(doc(db, "favoritesCounts", ad.id));
                        if (countDoc.exists()) {
                            favoriteCount = countDoc.data().count || 0;
                        }
                    } catch (error) {
                        console.log("Could not fetch favorite count for", ad.id);
                        favoriteCount = ad.favoriteCount || 0; // Fallback to stored value
                    }

                    return {
                        id: ad.id,
                        title: ad.title || ad.name || "",
                        images: Array.isArray(ad.images) ? ad.images : [],
                        breed: ad.breed || ad.breedOrType || "Unknown",
                        ageLabel,
                        expired: ad.expired || false,
                        approved: ad.approved || false,
                        sold: ad.sold || false,
                        createdAt: ad.createdAt || new Date(),
                        price: ad.price || 0,
                        description: ad.description || "",
                        favoriteCount: favoriteCount,
                        views: ad.views || 0
                    };
                }));

                setUserAds(enrichedAds);
            } catch (error) {
                console.error("Error fetching adverts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAds();
    }, [currentUserId]);

    function formatAge(dob) {
        if (!dob) return "";

        const birth = new Date(dob);
        const now = new Date();
        const diffMs = now - birth;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else if (diffDays < 60) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks !== 1 ? "s" : ""}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30.44);
            return `${months} month${months !== 1 ? "s" : ""}`;
        } else {
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                age--;
            }
            return `${age} year${age !== 1 ? "s" : ""}`;
        }
    }

    const handleDeleteAd = async (id, event) => {
        // Prevent event bubbling to parent links
        event && event.stopPropagation();
        event && event.preventDefault();

        if (!window.confirm("Are you sure you want to delete this advert?")) return;

        try {
            await deleteDoc(doc(db, "allListings", id));
            setUserAds((prev) => prev.filter((a) => a.id !== id));
        } catch (error) {
            console.error("Error deleting advert:", error);
            alert("Failed to delete advert. Please try again.");
        }
    };

    const handleRepublishAd = async (id, event) => {
        // Prevent event bubbling to parent links
        event && event.stopPropagation();
        event && event.preventDefault();

        try {
            await updateDoc(doc(db, "allListings", id), {
                expired: false,
                approved: false,
                resubmittedAt: new Date()
            });

            setUserAds(prev =>
                prev.map(a => a.id === id ? { ...a, expired: false } : a)
            );
            alert("Advert sent for re-approval.");
        } catch (error) {
            console.error("Error republishing advert:", error);
            alert("Failed to republish advert. Please try again.");
        }
    };

    // Filter and sort ads based on active tab
    const filteredAds = userAds.filter(ad => {
        if (activeTab === "active") {
            return ad.approved === true && ad.expired === false && ad.sold !== true;
        }

        if (activeTab === "pending") {
            return ad.approved === false && ad.expired === false && ad.sold !== true;
        }

        if (activeTab === "expired") {
            return ad.expired === true && ad.sold !== true;
        }

        if (activeTab === "sold") {
            return ad.sold === true;
        }

        return false;
    });

    // Sort filtered ads
    const sortedAds = [...filteredAds].sort((a, b) => {
        switch (filters.sortBy) {
            case "oldest":
                return new Date(a.createdAt) - new Date(b.createdAt);
            case "name":
                return a.name.localeCompare(b.name);
            case "price-high":
                return b.price - a.price;
            case "price-low":
                return a.price - b.price;
            case "newest":
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    function formatBreed(breed) {
        if (!breed) return "";
        return breed
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    // Format date for display
    function formatDate(value) {
        // Handle Firestore Timestamp
        if (value && typeof value.toDate === "function") {
            value = value.toDate();
        }

        // If it's already a Date, use it; otherwise try to coerce
        const date = value instanceof Date
            ? value
            : new Date(value);

        // Bail out on invalid dates
        if (isNaN(date.getTime())) return "";

        // Format as you like:
        return new Intl.DateTimeFormat("en-GB", {
            day:   "numeric",
            month: "short",
            year:  "numeric"
        }).format(date);
    }

    if (loading) {
        return (
            <div className="my-ads-loading-container">
                <div className="my-ads-loading-spinner"></div>
                <p>Loading your adverts...</p>
            </div>
        );
    }

    return (
        <div className="my-ads-container">
            {/* Header Section */}
            <div className="my-ads-header">
                <h1>My Pet Adverts</h1>
                {!showInfoPanel && (
                    <div className="my-ads-info-tooltip-container">
                        <button
                            className="my-ads-info-icon-btn"
                            onClick={toggleTooltip}
                            aria-label="Show advert information"
                        >
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </button>
                        {showTooltip && (
                            <div className="my-ads-info-tooltip">
                                <h4>How Adverts Work</h4>
                                <ul>
                                    <li><strong>New Adverts:</strong> After submission, your advert will be reviewed by our team within 24 hours.</li>
                                    <li><strong>Active Period:</strong> Adverts are live for 30 days, after which they expire automatically.</li>
                                    <li><strong>Republishing:</strong> Expired adverts can be republished with one click, requiring approval again.</li>
                                    <li><strong>Deletion Policy:</strong> Expired adverts not republished within 14 days will be permanently deleted.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Panel */}
            {showInfoPanel && (
                <div className="my-ads-info-panel">
                    <button
                        className="my-ads-info-close"
                        onClick={handleDismissInfoPanel}
                        aria-label="Close information panel"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    <div className="my-ads-info-content">
                        <FontAwesomeIcon icon={faInfoCircle} className="my-ads-info-icon" />
                        <div>
                            <h3>How Adverts Work</h3>
                            <ul>
                                <li><strong>New Adverts:</strong> After submission, your advert will be reviewed by our team within 24 hours.</li>
                                <li><strong>Active Period:</strong> Adverts are live for 30 days, after which they expire automatically.</li>
                                <li><strong>Republishing:</strong> Expired adverts can be republished with one click, requiring approval again.</li>
                                <li><strong>Deletion Policy:</strong> Expired adverts not republished within 14 days will be permanently deleted.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="my-ads-controls">
                <div className="my-ads-tabs">
                    <button
                        className={`my-ads-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active
                        <span className="my-ads-count">
                            {userAds.filter(ad => !ad.expired && ad.approved).length}
                        </span>
                    </button>
                    <button
                        className={`my-ads-tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending
                        <span className="my-ads-count">
                            {userAds.filter(ad => !ad.approved && !ad.expired).length}
                        </span>
                    </button>
                    <button
                        className={`my-ads-tab ${activeTab === 'sold' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sold')}
                    >
                        Sold
                        <span className="my-ads-count">
                            {userAds.filter(ad => ad.sold).length}
                        </span>
                    </button>
                    <button
                        className={`my-ads-tab ${activeTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expired')}
                    >
                        Expired
                        <span className="my-ads-count">
                            {userAds.filter(ad => ad.expired).length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {sortedAds.length === 0 ? (
                <div className="my-ads-empty">
                    <div className="my-ads-empty-icon">
                        {activeTab === 'active' && <FontAwesomeIcon icon={faInfoCircle} />}
                        {activeTab === 'pending' && <FontAwesomeIcon icon={faInfoCircle} />}
                        {activeTab === 'expired' && <FontAwesomeIcon icon={faSync} />}
                    </div>
                    <h3>No adverts found</h3>
                    <p>
                        {activeTab === 'active' && "You don't have any active adverts at the moment."}
                        {activeTab === 'pending' && "You don't have any adverts pending approval."}
                        {activeTab === 'expired' && "You don't have any expired adverts."}
                    </p>
                </div>
            ) : (
                /* Main Content: Cards View */
                <div className="my-ads-grid">
                    {sortedAds.map((ad) => (
                        <div key={ad.id} className="my-ads-card">
                            {/* Status Labels */}
                            {!ad.approved && !ad.expired && (
                                <div className="my-ads-status pending">Pending Approval</div>
                            )}
                            {ad.expired && (
                                <div className="my-ads-status expired">Expired</div>
                            )}
                            {ad.sold && (
                                <div className="my-ads-status sold">Sold</div>
                            )}

                            {/* Image Section */}
                            <div className="my-ads-image-container">
                                <Link to={`/advert-details/${ad.id}`} className="my-ads-image-link">
                                    <img
                                        src={ad.images[0] || "https://placehold.co/600x400?text=No+Image"}
                                        alt={ad.title}
                                        className="my-ads-image"
                                    />
                                </Link>

                                {/* Direct Action Buttons */}
                                <div className="my-ads-action-buttons">
                                    {!ad.sold && (
                                        <>
                                            <button
                                                className="my-ads-action-btn my-ads-edit-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    navigate(`/edit/${ad.id}`);
                                                }}
                                                aria-label="Edit advert"
                                            >
                                                <FontAwesomeIcon icon={faPencilAlt} />
                                            </button>

                                            {ad.expired ? (
                                                <button
                                                    className="my-ads-action-btn my-ads-republish-btn"
                                                    onClick={(e) => handleRepublishAd(ad.id, e)}
                                                    aria-label="Republish advert"
                                                >
                                                    <FontAwesomeIcon icon={faSync} />
                                                </button>
                                            ) : (
                                                <button
                                                    className="my-ads-action-btn my-ads-delete-btn"
                                                    onClick={(e) => handleDeleteAd(ad.id, e)}
                                                    aria-label="Delete advert"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            )}
                                            {!ad.expired && ad.approved && !ad.sold && (
                                                <button
                                                    className="my-ads-action-btn my-ads-sold-btn"
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (window.confirm("Mark this advert as sold? It will be removed from public listings.")) {
                                                            try {
                                                                await updateDoc(doc(db, "allListings", ad.id), { sold: true });
                                                                setUserAds(prev => prev.map(a =>
                                                                    a.id === ad.id ? { ...a, sold: true } : a
                                                                ));
                                                            } catch (err) {
                                                                console.error("Failed to mark as sold:", err);
                                                                alert("Something went wrong.");
                                                            }
                                                        }
                                                    }}
                                                    aria-label="Mark as Sold"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="my-ads-content">
                                <Link to={`/advert-details/${ad.id}`} className="my-ads-title-link">
                                    <h3 className="my-ads-title">{ad.title.length > 33 ? ad.title.slice(0, 33) + '…' : ad.title}</h3>
                                </Link>

                                <div className="my-ads-tags">
                                    <span className="my-ads-tag my-ads-breed-tag">
                                        {formatBreed(ad.breed)}
                                    </span>
                                    <span className="my-ads-tag my-ads-age-tag">
                                        {ad.ageLabel}
                                    </span>
                                    {ad.price > 0 && (
                                        <span className="my-ads-tag my-ads-price-tag">
                                            £{ad.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Stats Section - New! */}
                                <div className="my-ads-stats">
                                    <div className="my-ads-stat">
                                        <FontAwesomeIcon icon={faHeart} className="my-ads-stat-icon favorites" />
                                        <span className="my-ads-stat-value">{ad.favoriteCount}</span>
                                        <span className="my-ads-stat-label">Favourited</span>
                                    </div>
                                    {ad.views > 0 && (
                                        <div className="my-ads-stat">
                                            <FontAwesomeIcon icon={faInfoCircle} className="my-ads-stat-icon views" />
                                            <span className="my-ads-stat-value">{ad.views}</span>
                                            <span className="my-ads-stat-label">views</span>
                                        </div>
                                    )}
                                </div>

                                <div className="my-ads-date">
                                    {ad.expired ? 'Expired on' : 'Created on'}: {formatDate(ad.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}