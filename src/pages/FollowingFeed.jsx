import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import {
    FaUsers,
    FaDog,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUser,
    FaSpinner,
    FaEye,
    FaFilter,
    FaSortAmountDown,
    FaExclamationCircle,
    FaCheckSquare,
    FaSquare,
    FaCheck
} from "react-icons/fa";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNotifications } from "../context/NotificationContext";
import "./FollowingFeed.css";

// Helper function to pluralize breed names
function pluralizeBreed(breed, count) {
    if (count <= 1) return breed;

    // Handle special cases
    const specialPlurals = {
        'Husky': 'Huskies',
        'Puppy': 'Puppies',
        'Kitty': 'Kitties',
        'Pony': 'Ponies'
    };

    // Check if it's a special case
    for (const [singular, plural] of Object.entries(specialPlurals)) {
        if (breed.endsWith(singular)) {
            return breed.replace(new RegExp(singular + '$'), plural);
        }
    }

    // General rules
    if (breed.endsWith('y') && !/[aeiou]y$/i.test(breed)) {
        return breed.slice(0, -1) + 'ies';
    } else if (breed.endsWith('s') || breed.endsWith('x') || breed.endsWith('ch') || breed.endsWith('sh')) {
        return breed + 'es';
    } else {
        return breed + 's';
    }
}

// Format age helper function
function formatAge(dob) {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    const diffMs = now - birth;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 60) {
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

// Format date helper
function formatDate(date) {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
}

export default function FollowingFeed() {
    const navigate = useNavigate();
    const { refreshNotificationCount } = useNotifications();
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [allAdverts, setAllAdverts] = useState([]);
    const [filteredAdverts, setFilteredAdverts] = useState([]);
    const [selectedUser, setSelectedUser] = useState("all");
    const [selectedIntent, setSelectedIntent] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewedAdverts, setViewedAdverts] = useState(new Set());
    const [selectedAdverts, setSelectedAdverts] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

    // Auth listener - directly return the unsubscribe function
    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                navigate("/login");
            }
        });
    }, [navigate]);

    // Load viewed adverts from localStorage
    useEffect(() => {
        if (currentUserId) {
            const viewedKey = `followingFeed_viewed_${currentUserId}`;
            const viewed = localStorage.getItem(viewedKey);
            if (viewed) {
                try {
                    const viewedArray = JSON.parse(viewed);
                    setViewedAdverts(new Set(viewedArray));
                } catch (e) {
                    console.error("Error parsing viewed adverts:", e);
                    setViewedAdverts(new Set());
                }
            }
        }
    }, [currentUserId]);

    // Mark single advert as viewed
    const markAdvertAsViewed = (advertId) => {
        if (!currentUserId) return;

        const newViewedAdverts = new Set(viewedAdverts);
        newViewedAdverts.add(advertId);
        setViewedAdverts(newViewedAdverts);

        // Save to localStorage
        const viewedKey = `followingFeed_viewed_${currentUserId}`;
        localStorage.setItem(viewedKey, JSON.stringify(Array.from(newViewedAdverts)));

        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('advertViewed'));

        // Also call the context method as backup
        refreshNotificationCount();
    };

    // Mark multiple adverts as viewed
    const markSelectedAsViewed = () => {
        if (!currentUserId || selectedAdverts.size === 0) return;

        const newViewedAdverts = new Set(viewedAdverts);
        selectedAdverts.forEach(advertId => {
            newViewedAdverts.add(advertId);
        });
        setViewedAdverts(newViewedAdverts);

        // Save to localStorage
        const viewedKey = `followingFeed_viewed_${currentUserId}`;
        localStorage.setItem(viewedKey, JSON.stringify(Array.from(newViewedAdverts)));

        // Clear selection
        setSelectedAdverts(new Set());
        setSelectionMode(false);

        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('advertViewed'));
        refreshNotificationCount();
    };

    // Toggle advert selection
    const toggleAdvertSelection = (advertId) => {
        const newSelected = new Set(selectedAdverts);
        if (newSelected.has(advertId)) {
            newSelected.delete(advertId);
        } else {
            newSelected.add(advertId);
        }
        setSelectedAdverts(newSelected);

        // Exit selection mode if no items selected
        if (newSelected.size === 0) {
            setSelectionMode(false);
        }
    };

    // Select all visible new adverts
    const selectAllNew = () => {
        const newAdverts = new Set();
        filteredAdverts.forEach(advert => {
            const advertDate = advert.createdAt?.toDate ? advert.createdAt.toDate() : new Date(advert.createdAt);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const isRecent = advertDate > sevenDaysAgo;
            const isNew = isRecent && !viewedAdverts.has(advert.id);

            if (isNew) {
                newAdverts.add(advert.id);
            }
        });
        setSelectedAdverts(newAdverts);
        if (newAdverts.size > 0) {
            setSelectionMode(true);
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedAdverts(new Set());
        setSelectionMode(false);
    };

    // Fetch followed users and their adverts
    useEffect(() => {
        const fetchFollowingData = async () => {
            if (!currentUserId) return;

            try {
                setLoading(true);

                // 1. Get all users that the current user follows
                const followsQuery = query(
                    collection(db, "follows"),
                    where("followerId", "==", currentUserId)
                );
                const followsSnap = await getDocs(followsQuery);

                const followedUserIds = followsSnap.docs.map(doc => doc.data().followingId);

                if (followedUserIds.length === 0) {
                    setFollowedUsers([]);
                    setAllAdverts([]);
                    setFilteredAdverts([]);
                    setLoading(false);
                    return;
                }

                // 2. Get user details for all followed users
                const userPromises = followedUserIds.map(async (userId) => {
                    const userDoc = await getDoc(doc(db, "users", userId));
                    if (userDoc.exists()) {
                        return { id: userId, ...userDoc.data() };
                    }
                    return null;
                });

                const users = (await Promise.all(userPromises)).filter(user => user !== null);

                // 3. Get adverts from followed users
                const advertsQuery = query(
                    collection(db, "allListings"),
                    where("ownerId", "in", followedUserIds),
                    where("approved", "==", true),
                    orderBy("createdAt", "desc")
                );

                const advertsSnap = await getDocs(advertsQuery);
                const adverts = advertsSnap.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(ad => ad.expired === false && ad.sold !== true);

                // 4. Enrich adverts with user data
                const enrichedAdverts = adverts.map(advert => {
                    const user = users.find(u => u.id === advert.ownerId);
                    return {
                        ...advert,
                        ownerName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : "Unknown",
                        ownerAvatar: user?.avatar || "https://placehold.co/50",
                        ownerLocation: user ? `${user.city || ''}, ${user.county || ''}`.trim() : ""
                    };
                });

                // 5. Calculate breed specialization for each user
                const usersWithSpecialization = users.map(user => {
                    const userAdverts = enrichedAdverts.filter(ad => ad.ownerId === user.id);
                    const breedCounts = {};

                    userAdverts.forEach(ad => {
                        const breed = ad.breedOrType || ad.breed;
                        if (breed) {
                            breedCounts[breed] = (breedCounts[breed] || 0) + 1;
                        }
                    });

                    // Find the most common breed
                    let topBreed = null;
                    let maxCount = 0;
                    Object.entries(breedCounts).forEach(([breed, count]) => {
                        if (count > maxCount) {
                            maxCount = count;
                            topBreed = breed;
                        }
                    });

                    return {
                        ...user,
                        specialization: topBreed,
                        specializationCount: maxCount,
                        advertCount: userAdverts.length
                    };
                });

                setFollowedUsers(usersWithSpecialization);
                setAllAdverts(enrichedAdverts);
                setFilteredAdverts(enrichedAdverts);

            } catch (error) {
                console.error("Error fetching following data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowingData();
    }, [currentUserId]);

    // Filter and sort adverts
    useEffect(() => {
        let filtered = [...allAdverts];

        // Filter by user
        if (selectedUser !== "all") {
            filtered = filtered.filter(ad => ad.ownerId === selectedUser);
        }

        // Filter by intent
        if (selectedIntent !== "all") {
            filtered = filtered.filter(ad => ad.intent === selectedIntent);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "newest") {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            } else if (sortBy === "priceLow") {
                return (a.price || 0) - (b.price || 0);
            } else if (sortBy === "priceHigh") {
                return (b.price || 0) - (a.price || 0);
            }
            return 0;
        });

        setFilteredAdverts(filtered);
    }, [allAdverts, selectedUser, selectedIntent, sortBy]);

    // Count new adverts
    const newAdvertsCount = filteredAdverts.filter(advert => {
        const advertDate = advert.createdAt?.toDate ? advert.createdAt.toDate() : new Date(advert.createdAt);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isRecent = advertDate > sevenDaysAgo;
        return isRecent && !viewedAdverts.has(advert.id);
    }).length;

    if (loading) {
        return (
            <div className="ff-loading-container">
                <FaSpinner className="ff-loading-spinner" />
                <p>Loading your following feed...</p>
            </div>
        );
    }

    if (followedUsers.length === 0) {
        return (
            <div className="ff-container">
                <div className="ff-empty-state">
                    <FaUsers className="ff-empty-icon" />
                    <h2>You're not following anyone yet</h2>
                    <p>Start following breeders to see their latest adverts here!</p>
                    <button
                        className="ff-browse-btn"
                        onClick={() => navigate("/browse")}
                    >
                        Browse Adverts
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Your Following Feed | My Pet Connect</title>
                <meta name="robots" content="noindex,follow" />
            </Helmet>

        <div className="ff-container">
            <div className="ff-header">
                <h1 className="ff-title">
                    <FaUsers />
                    Following Feed
                </h1>
                <p className="ff-subtitle">
                    Latest adverts from breeders you follow
                </p>
            </div>

            {/* Bulk Actions Bar - Show when there are new adverts */}
            {newAdvertsCount > 0 && (
                <div className="ff-bulk-actions-bar">
                    {!selectionMode ? (
                        <>
                            <div className="ff-new-count">
                                {newAdvertsCount} new {newAdvertsCount === 1 ? 'advert' : 'adverts'}
                            </div>
                            <button
                                className="ff-select-mode-btn"
                                onClick={() => setSelectionMode(true)}
                            >
                                <FaCheckSquare />
                                Select Mode
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="ff-selection-info">
                                {selectedAdverts.size} selected
                            </div>
                            <div className="ff-selection-actions">
                                <button
                                    className="ff-select-all-btn"
                                    onClick={selectAllNew}
                                >
                                    Select All New
                                </button>
                                <button
                                    className="ff-mark-viewed-btn"
                                    onClick={markSelectedAsViewed}
                                    disabled={selectedAdverts.size === 0}
                                >
                                    <FaCheck />
                                    Mark as Viewed
                                </button>
                                <button
                                    className="ff-cancel-btn"
                                    onClick={clearSelection}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Users Section */}
            <div className="ff-users-section">
                <h2 className="ff-section-title">Following ({followedUsers.length})</h2>

                {/* Desktop view - keep existing scrolling bar */}
                <div className="ff-users-bar ff-desktop-only">
                    <button
                        className={`ff-user-chip ${selectedUser === "all" ? "active" : ""}`}
                        onClick={() => setSelectedUser("all")}
                    >
                        <span className="ff-user-avatar-small">All</span>
                        <span>All Users</span>
                        <span className="ff-user-count">{allAdverts.length}</span>
                    </button>
                    {followedUsers.map(user => {
                        const userAdvertCount = allAdverts.filter(ad => ad.ownerId === user.id).length;
                        return (
                            <button
                                key={user.id}
                                className={`ff-user-chip ${selectedUser === user.id ? "active" : ""}`}
                                onClick={() => setSelectedUser(user.id)}
                            >
                                <img
                                    src={user.avatar || "https://placehold.co/50"}
                                    alt={user.firstName}
                                    className="ff-user-avatar-small"
                                />
                                <div className="ff-user-chip-info">
                                    <span className="ff-user-name">{user.firstName}</span>
                                    {user.specialization && (
                                        <span className="ff-user-specialization">
                                            Specialises in {pluralizeBreed(user.specialization, user.specializationCount)}
                                        </span>
                                    )}
                                </div>
                                <span className="ff-user-count">{userAdvertCount}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile view - dropdown */}
                <div className="ff-mobile-only">
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="ff-user-dropdown-mobile"
                    >
                        <option value="all">All Users ({allAdverts.length} adverts)</option>
                        {followedUsers.map(user => {
                            const userAdvertCount = allAdverts.filter(ad => ad.ownerId === user.id).length;
                            return (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} ({userAdvertCount} adverts)
                                </option>
                            );
                        })}
                    </select>

                    {/* Show selected user details on mobile */}
                    {selectedUser !== "all" && (() => {
                        const user = followedUsers.find(u => u.id === selectedUser);
                        return user ? (
                            <div className="ff-selected-user-mobile">
                                <img
                                    src={user.avatar || "https://placehold.co/50"}
                                    alt={user.firstName}
                                    className="ff-selected-avatar-mobile"
                                />
                                <div className="ff-selected-info-mobile">
                                    <div className="ff-selected-name-mobile">{user.firstName} {user.lastName}</div>
                                    {user.specialization && (
                                        <div className="ff-selected-specialty-mobile">
                                            Specialises in {pluralizeBreed(user.specialization, user.specializationCount)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null;
                    })()}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="ff-filters-bar">
                <div className="ff-filter-group">
                    <FaFilter className="ff-filter-icon" />
                    <select
                        value={selectedIntent}
                        onChange={(e) => setSelectedIntent(e.target.value)}
                        className="ff-filter-select"
                    >
                        <option value="all">All Types</option>
                        <option value="stud">Stud Service</option>
                        <option value="sale">For Sale</option>
                    </select>
                </div>

                <div className="ff-filter-group">
                    <FaSortAmountDown className="ff-filter-icon" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="ff-filter-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="priceLow">Price: Low to High</option>
                        <option value="priceHigh">Price: High to Low</option>
                    </select>
                </div>

                <div className="ff-results-count">
                    {filteredAdverts.length} {filteredAdverts.length === 1 ? 'advert' : 'adverts'}
                </div>
            </div>

            {/* Adverts Grid */}
            {filteredAdverts.length === 0 ? (
                <div className="ff-no-results">
                    <FaExclamationCircle />
                    <p>No adverts found with current filters</p>
                </div>
            ) : (
                <div className="ff-adverts-grid">
                    {filteredAdverts.map((advert) => {
                        // Check if advert was created in the last 7 days AND hasn't been viewed
                        const advertDate = advert.createdAt?.toDate ? advert.createdAt.toDate() : new Date(advert.createdAt);
                        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        const isRecent = advertDate > sevenDaysAgo;
                        const isNew = isRecent && !viewedAdverts.has(advert.id);
                        const isSelected = selectedAdverts.has(advert.id);

                        return (
                            <div
                                key={advert.id}
                                className={`ff-advert-card ${isNew ? 'ff-new-advert' : ''} ${isSelected ? 'ff-selected' : ''}`}
                                onClick={() => {
                                    if (selectionMode) {
                                        toggleAdvertSelection(advert.id);
                                    } else {
                                        markAdvertAsViewed(advert.id);
                                        navigate(`/advert-details/${advert.id}`);
                                    }
                                }}
                            >
                                {isNew && <div className="ff-new-badge">NEW</div>}

                                {/* Selection checkbox */}
                                {selectionMode && (
                                    <div className="ff-selection-checkbox">
                                        {isSelected ? <FaCheckSquare /> : <FaSquare />}
                                    </div>
                                )}

                                {/* Owner Info Bar */}
                                <div className="ff-owner-bar">
                                    <img
                                        src={advert.ownerAvatar}
                                        alt={advert.ownerName}
                                        className="ff-owner-avatar"
                                    />
                                    <div className="ff-owner-info">
                                        <span className="ff-owner-name">{advert.ownerName}</span>
                                        <span className="ff-post-date">
                                            {formatDate(advert.createdAt)}
                                        </span>
                                    </div>
                                    <button
                                        className="ff-view-profile-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/profile/${advert.ownerId}`);
                                        }}
                                    >
                                        <FaUser />
                                    </button>
                                </div>

                                {/* Intent Badge */}
                                <div className={`ff-advert-intent ${advert.intent}`}>
                                    {advert.intent === 'stud' ? 'Stud Service' : 'For Sale'}
                                </div>

                                {/* Image */}
                                <div className="ff-advert-image-container">
                                    <img
                                        src={advert.images?.[advert.mainImageIndex || 0] || advert.images?.[0] || "https://placehold.co/600x400?text=No+Image"}
                                        alt={advert.title || advert.name}
                                        className="ff-advert-image"
                                    />
                                    {advert.images?.length > 1 && (
                                        <div className="ff-image-count">
                                            <FaEye />
                                            {advert.images.length}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="ff-advert-content">
                                    <h3 className="ff-advert-title">
                                        {advert.title || advert.name}
                                    </h3>

                                    <div className="ff-advert-details">
                                        <div className="ff-detail-item">
                                            <FaDog />
                                            <span>{advert.breedOrType || "Unknown Breed"}</span>
                                        </div>
                                        <div className="ff-detail-item">
                                            <FaCalendarAlt />
                                            <span>{formatAge(advert.dob)}</span>
                                        </div>
                                        {advert.ownerLocation && (
                                            <div className="ff-detail-item">
                                                <FaMapMarkerAlt />
                                                <span>{advert.ownerLocation}</span>
                                            </div>
                                        )}
                                    </div>

                                    {advert.price && (
                                        <div className="ff-advert-price">
                                            £{parseInt(advert.price).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

</>
    );
}