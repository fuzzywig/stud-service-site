// src/pages/admin/AdminUIDInspector.jsx
import React, { useState } from "react";
import {
    getDoc,
    doc,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import { Link } from "react-router-dom";
import {
    FaSearch,
    FaUser,
    FaAd,
    FaStar,
    FaEdit,
    FaCommentAlt,
    FaExclamationCircle,
    FaSpinner,
    FaChevronRight,
    FaIdCard,
    FaCalendarAlt,
    FaClock,
    FaCheckCircle,
    FaTimes,
    FaEnvelope,
    FaPhone,
    FaHome,
    FaMapMarkerAlt,
    FaCity,
    FaMap,
    FaMailBulk,
    FaShieldAlt,
    FaUserShield,
    FaHeart,
    FaBan,
    FaSignInAlt,
    FaEye
} from "react-icons/fa";
import "./AdminUIDInspector.css";

export default function AdminUIDInspector() {
    const [uid, setUid] = useState("");
    const [filters, setFilters] = useState({
        profile: true,
        adverts: true,
        reviewsWritten: true,
        reviewsReceived: true,
        adminNotes: true,
        conversations: false
    });
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedSections, setExpandedSections] = useState({});
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const filterConfig = [
        { key: "profile", label: "Profile", icon: <FaUser />, description: "User account information" },
        { key: "adverts", label: "Adverts", icon: <FaAd />, description: "Posted advertisements" },
        { key: "reviewsWritten", label: "Reviews Written", icon: <FaEdit />, description: "Reviews by user" },
        { key: "reviewsReceived", label: "Reviews Received", icon: <FaStar />, description: "Reviews about user" },
        { key: "adminNotes", label: "Admin Notes", icon: <FaCommentAlt />, description: "Internal notes" },
        { key: "conversations", label: "Conversations", icon: <FaCommentAlt />, description: "User messages" }
    ];

    const handleToggle = (filterKey) => {
        setFilters((prev) => ({ ...prev, [filterKey]: !prev[filterKey] }));
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSearch = async () => {
        if (!uid.trim()) {
            setError("Please enter a UID to search");
            return;
        }

        setLoading(true);
        setError("");
        setResults({});
        setExpandedSections({});

        const res = {};
        let foundUserId = null;

        try {
            if (filters.profile) {
                // First, try direct lookup (for full UID)
                try {
                    const userSnap = await getDoc(doc(db, "users", uid));
                    if (userSnap.exists()) {
                        res.profile = userSnap.data();
                        foundUserId = uid;
                        setExpandedSections(prev => ({ ...prev, profile: true }));
                    }
                } catch {
                    // Direct lookup failed, continue to partial search
                    // No need to use 'err' here
                }

                // If no direct match and search term is 10 chars or less, search all users
                if (!res.profile && uid.length <= 10) {
                    const usersQuery = collection(db, "users");
                    const usersSnap = await getDocs(usersQuery);

                    const matches = [];
                    usersSnap.forEach((doc) => {
                        const userId = doc.id;
                        // Check if the last N characters of the userId match the search term
                        if (userId.endsWith(uid)) {
                            matches.push({
                                id: userId,
                                data: doc.data()
                            });
                        }
                    });

                    if (matches.length === 1) {
                        // Single match found, use it
                        res.profile = matches[0].data;
                        foundUserId = matches[0].id;
                        setExpandedSections(prev => ({ ...prev, profile: true }));
                    } else if (matches.length > 1) {
                        // Multiple matches found - store them for display
                        res.multipleMatches = matches;
                        setResults(res);
                        setLoading(false);
                        return; // Don't continue with other queries
                    } else if (matches.length === 0) {
                        setError(`No users found with UID ending in "${uid}"`);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Use the found userId for other queries (if we found a single user)
            const uidToUse = foundUserId || uid;

            if (foundUserId || uid.length > 10) {
                // Only proceed with other queries if we found a user or have a full UID
                if (filters.adverts) {
                    const adQuery = query(collection(db, "allListings"), where("ownerId", "==", uidToUse));
                    const adSnap = await getDocs(adQuery);
                    res.adverts = adSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                if (filters.reviewsWritten) {
                    const rwQuery = query(collection(db, "reviews"), where("reviewerId", "==", uidToUse));
                    const rwSnap = await getDocs(rwQuery);
                    res.reviewsWritten = rwSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                if (filters.reviewsReceived) {
                    const rrQuery = query(collection(db, "reviews"), where("ownerId", "==", uidToUse));
                    const rrSnap = await getDocs(rrQuery);
                    res.reviewsReceived = rrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                if (filters.adminNotes) {
                    const anQuery = query(collection(db, "adminNotes"), where("userId", "==", uidToUse));
                    const anSnap = await getDocs(anQuery);
                    res.adminNotes = anSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                if (filters.conversations) {
                    const convQuery = query(collection(db, "conversations"), where("participants", "array-contains", uidToUse));
                    const convSnap = await getDocs(convQuery);
                    res.conversations = convSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            }

            // If we used a partial search, show which full UID was found
            if (foundUserId && foundUserId !== uid) {
                // Success message instead of error
                setError(`✓ Found user with full UID: ${foundUserId}`);
            }

            setResults(res);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to fetch some data. Check the console for details.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Unknown date";
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleString();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="admin-uid-inspector-page">
            <AdminSidebar />

            <div className="uid-content-area">
                <div className="uid-page-header">
                    <div className="uid-header-content">
                        <h1 className="uid-page-title">UID Inspector</h1>
                        <p className="uid-page-description">
                            Search and inspect detailed user data across all collections
                        </p>
                    </div>
                </div>

                <div className="uid-search-panel">
                    <div className="uid-search-section">
                        <h2 className="uid-section-title">Search User</h2>
                        <div className="uid-search-container">
                            <div className="uid-search-input-wrapper">
                                <FaIdCard className="uid-search-icon" />
                                <input
                                    type="text"
                                    className="uid-search-input"
                                    placeholder="Enter full UID or last 10 digits..."
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                            </div>
                            <button
                                className="uid-search-button"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="uid-spinner" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <FaSearch />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="uid-filters-section">
                        <h3 className="uid-filters-title">Select Data to Retrieve</h3>
                        <div className="uid-filters-grid">
                            {filterConfig.map((filter) => (
                                <div
                                    key={filter.key}
                                    className={`uid-filter-item ${filters[filter.key] ? 'active' : ''}`}
                                    onClick={() => handleToggle(filter.key)}
                                >
                                    <div className="uid-filter-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="uid-filter-checkbox"
                                            checked={filters[filter.key]}
                                            onChange={() => {}}
                                        />
                                        <div className={`uid-custom-checkbox ${filters[filter.key] ? 'checked' : ''}`}>
                                            {filters[filter.key] && <FaCheckCircle />}
                                        </div>
                                    </div>
                                    <div className="uid-filter-content">
                                        <div className="uid-filter-header">
                                            <span className="uid-filter-icon">{filter.icon}</span>
                                            <span className="uid-filter-label">{filter.label}</span>
                                        </div>
                                        <p className="uid-filter-description">{filter.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="uid-error-message">
                        <FaExclamationCircle className="uid-error-icon" />
                        <span>{error}</span>
                        <button
                            className="uid-error-close"
                            onClick={() => setError("")}
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                <div className="uid-results">
                    {/* Multiple Matches Warning - ADD IT HERE */}
                    {results.multipleMatches && results.multipleMatches.length > 0 && (
                        <div className="uid-warning-message">
                            <FaExclamationCircle className="uid-warning-icon" />
                            <div className="uid-warning-content">
                                <h3>Multiple users found with UID ending in "{uid}"</h3>
                                <p>Found {results.multipleMatches.length} matching users. Please select one or use a more specific search:</p>

                                <div className="uid-matches-list">
                                    {results.multipleMatches.map((match) => (
                                        <div key={match.id} className="uid-match-item">
                                            <div className="uid-match-info">
                                                <strong>{match.data.firstName} {match.data.lastName}</strong>
                                                <span className="uid-match-email">{match.data.email}</span>
                                                <code className="uid-match-id">{match.id}</code>
                                            </div>
                                            <button
                                                className="uid-match-select-btn"
                                                onClick={() => {
                                                    setUid(match.id);
                                                    handleSearch();
                                                }}
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Profile Section */}
                    {results.profile && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('profile')}
                            >
                                <div className="uid-result-title-wrapper">
                                    {results.profile.avatar ? (
                                        <img
                                            src={results.profile.avatar}
                                            alt={`${results.profile.firstName} ${results.profile.lastName}`}
                                            className="uid-result-avatar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAvatarModal(true);
                                            }}
                                            title="Click to view"
                                        />
                                    ) : (
                                        <FaUser className="uid-result-icon" />
                                    )}
                                    <h2 className="uid-result-title">Profile Information</h2>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.profile ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.profile && (
                                <div className="uid-result-content">
                                    <div className="uid-profile-grid">
                                        <div className="uid-profile-field">
                                            <label><FaUser className="uid-field-icon" /> Full Name</label>
                                            <span>{results.profile.firstName} {results.profile.lastName}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaEnvelope className="uid-field-icon" /> Email</label>
                                            <span>{results.profile.email}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaPhone className="uid-field-icon" /> Phone</label>
                                            <span>{results.profile.phone || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaHome className="uid-field-icon" /> Address Line 1</label>
                                            <span>{results.profile.address1 || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaHome className="uid-field-icon" /> Address Line 2</label>
                                            <span>{results.profile.address2 || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaCity className="uid-field-icon" /> City</label>
                                            <span>{results.profile.city || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaMap className="uid-field-icon" /> County</label>
                                            <span>{results.profile.county || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaMailBulk className="uid-field-icon" /> Postcode</label>
                                            <span>{results.profile.postcode || "Not provided"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaShieldAlt className="uid-field-icon" /> Status</label>
                                            <span className={`uid-status-badge ${results.profile.blacklisted ? 'blacklisted' : 'active'}`}>
                                                {results.profile.blacklisted ? 'Blacklisted' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaUserShield className="uid-field-icon" /> Admin</label>
                                            <span className={`uid-status-badge ${results.profile.isAdmin ? 'admin' : 'user'}`}>
                                                {results.profile.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaPhone className="uid-field-icon" /> Show Phone on Ads</label>
                                            <span>{results.profile.showPhoneOnAdverts ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaHeart className="uid-field-icon" /> Favourites</label>
                                            <span>{results.profile.favourites ? results.profile.favourites.length : 0} items</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaBan className="uid-field-icon" /> Blocked Users</label>
                                            <span>{results.profile.blockedUsers ? results.profile.blockedUsers.length : 0} users</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaCalendarAlt className="uid-field-icon" /> Joined</label>
                                            <span>{results.profile.createdAt ? formatDate(results.profile.createdAt) : "Unknown"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaSignInAlt className="uid-field-icon" /> Last Login</label>
                                            <span>{results.profile.lastLogin ? formatDate(results.profile.lastLogin) : "Unknown"}</span>
                                        </div>
                                        <div className="uid-profile-field">
                                            <label><FaEye className="uid-field-icon" /> Last Seen</label>
                                            <span>{results.profile.lastSeen ? formatDate(results.profile.lastSeen) : "Unknown"}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Adverts Section */}
                    {results.adverts && results.adverts.length > 0 && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('adverts')}
                            >
                                <div className="uid-result-title-wrapper">
                                    <FaAd className="uid-result-icon" />
                                    <h2 className="uid-result-title">Adverts</h2>
                                    <span className="uid-result-count">{results.adverts.length}</span>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.adverts ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.adverts && (
                                <div className="uid-result-content">
                                    <ul className="uid-result-list">
                                        {results.adverts.map((ad) => (
                                            <li key={ad.id} className="uid-result-list-item">
                                                <Link to={`/admin/view-advert/${ad.id}`} className="uid-result-link">
                                                    <span className="uid-link-title">
                                                        {ad.title || ad.name || ad.id}
                                                    </span>
                                                    <FaChevronRight className="uid-link-arrow" />
                                                </Link>
                                                {ad.status && (
                                                    <span className={`uid-item-status ${ad.status}`}>
                                                        {ad.status}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Written Section */}
                    {results.reviewsWritten && results.reviewsWritten.length > 0 && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('reviewsWritten')}
                            >
                                <div className="uid-result-title-wrapper">
                                    <FaEdit className="uid-result-icon" />
                                    <h2 className="uid-result-title">Reviews Written</h2>
                                    <span className="uid-result-count">{results.reviewsWritten.length}</span>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.reviewsWritten ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.reviewsWritten && (
                                <div className="uid-result-content">
                                    <div className="uid-reviews-list">
                                        {results.reviewsWritten.map((review) => (
                                            <div key={review.id} className="uid-review-item">
                                                <div className="uid-review-text">
                                                    {review.text || "(No review text)"}
                                                </div>
                                                {review.rating && (
                                                    <div className="uid-review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                className={i < review.rating ? 'filled' : ''}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {review.createdAt && (
                                                    <div className="uid-review-date">
                                                        <FaClock className="uid-inline-icon" />
                                                        {formatDate(review.createdAt)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Received Section */}
                    {results.reviewsReceived && results.reviewsReceived.length > 0 && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('reviewsReceived')}
                            >
                                <div className="uid-result-title-wrapper">
                                    <FaStar className="uid-result-icon" />
                                    <h2 className="uid-result-title">Reviews Received</h2>
                                    <span className="uid-result-count">{results.reviewsReceived.length}</span>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.reviewsReceived ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.reviewsReceived && (
                                <div className="uid-result-content">
                                    <div className="uid-reviews-list">
                                        {results.reviewsReceived.map((review) => (
                                            <div key={review.id} className="uid-review-item">
                                                <div className="uid-review-text">
                                                    {review.text || "(No review text)"}
                                                </div>
                                                {review.rating && (
                                                    <div className="uid-review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                className={i < review.rating ? 'filled' : ''}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {review.createdAt && (
                                                    <div className="uid-review-date">
                                                        <FaClock className="uid-inline-icon" />
                                                        {formatDate(review.createdAt)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Notes Section */}
                    {results.adminNotes && results.adminNotes.length > 0 && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('adminNotes')}
                            >
                                <div className="uid-result-title-wrapper">
                                    <FaCommentAlt className="uid-result-icon" />
                                    <h2 className="uid-result-title">Admin Notes</h2>
                                    <span className="uid-result-count">{results.adminNotes.length}</span>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.adminNotes ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.adminNotes && (
                                <div className="uid-result-content">
                                    <div className="uid-notes-list">
                                        {results.adminNotes.map((note) => (
                                            <div key={note.id} className="uid-note-item">
                                                <div className="uid-note-header">
                                                    <span className="uid-note-author">
                                                        {note.adminName || 'Admin'}
                                                    </span>
                                                    <span className="uid-note-date">
                                                        <FaClock className="uid-inline-icon" />
                                                        {formatDate(note.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="uid-note-text">
                                                    {note.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conversations Section */}
                    {results.conversations && results.conversations.length > 0 && (
                        <div className="uid-result-card">
                            <div
                                className="uid-result-header"
                                onClick={() => toggleSection('conversations')}
                            >
                                <div className="uid-result-title-wrapper">
                                    <FaCommentAlt className="uid-result-icon" />
                                    <h2 className="uid-result-title">Conversations</h2>
                                    <span className="uid-result-count">{results.conversations.length}</span>
                                </div>
                                <button className={`uid-expand-button ${expandedSections.conversations ? 'expanded' : ''}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            {expandedSections.conversations && (
                                <div className="uid-result-content">
                                    <ul className="uid-result-list">
                                        {results.conversations.map((conv) => (
                                            <li key={conv.id} className="uid-result-list-item">
                                                <span className="uid-conv-id">
                                                    Conversation ID: {conv.id}
                                                </span>
                                                {conv.lastMessage && (
                                                    <span className="uid-conv-preview">
                                                        {conv.lastMessage}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {Object.keys(results).length === 0 && !loading && (
                        <div className="uid-empty-state">
                            <FaSearch className="uid-empty-icon" />
                            <h3>No search performed yet</h3>
                            <p>Enter a UID and click search to inspect user data</p>
                        </div>
                    )}

                    {/* No Results State */}
                    {Object.keys(results).length > 0 &&
                        !results.profile &&
                        (!results.adverts || results.adverts.length === 0) &&
                        (!results.reviewsWritten || results.reviewsWritten.length === 0) &&
                        (!results.reviewsReceived || results.reviewsReceived.length === 0) &&
                        (!results.adminNotes || results.adminNotes.length === 0) &&
                        (!results.conversations || results.conversations.length === 0) && (
                            <div className="uid-empty-state">
                                <FaExclamationCircle className="uid-empty-icon" />
                                <h3>No data found</h3>
                                <p>No results found for UID: {uid}</p>
                            </div>
                        )}
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="uid-loading-overlay">
                        <div className="uid-loading-spinner">
                            <FaSpinner className="uid-spinner-icon" />
                        </div>
                    </div>
                )}

                {/* Avatar Modal */}
                {showAvatarModal && results.profile?.avatar && (
                    <div className="uid-avatar-modal" onClick={() => setShowAvatarModal(false)}>
                        <div className="uid-avatar-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="uid-avatar-modal-close"
                                onClick={() => setShowAvatarModal(false)}
                            >
                                <FaTimes />
                            </button>
                            <img
                                src={results.profile.avatar}
                                alt={`${results.profile.firstName} ${results.profile.lastName}`}
                                className="uid-avatar-modal-image"
                            />
                            <div className="uid-avatar-modal-info">
                                <h3>{results.profile.firstName} {results.profile.lastName}</h3>
                                <p>{results.profile.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}