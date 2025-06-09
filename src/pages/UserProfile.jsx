// Import Font Awesome components
import FollowButton from '../components/FollowButton'; // Adjust the path accordingly
import { Helmet } from 'react-helmet-async'; // Add missing import
import { useLoginModal } from "../context/LoginContext"; // If you have this
import { notifyProfilePasswordChange, sendReviewResponseNotification } from '../utils/emailNotifications';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStar as solidStar,
    faHandshake,
    faComments,
    faClock,
    faMoneyBillWave,
    faPrescriptionBottleAlt,
    faDog,
    faCamera,
    faChevronDown,
    faChevronUp,
    faEnvelope,
    faFlag,
    faPhone,
    faEnvelopeOpenText,
    faClipboardCheck,
    faMapMarkerAlt,
    faStar,
    faPencilAlt,
    faLock,
    faEyeSlash,
    faUser,
    faEdit,
    faLightbulb,
    faPlus,
    faCheckCircle,
    faSpinner,
    faFingerprint
} from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileSettingsModal from "../components/ProfileSettingsModal";
import DeleteAccountSection from '../components/AccountDeletionModal';

import {
    doc,
    addDoc,
    serverTimestamp,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import "./UserProfile.css";

const TRUNCATE_LENGTH = 127;

// Tooltip component with inline styles
const Tooltip = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-block',
                cursor: 'pointer'
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '-125px',
                        width: '250px',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                        zIndex: 10,
                        textAlign: 'left',
                        lineHeight: '1.4'
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
};

// Bio Section Component
function BioSection({ bio, isOwnProfile, onEditClick, userData }) {
    if (!bio && !isOwnProfile) {
        return null;
    }

    const getSectionTitle = () => {
        if (userData?.breederType === 'rescue' && userData?.organizationName) {
            return `About ${userData.organizationName}`;
        }
        return 'About Me';
    };

    return (
        <div className="up-bio-section">
            <div className="up-section-header">
                <h2 className="up-section-title">
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} />
                    {getSectionTitle()}
                </h2>
                {isOwnProfile && (
                    <button
                        className="up-edit-bio-btn up-desktop-only"
                        onClick={() => onEditClick('bio')}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                        {bio ? 'Edit' : 'Add Bio'}
                    </button>
                )}
            </div>
            <div className="up-bio-content">
                {bio ? (
                    <p className="up-bio-text">{bio}</p>
                ) : (
                    <p className="up-bio-placeholder">
                        <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }} />
                        {userData?.breederType === 'rescue'
                            ? 'Add information about your rescue organization'
                            : 'Add a bio to tell others about yourself'
                        }
                    </p>
                )}
            </div>
            {isOwnProfile && (
                <button
                    className="up-edit-bio-btn up-mobile-only"
                    onClick={() => onEditClick('bio')}
                >
                    <FontAwesomeIcon icon={faEdit} />
                    {bio ? 'Edit' : 'Add Bio'}
                </button>
            )}
        </div>
    );
}

// User Adverts Section Component
function UserAdvertsSection({ userId, userName }) {
    const [userAdverts, setUserAdverts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserAdverts = async () => {
            try {
                const advertsQuery = query(
                    collection(db, "allListings"),
                    where("ownerId", "==", userId),
                    where("approved", "==", true)
                );

                const advertsSnap = await getDocs(advertsQuery);

                const adverts = advertsSnap.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(ad =>
                        ad.expired === false &&
                        ad.sold !== true
                    )
                    .sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return dateB - dateA;
                    });

                setUserAdverts(adverts);
            } catch (error) {
                console.error("Error fetching user adverts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAdverts();
    }, [userId]);

    if (loading) {
        return (
            <div className="up-adverts-section">
                <h2 className="up-section-title">{userName}'s Active Adverts</h2>
                <div className="up-loading-container" style={{ minHeight: '200px' }}>
                    <div className="up-loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (userAdverts.length === 0) {
        return null;
    }

    const displayedAdverts = showAll ? userAdverts : userAdverts.slice(0, 6);

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

    return (
        <div className="up-adverts-section">
            <div className="up-section-header">
                <h2 className="up-section-title">{userName}'s Active Adverts</h2>
                {userAdverts.length > 6 && (
                    <button
                        className="up-view-all-btn"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? 'Show Less' : `View All (${userAdverts.length})`}
                    </button>
                )}
            </div>

            <div className="up-adverts-grid">
                {displayedAdverts.map((ad) => (
                    <div
                        key={ad.id}
                        className="up-advert-card"
                        onClick={() => navigate(`/advert-details/${ad.id}`)}
                    >
                        <div className={`up-advert-intent ${ad.intent}`}>
                            {ad.intent === 'stud' ? 'Stud Service' :
                                ad.intent === 'rescue' ? 'For Adoption' :
                                    'For Sale'}
                        </div>

                        <div className="up-advert-image-container">
                            <img
                                src={ad.images?.[ad.mainImageIndex || 0] || ad.images?.[0] || "https://placehold.co/600x400?text=No+Image"}
                                alt={ad.title || ad.name}
                                className="up-advert-image"
                            />
                        </div>

                        <div className="up-advert-content">
                            <h3 className="up-advert-title">
                                {(ad.title || ad.name || "").length > 33
                                    ? (ad.title || ad.name).slice(0, 33) + '…'
                                    : (ad.title || ad.name)}
                            </h3>

                            <div className="up-advert-tags">
                                <span className="up-advert-tag up-breed-tag">
                                    {ad.breedOrType || "Unknown Breed"}
                                </span>
                                <span className="up-advert-tag up-age-tag">
                                    {formatAge(ad.dob)}
                                </span>
                                {ad.price && (
                                    <span className="up-advert-tag up-price-tag">
                                        £{parseInt(ad.price).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {userAdverts.length > 6 && (
                <button
                    className="up-show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                    style={{ marginTop: '1.5rem' }}
                >
                    {showAll ? (
                        <>
                            <span>Show fewer adverts</span>
                            <FontAwesomeIcon icon={faChevronUp} />
                        </>
                    ) : (
                        <>
                            <span>Show more adverts ({userAdverts.length - 6} more)</span>
                            <FontAwesomeIcon icon={faChevronDown} />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

// Feature Request Section Component
function FeatureRequestSection({ isOwnProfile, userId }) {
    const [showModal, setShowModal] = useState(false);
    const [requestTitle, setRequestTitle] = useState('');
    const [requestDescription, setRequestDescription] = useState('');
    const [requestCategory, setRequestCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userRequests, setUserRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [showAllRequests, setShowAllRequests] = useState(false);

    useEffect(() => {
        const fetchUserRequests = async () => {
            if (!isOwnProfile) return;

            try {
                const requestsQuery = query(
                    collection(db, "featureRequests"),
                    where("userId", "==", userId),
                    where("status", "!=", "deleted")
                );

                const requestsSnap = await getDocs(requestsQuery);
                const requests = requestsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                })).sort((a, b) => b.createdAt - a.createdAt);

                setUserRequests(requests);
            } catch (error) {
                console.error("Error fetching feature requests:", error);
            } finally {
                setLoadingRequests(false);
            }
        };

        fetchUserRequests();
    }, [isOwnProfile, userId]);

    const handleSubmitRequest = async () => {
        if (!requestTitle.trim() || !requestDescription.trim() || !requestCategory) {
            alert("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            const newRequest = {
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                title: requestTitle.trim(),
                description: requestDescription.trim(),
                category: requestCategory,
                status: "pending",
                createdAt: serverTimestamp(),
                votes: 0,
                adminResponse: null,
                responseDate: null
            };

            const docRef = await addDoc(collection(db, "featureRequests"), newRequest);

            setUserRequests(prev => [{
                id: docRef.id,
                ...newRequest,
                createdAt: new Date()
            }, ...prev]);

            setRequestTitle('');
            setRequestDescription('');
            setRequestCategory('');
            setShowModal(false);

            alert("Feature request submitted successfully!");
        } catch (error) {
            console.error("Error submitting feature request:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOwnProfile) return null;

    const displayedRequests = showAllRequests ? userRequests : userRequests.slice(0, 3);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <FontAwesomeIcon icon={faCheckCircle} className="up-status-icon approved" />;
            case 'in-progress':
                return <FontAwesomeIcon icon={faSpinner} className="up-status-icon in-progress" />;
            case 'completed':
                return <FontAwesomeIcon icon={faCheckCircle} className="up-status-icon completed" />;
            default:
                return <FontAwesomeIcon icon={faClock} className="up-status-icon pending" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Approved';
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'rejected': return 'Not Planned';
            default: return 'Under Review';
        }
    };

    return (
        <div className="up-feature-request-section">
            <div className="up-section-header">
                <div className="up-feature-intro">
                    <p><span className="up-feature-intro-icon">💡</span>Have an idea to improve our platform? We'd love
                        to hear from you!</p>
                    <p>Submit feature requests to help us make the community better. You can suggest:</p>
                    <ul>
                        <li>New features or improvements</li>
                        <li>Changes to existing functionality</li>
                        <li>User interface enhancements</li>
                        <li>Community tools and resources</li>
                    </ul>
                </div>
                <button
                    className="up-new-request-btn"
                    onClick={() => setShowModal(true)}
                >
                    <FontAwesomeIcon icon={faPlus}/>
                    New Request
                </button>
            </div>

            {loadingRequests ? (
                <div className="up-loading-container" style={{minHeight: '100px'}}>
                    <div className="up-loading-spinner"></div>
                </div>
            ) : userRequests.length === 0 ? (
                <div className="up-no-requests">
                    <FontAwesomeIcon icon={faLightbulb} className="up-no-requests-icon"/>
                    <p>You haven't submitted any feature requests yet.</p>
                    <p className="up-no-requests-hint">Have an idea to improve StudService? We'd love to hear it!</p>
                </div>
            ) : (
                <>
                    <div className="up-requests-list">
                        {displayedRequests.map(request => (
                            <div key={request.id} className="up-request-item">
                                <div className="up-request-header">
                                    <h4 className="up-request-title">{request.title}</h4>
                                    {getStatusIcon(request.status)}
                                </div>
                                <p className="up-request-description">{request.description}</p>
                                <div className="up-request-meta">
                                    <span className="up-request-category">{request.category}</span>
                                    <span className="up-request-date">
                                        {request.createdAt.toLocaleDateString()}
                                    </span>
                                    <span className={`up-request-status ${request.status}`}>
                                        {getStatusText(request.status)}
                                    </span>
                                </div>
                                {request.adminResponse && (
                                    <div className="up-admin-response">
                                        <strong>Admin Response:</strong>
                                        <p>{request.adminResponse}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {userRequests.length > 3 && (
                        <button
                            className="up-show-more-btn"
                            onClick={() => setShowAllRequests(!showAllRequests)}
                            style={{ marginTop: '1rem' }}
                        >
                            {showAllRequests ? (
                                <>
                                    <span>Show fewer requests</span>
                                    <FontAwesomeIcon icon={faChevronUp} />
                                </>
                            ) : (
                                <>
                                    <span>Show all requests ({userRequests.length - 3} more)</span>
                                    <FontAwesomeIcon icon={faChevronDown} />
                                </>
                            )}
                        </button>
                    )}
                </>
            )}

            {showModal && (
                <div className="up-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="up-feature-modal" onClick={e => e.stopPropagation()}>
                        <div className="up-feature-modal-header">
                            <h3>Submit a Feature Request</h3>
                            <button className="up-modal-close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="up-feature-modal-body">
                            <div className="up-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faLightbulb} />
                                    Request Title
                                </label>
                                <input
                                    type="text"
                                    value={requestTitle}
                                    onChange={e => setRequestTitle(e.target.value)}
                                    placeholder="Brief title for your feature idea"
                                    maxLength={100}
                                />
                            </div>

                            <div className="up-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faComments} />
                                    Category
                                </label>
                                <select
                                    value={requestCategory}
                                    onChange={e => setRequestCategory(e.target.value)}
                                >
                                    <option value="">Select a category</option>
                                    <option value="User Interface">User Interface</option>
                                    <option value="Search & Filters">Search & Filters</option>
                                    <option value="Messaging">Messaging</option>
                                    <option value="Profile Features">Profile Features</option>
                                    <option value="Listing Features">Listing Features</option>
                                    <option value="Mobile App">Mobile App</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="up-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                    Description
                                </label>
                                <textarea
                                    value={requestDescription}
                                    onChange={e => setRequestDescription(e.target.value)}
                                    placeholder="Describe your feature idea in detail. What problem does it solve? How would it work?"
                                    rows={6}
                                    maxLength={1000}
                                />
                                <div className="up-char-count">
                                    {requestDescription.length}/1000 characters
                                </div>
                            </div>

                            <div className="up-modal-actions">
                                <button
                                    className="up-cancel-btn"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="up-submit-btn"
                                    onClick={handleSubmitRequest}
                                    disabled={submitting || !requestTitle.trim() || !requestDescription.trim() || !requestCategory}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReviewCard({ review, isOwnProfile, onSubmitResponse }) {
    const [showModal, setShowModal] = useState(false);
    const [responseText, setResponseText] = useState(review.response || "");
    const [showRespondModal, setShowRespondModal] = useState(false);

    const isLong = review.text.length >= TRUNCATE_LENGTH;
    const truncated = isLong ? review.text.slice(0, TRUNCATE_LENGTH) + "…" : review.text;

    // Helper function to format dates
    const formatDate = (timestamp) => {
        if (!timestamp) return '';

        let date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            return '';
        }

        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diffInMs = now - date;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 365) {
            const months = Math.floor(diffInDays / 30);
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    const handleResponseSubmit = () => {
        if (responseText.trim()) {
            onSubmitResponse(review.id, responseText.trim(), review.dogName);
            setShowRespondModal(false);
        }
    };

    return (
        <>
            <div className="up-review-card">
                <div className="up-review-header">
                    <h4 className="up-review-dog-name">{review.dogName}</h4>
                    <div className="up-review-stars">
                        {[1,2,3,4,5].map(i => (
                            <FontAwesomeIcon
                                key={i}
                                icon={solidStar}
                                className={i <= review.rating ? "up-star up-active" : "up-star"}
                            />
                        ))}
                    </div>
                </div>

                <p className="up-review-text">"{truncated}"</p>
                {isLong && (
                    <button className="up-read-more-btn" onClick={() => setShowModal(true)}>
                        Read full review
                    </button>
                )}

                <p className="up-review-author">— {review.reviewerName}</p>

                {/* Date moved under the author */}
                {review.createdAt && (
                    <div className="up-review-date">
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px', fontSize: '12px', opacity: 0.6 }} />
                        <span>{formatDate(review.createdAt)}</span>
                    </div>
                )}

                {/* Show existing response with timestamp */}
                {review.response && (
                    <div className="up-review-response">
                        <div className="up-response-header">
                            <strong>Stud Owner Response</strong>
                            {review.responseTimestamp && (
                                <span className="up-response-date">
                                    <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px', fontSize: '11px', opacity: 0.6 }} />
                                    {formatDate(review.responseTimestamp)}
                                </span>
                            )}
                        </div>
                        <p>{review.response}</p>
                    </div>
                )}

                {/* Show respond button only if it's the profile owner */}
                {isOwnProfile && (
                    <button
                        className="up-respond-btn"
                        onClick={() => setShowRespondModal(true)}
                    >
                        {review.response ? "Edit Response" : "Respond"}
                    </button>
                )}
            </div>

            {/* Full review modal */}
            {showModal && (
                <div className="up-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="up-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="up-modal-close-btn" onClick={() => setShowModal(false)}>×</button>
                        <div className="up-modal-header-section">
                            <h4 className="up-modal-dog-name">{review.dogName}</h4>
                            <div className="up-modal-stars">
                                {[1,2,3,4,5].map(i => (
                                    <FontAwesomeIcon
                                        key={i}
                                        icon={solidStar}
                                        className={i <= review.rating ? "up-star up-active" : "up-star"}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="up-modal-text">"{review.text}"</p>
                        <p className="up-modal-author">— {review.reviewerName}</p>

                        {/* Date in modal also under author */}
                        {review.createdAt && (
                            <div className="up-modal-review-date">
                                <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px', fontSize: '12px', opacity: 0.6 }} />
                                <span>{formatDate(review.createdAt)}</span>
                            </div>
                        )}

                        {/* Show response in modal if it exists */}
                        {review.response && (
                            <div className="up-modal-response">
                                <div className="up-response-header">
                                    <strong>Stud Owner Response</strong>
                                    {review.responseTimestamp && (
                                        <span className="up-response-date">
                                            <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px', fontSize: '11px', opacity: 0.6 }} />
                                            {formatDate(review.responseTimestamp)}
                                        </span>
                                    )}
                                </div>
                                <p>{review.response}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Respond modal */}
            {showRespondModal && (
                <div className="up-modal-backdrop" onClick={() => setShowRespondModal(false)}>
                    <div className="up-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="up-modal-close-btn" onClick={() => setShowRespondModal(false)}>×</button>
                        <h4>Respond to Review</h4>
                        <textarea
                            value={responseText}
                            onChange={e => setResponseText(e.target.value)}
                            rows={5}
                            placeholder="Write your response here..."
                            className="up-response-textarea"
                        />
                        <button
                            className="up-submit-response-btn"
                            onClick={handleResponseSubmit}
                            disabled={!responseText.trim()}
                        >
                            Submit Response
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default function UserProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [userData, setUserData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [activeSection, setActiveSection] = useState("overview");
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsInitialTab, setSettingsInitialTab] = useState("profile");
    const [showReportUserModal, setShowReportUserModal] = useState(false);
    const [userReportReason, setUserReportReason] = useState('');
    const [userReportComments, setUserReportComments] = useState('');
    const [userReportSubmitting, setUserReportSubmitting] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const isOwnProfile = currentUserId === uid;
    const currentUser = auth.currentUser;
    const { openLogin } = useLoginModal();

    const handleTogglePhoneVisibility = async () => {
        if (!currentUserId) return;
        try {
            const newValue = !userData?.showPhoneOnAdverts;
            const userRef = doc(db, "users", currentUserId);
            await updateDoc(userRef, { showPhoneOnAdverts: newValue });
            setUserData(prev => ({ ...prev, showPhoneOnAdverts: newValue }));
        } catch (err) {
            console.error("Failed to update phone visibility:", err);
        }
    };

    const handleToggleEmailVisibility = async () => {
        if (!currentUserId) return;
        try {
            const newValue = !userData?.showEmailOnProfile;
            const userRef = doc(db, "users", currentUserId);
            await updateDoc(userRef, { showEmailOnProfile: newValue });
            setUserData(prev => ({ ...prev, showEmailOnProfile: newValue }));
        } catch (err) {
            console.error("Failed to update email visibility:", err);
        }
    };

    const handleToggleNotifications = async () => {
        if (!currentUserId) return;
        try {
            const newValue = !userData?.allowNotifications;
            const userRef = doc(db, "users", currentUserId);
            await updateDoc(userRef, { allowNotifications: newValue });
            setUserData(prev => ({ ...prev, allowNotifications: newValue }));
        } catch (err) {
            console.error("Failed to update notification preferences:", err);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserId(user.uid);
                const me = await getDoc(doc(db, "users", user.uid));
                if (me.exists()) {
                    const meData = me.data();
                    setIsAdmin(meData.isAdmin === true);
                    setCurrentUserData(meData);
                }
            } else {
                setCurrentUserId(null);
                setIsAdmin(false);
                setCurrentUserData(null);
            }
        });
        return unsub;
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) setUserData(userSnap.data());
                else {
                    console.error("User not found");
                    return;
                }

                const reviewsSnap = await getDocs(
                    query(
                        collection(db, "reviews"),
                        where("ownerId", "==", uid),
                        where("approved", "==", true)
                    )
                );

                const enrichedReviews = await Promise.all(
                    reviewsSnap.docs.map(async ds => {
                        const d = ds.data();
                        let dogName = "Unknown Dog";

                        try {
                            const advertRef = doc(db, "allListings", d.advertId);
                            const advertSnap = await getDoc(advertRef);

                            if (advertSnap.exists() && advertSnap.data().approved) {
                                dogName = advertSnap.data().name;
                            }
                        } catch (e) {
                            console.warn("Could not load advert for review:", d.advertId, e);
                        }

                        return { id: ds.id, ...d, dogName };
                    })
                );
                setReviews(enrichedReviews);

                const followersQuery = query(
                    collection(db, "follows"),
                    where("followingId", "==", uid)
                );
                const followingQuery = query(
                    collection(db, "follows"),
                    where("followerId", "==", uid)
                );

                const [followersSnap, followingSnap] = await Promise.all([
                    getDocs(followersQuery),
                    getDocs(followingQuery)
                ]);

                setFollowerCount(followersSnap.size);
                setFollowingCount(followingSnap.size);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        if (uid) fetchData();
    }, [uid, currentUserId, isAdmin]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');

        if (tab && ['overview', 'reviews', 'contact', 'features'].includes(tab)) {
            setActiveSection(tab);

            urlParams.delete('tab');
            const cleanUrl = urlParams.toString()
                ? `/profile/${uid}?${urlParams.toString()}`
                : `/profile/${uid}`;
            window.history.replaceState(null, '', cleanUrl);
        }
    }, [uid]);

    const openFileInput = () => fileInputRef.current.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const sRef = ref(storage, `avatars/${currentUserId}`);
            await uploadBytes(sRef, file);
            const url = await getDownloadURL(sRef);
            await updateDoc(doc(db, "users", currentUserId), { avatar: url });
            setUserData((prev) => ({ ...prev, avatar: url }));
        } catch (error) {
            console.error("Error updating avatar:", error);
        }
    };

    const openProfileSettings = (tab = 'profile') => {
        setSettingsInitialTab(tab);
        setShowSettingsModal(true);
    };

    const handleSaveContact = async (updatedData) => {
        try {
            const userRef = doc(db, "users", currentUserId);

            if (updatedData.bio !== undefined || updatedData.breederType !== undefined) {
                setUserData(prev => ({ ...prev, ...updatedData }));
                return;
            }

            const newUserData = {
                ...userData,
                ...updatedData,
            };

            await updateDoc(userRef, {
                phone: newUserData.phone,
                postcode: newUserData.postcode,
                address1: newUserData.address1,
                address2: newUserData.address2,
                city: newUserData.city,
                county: newUserData.county,
                firstName: newUserData.firstName,
                lastName: newUserData.lastName,
            });

            if (
                updatedData.email &&
                updatedData.email !== auth.currentUser.email
            ) {
                await auth.currentUser.updateEmail(updatedData.email);
            }

            setUserData(newUserData);
        } catch (error) {
            if (error.code === "auth/requires-recent-login") {
                alert("Please log in again to update your email address.");
                navigate("/login");
            } else {
                console.error("Error saving contact info:", error);
            }
        }
    };

    if (!userData)
        return (
            <div className="up-loading-container">
                <div className="up-loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);
    const averageRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

    const aspectCounts = reviews.reduce((acc, r) => {
        if (Array.isArray(r.aspects)) {
            r.aspects.forEach(a => {
                acc[a] = (acc[a] || 0) + 1;
            });
        }
        return acc;
    }, {});

    const aspectIconMap = {
        "Handler Professionalism": faHandshake,
        "Communication & Responsiveness": faComments,
        "Appointment Punctuality": faClock,
        "Value for Money": faMoneyBillWave,
        "Aftercare Advice": faPrescriptionBottleAlt,
        "Dog as Described": faDog
    };

    const handleMessageUser = () => {
        if (!currentUser) {
            if (openLogin) {
                openLogin();
            } else {
                alert("Please log in to message this user.");
            }
            return;
        }

        if (currentUser.uid === uid) {
            alert("You cannot message yourself.");
            return;
        }

        navigate(`/messages?recipient=${uid}`);
    };

    return (
        <>
            <Helmet>
                <title>User Profile | My Pet Connect</title>
                <meta name="robots" content="noindex,follow" />
            </Helmet>

            <div className="up-profile-container">
                <div className="up-profile-hero">
                    <div className="up-profile-hero-content">
                        <div className="up-avatar-container">
                            <img
                                src={userData.avatar || "https://placehold.co/150"}
                                alt="Profile avatar"
                                className="up-profile-avatar"
                            />
                            {isOwnProfile && (
                                <button
                                    className="up-avatar-change-btn"
                                    onClick={openFileInput}
                                    title="Change Avatar"
                                >
                                    <FontAwesomeIcon icon={faCamera} />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="up-profile-info">
                            <h1 className="up-profile-name">
                                {userData.breederType === 'rescue' && userData.organizationName && !isOwnProfile ? (
                                    userData.organizationName
                                ) : (
                                    isOwnProfile ? (
                                        `${userData.firstName} ${userData.lastName}`
                                    ) : (
                                        `${userData.firstName} ${userData.lastName ? userData.lastName.charAt(0).toUpperCase() + '.' : ''}`
                                    )
                                )}
                            </h1>

                            {reviews.length > 0 && (
                                <div className="up-profile-rating">
                                    <span className="up-rating-score">{averageRating}</span>
                                    <div className="up-rating-stars">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <FontAwesomeIcon
                                                key={i}
                                                icon={solidStar}
                                                className={i <= Math.round(averageRating) ? "up-star up-active" : "up-star"}
                                            />
                                        ))}
                                    </div>
                                    <span className="up-rating-count">({reviews.length} reviews)</span>
                                </div>
                            )}

                            <div className="up-profile-location">
                                {userData.city && userData.county && (
                                    <span>{userData.city}, {userData.county}</span>
                                )}
                                {userData.postcode && (
                                    <span className="up-profile-postcode">{userData.postcode}</span>
                                )}
                            </div>

                            <div className="up-profile-stats">
                                <div className="up-stat-item">
                                    <span className="up-stat-value">{followerCount}</span>
                                    <span className="up-stat-label">{followerCount === 1 ? 'Follower' : 'Followers'}</span>
                                </div>
                                <div className="up-stat-divider">•</div>
                                <div className="up-stat-item">
                                    <span className="up-stat-value">{followingCount}</span>
                                    <span className="up-stat-label">Following</span>
                                </div>
                            </div>

                            {isOwnProfile && (
                                <div className="up-profile-uid">
                                    <FontAwesomeIcon icon={faFingerprint} className="up-uid-icon" />
                                    <span className="up-uid-label">User ID:</span>
                                    {uid.length > 10 ? (
                                        <>
                                            <span className="up-uid-value">{uid.slice(0, -10)}</span>
                                            <span className="up-uid-value up-uid-highlight">{uid.slice(-10)}</span>
                                        </>
                                    ) : (
                                        <span className="up-uid-value up-uid-highlight">{uid}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="up-profile-actions">
                        {isOwnProfile ? (
                            <>
                                <button
                                    className="up-edit-profile-btn"
                                    onClick={() => openProfileSettings('profile')}
                                >
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                    Edit Profile
                                </button>

                                <button
                                    className="up-change-password-btn"
                                    onClick={() => openProfileSettings('password')}
                                >
                                    <FontAwesomeIcon icon={faLock} />
                                    Change Password
                                </button>
                            </>
                        ) : (
                            <>
                                {currentUserId && currentUserData && currentUserId !== uid && (
                                    <>
                                        <FollowButton
                                            targetUserId={uid}
                                            currentUserId={currentUserId}
                                            targetUserName={userData.firstName}
                                            currentUserName={currentUserData.firstName}
                                        />

                                        <button
                                            className="up-message-btn primary-green"
                                            onClick={handleMessageUser}
                                        >
                                            <FontAwesomeIcon icon={faEnvelopeOpenText} />
                                            <span className="up-message-text">
                                                Message {userData?.breederType === 'rescue' && userData?.organizationName
                                                ? userData.organizationName
                                                : (userData?.firstName || "User")}
                                            </span>
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="up-profile-nav">
                    <div className="up-nav-tabs">
                        <button
                            className={`up-nav-button ${activeSection === 'overview' ? 'up-active' : ''}`}
                            onClick={() => setActiveSection('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`up-nav-button ${activeSection === 'reviews' ? 'up-active' : ''}`}
                            onClick={() => setActiveSection('reviews')}
                        >
                            Reviews {reviews.length > 0 && `(${reviews.length})`}
                        </button>
                        <button
                            className={`up-nav-button ${activeSection === 'contact' ? 'up-active' : ''}`}
                            onClick={() => setActiveSection('contact')}
                        >
                            Contact Info
                        </button>
                        {isOwnProfile && (
                            <button
                                className={`up-nav-button ${activeSection === 'features' ? 'up-active' : ''}`}
                                onClick={() => setActiveSection('features')}
                            >
                                Feature Requests
                            </button>
                        )}
                    </div>
                    {!isOwnProfile && (
                        <button
                            className="up-nav-button up-report-button"
                            onClick={() => {
                                if (auth.currentUser) {
                                    setShowReportUserModal(true);
                                } else {
                                    alert("Please log in to report this user.");
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faFlag} /> Report
                        </button>
                    )}
                </div>

                <div className="up-profile-content">
                    {activeSection === 'overview' && (
                        <div className="up-overview-section">
                            <BioSection
                                bio={userData.bio}
                                isOwnProfile={isOwnProfile}
                                onEditClick={openProfileSettings}
                                userData={userData}
                            />

                            {userData.breederType === 'rescue' && (userData.organizationName || userData.charityNumber || userData.websiteUrl) && (
                                <div className="up-licence-section">
                                    <div className="up-section-header">
                                        <h2 className="up-section-title">
                                            <FontAwesomeIcon icon={faHandshake} style={{ marginRight: '8px' }} />
                                            Rescue Organization
                                        </h2>
                                    </div>
                                    <div className="up-licence-content">
                                        <div className="up-licence-badge">
                                            <FontAwesomeIcon icon={faHandshake} className="up-licence-icon" />
                                            <div className="up-licence-details">
                                                <div className="up-licence-status">{userData.organizationName}</div>
                                                {userData.charityNumber && (
                                                    <div className="up-licence-authority">
                                                        <strong>Charity Registration:</strong> {userData.charityNumber}
                                                    </div>
                                                )}
                                                {userData.websiteUrl && (
                                                    <div className="up-licence-number">
                                                        <strong>Website:</strong>{' '}
                                                        <a
                                                            href={userData.websiteUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#007bff', textDecoration: 'none' }}
                                                            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                                                            onMouseLeave={e => e.target.style.textDecoration = 'none'}
                                                        >
                                                            {userData.websiteUrl.replace(/^https?:\/\//, '')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="up-licence-note">
                                            <FontAwesomeIcon icon={faHandshake} style={{ marginRight: '6px' }} />
                                            This is a rescue organization dedicated to rescuing, rehabilitating, and rehoming animals in need.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userData.breederType === 'rescue' && (
                                <div className="up-adoption-process-section">
                                    <div className="up-section-header">
                                        <h2 className="up-section-title">
                                            <FontAwesomeIcon icon={faClipboardCheck} style={{ marginRight: '8px' }} />
                                            Our Adoption Process
                                        </h2>
                                        {isOwnProfile && (
                                            <button
                                                className="up-edit-bio-btn up-desktop-only"
                                                onClick={() => openProfileSettings('adoption')}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                                {userData.adoptionProcess ? 'Edit' : 'Add Process'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="up-process-content">
                                        {userData.adoptionProcess ? (
                                            <>
                                                <p>{userData.adoptionProcess}</p>
                                                {userData.adoptionRequirements && (
                                                    <div className="up-requirements-box">
                                                        <h4>Adoption Requirements:</h4>
                                                        <ul>
                                                            {userData.adoptionRequirements.split('\n').map((req, index) => (
                                                                <li key={index}>{req}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="up-bio-placeholder">
                                                <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }} />
                                                {isOwnProfile
                                                    ? 'Add your adoption process and requirements to help potential adopters understand your procedures'
                                                    : 'No adoption process information available yet'
                                                }
                                            </p>
                                        )}
                                    </div>
                                    {isOwnProfile && (
                                        <button
                                            className="up-edit-bio-btn up-mobile-only"
                                            onClick={() => openProfileSettings('adoption')}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                            {userData.adoptionProcess ? 'Edit' : 'Add Process'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {Object.keys(aspectCounts).length > 0 && (
                                <div className="up-aspect-section">
                                    <h2 className="up-section-title up-aspect-title">What People Appreciate About {userData.firstName}</h2>
                                    <div className="up-aspect-badges-container">
                                        {Object.entries(aspectCounts)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([aspect, count]) => (
                                                <div key={aspect} className="up-aspect-badge">
                                                    <div className="up-aspect-badge-icon">
                                                        <FontAwesomeIcon icon={aspectIconMap[aspect] || faHandshake} />
                                                    </div>
                                                    <div className="up-aspect-badge-content">
                                                        <span className="up-aspect-badge-name">{aspect}</span>
                                                        <div className="up-aspect-badge-count">
                                                            <span>{count}</span>
                                                            <span> {count === 1 ? 'review' : 'reviews'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {!isOwnProfile && (
                                <UserAdvertsSection
                                    userId={uid}
                                    userName={
                                        userData.breederType === 'rescue' && userData.organizationName
                                            ? userData.organizationName
                                            : userData.firstName
                                    }
                                />
                            )}

                            {reviews.length > 0 && (
                                <div className="up-recent-reviews-section">
                                    <div className="up-section-header">
                                        <h2 className="up-section-title">Recent Reviews</h2>
                                        {reviews.length > 4 && (
                                            <button
                                                className="up-view-all-btn"
                                                onClick={() => setActiveSection('reviews')}
                                            >
                                                View All
                                            </button>
                                        )}
                                    </div>

                                    <div className="up-reviews-grid up-reviews-grid-compact">
                                        {reviews.slice(0, 2).map((review) => (
                                            <ReviewCard key={review.id} review={review} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="up-contact-summary-section">
                                <div className="up-section-header">
                                    <h2 className="up-section-title">Contact Information</h2>
                                    {isOwnProfile && (
                                        <button
                                            className="up-view-all-btn"
                                            onClick={() => openProfileSettings('profile')}
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                    {!isOwnProfile && (
                                        <button
                                            className="up-view-all-btn"
                                            onClick={() => setActiveSection('contact')}
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>

                                <div className="up-contact-summary">
                                    <div className="up-contact-item">
                                        <FontAwesomeIcon icon={faEnvelope} className="up-contact-icon" />
                                        {isOwnProfile || userData.showEmailOnProfile ? (
                                            <span>{userData.email}</span>
                                        ) : (
                                            <span className="up-contact-private">
                                                <FontAwesomeIcon icon={faEyeSlash} /> Email address is private
                                            </span>
                                        )}
                                    </div>

                                    <div className="up-contact-item">
                                        <FontAwesomeIcon icon={faPhone} className="up-contact-icon" />
                                        {userData.phone && (isOwnProfile || userData.showPhoneOnAdverts) ? (
                                            <span>{userData.phone}</span>
                                        ) : (
                                            <span className="up-contact-private">
                                                <FontAwesomeIcon icon={faEyeSlash} /> Phone number is private
                                            </span>
                                        )}
                                    </div>

                                    {userData.postcode && (
                                        <div className="up-contact-item">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="up-contact-icon" />
                                            <span>{userData.postcode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'reviews' && (
                        <div className="up-reviews-section">
                            <h2 className="up-section-title">All Reviews</h2>

                            {reviews.length === 0 ? (
                                <div className="up-no-content">
                                    <p>No reviews yet.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="up-reviews-stats">
                                        <div className="up-rating-summary">
                                            <div className="up-rating-big">{averageRating}</div>
                                            <div className="up-rating-stars-big">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <FontAwesomeIcon
                                                        key={i}
                                                        icon={solidStar}
                                                        className={i <= Math.round(averageRating) ? "up-star up-active" : "up-star"}
                                                    />
                                                ))}
                                            </div>
                                            <div className="up-rating-count-big">{reviews.length} reviews</div>
                                        </div>

                                        {Object.keys(aspectCounts).length > 0 && (
                                            <div className="up-aspects-summary">
                                                <h3 className="up-aspects-title">Top Qualities</h3>
                                                <div className="up-aspects-list">
                                                    {Object.entries(aspectCounts)
                                                        .sort((a, b) => b[1] - a[1])
                                                        .slice(0, 3)
                                                        .map(([aspect, count]) => (
                                                            <div key={aspect} className="up-aspect-item">
                                                                <FontAwesomeIcon icon={aspectIconMap[aspect] || faStar} />
                                                                <span>{aspect}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="up-reviews-grid">
                                        {displayedReviews.map(review => (
                                            <ReviewCard
                                                key={review.id}
                                                review={review}
                                                isOwnProfile={isOwnProfile}
                                                onSubmitResponse={async (reviewId, response, dogName) => {
                                                    try {
                                                        const reviewRef = doc(db, "reviews", reviewId);
                                                        await updateDoc(reviewRef, {
                                                            response,
                                                            responseTimestamp: new Date().toISOString()
                                                        });

                                                        const reviewDoc = await getDoc(reviewRef);
                                                        if (reviewDoc.exists()) {
                                                            const reviewData = reviewDoc.data();
                                                            const reviewerRef = doc(db, "users", reviewData.reviewerId);
                                                            const reviewerDoc = await getDoc(reviewerRef);

                                                            if (reviewerDoc.exists()) {
                                                                const reviewerData = reviewerDoc.data();
                                                                if (reviewerData.allowNotifications !== false) {
                                                                    try {
                                                                        await sendReviewResponseNotification({
                                                                            reviewerEmail: reviewerData.email,
                                                                            reviewerName: reviewerData.firstName,
                                                                            ownerName: userData.firstName,
                                                                            ownerOrganization: userData.breederType === 'rescue' ? userData.organizationName : null,
                                                                            reviewText: reviewData.text,
                                                                            responseText: response,
                                                                            dogName: dogName,
                                                                            profileUrl: `${window.location.origin}/profile/${uid}`
                                                                        });
                                                                        console.log('Review response notification sent successfully');
                                                                    } catch (emailError) {
                                                                        console.error('Failed to send review response notification:', emailError);
                                                                    }
                                                                }
                                                            }
                                                        }

                                                        setReviews(prev =>
                                                            prev.map(r => (r.id === reviewId ? { ...r, response } : r))
                                                        );

                                                        alert('Response submitted successfully!');
                                                    } catch (err) {
                                                        console.error("Failed to submit response:", err);
                                                        alert("Failed to save response. Try again.");
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {reviews.length > 4 && (
                                        <button
                                            className="up-show-more-btn"
                                            onClick={() => setShowAllReviews(prev => !prev)}
                                        >
                                            {showAllReviews ? (
                                                <>
                                                    <span>Show fewer reviews</span>
                                                    <FontAwesomeIcon icon={faChevronUp} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Show more reviews ({reviews.length - 4} more)</span>
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeSection === 'contact' && (
                        <div className="up-contact-section">
                            <h2 className="up-section-title">Contact Information</h2>

                            <div className="up-contact-card">
                                <div className="up-contact-group">
                                    <h3 className="up-contact-group-title">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        Email Address
                                    </h3>
                                    <div className="up-contact-value">
                                        {isOwnProfile || userData.showEmailOnProfile ? (
                                            userData.email
                                        ) : (
                                            <p className="up-contact-privacy-note">
                                                <FontAwesomeIcon icon={faEyeSlash} /> Email address is private
                                            </p>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <div className="up-toggle-visibility">
                                            <label className="up-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={userData.showEmailOnProfile || false}
                                                    onChange={handleToggleEmailVisibility}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span className="up-checkbox-text">Show my email address on my profile</span>
                                            </label>
                                            <p className="up-checkbox-note">
                                                If enabled, your email address will be visible to other registered users visiting your profile.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="up-contact-group">
                                    <h3 className="up-contact-group-title">
                                        <FontAwesomeIcon icon={faPhone} />
                                        Phone Number
                                    </h3>
                                    <div className="up-contact-value">
                                        {userData.phone && (isOwnProfile || userData.showPhoneOnAdverts) ? (
                                            userData.phone
                                        ) : (
                                            <p className="up-contact-privacy-note">
                                                <FontAwesomeIcon icon={faEyeSlash} /> {userData.phone ? "Phone number is private" : "Phone number not provided"}
                                            </p>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <div className="up-toggle-visibility">
                                            <label className="up-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={userData.showPhoneOnAdverts || false}
                                                    onChange={handleTogglePhoneVisibility}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span className="up-checkbox-text">Show my phone number on my adverts and profile</span>
                                            </label>
                                            <p className="up-checkbox-note">
                                                If enabled, your phone number will appear on your adverts and profile, allowing other registered users to contact you directly.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="up-contact-group">
                                    <h3 className="up-contact-group-title">
                                        <FontAwesomeIcon icon={faEnvelopeOpenText} />
                                        Notification Preferences
                                    </h3>
                                    <div className="up-contact-value">
                                        <p className="up-notification-status">
                                            {userData.allowNotifications !== false ? (
                                                <span className="up-notifications-enabled">
                                                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '8px' }} />
                                                    Email and SMS notifications are enabled
                                                </span>
                                            ) : (
                                                <span className="up-notifications-disabled">
                                                    <FontAwesomeIcon icon={faEyeSlash} style={{ color: '#6b7280', marginRight: '8px' }} />
                                                    All notifications are disabled
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {isOwnProfile && (
                                        <div className="up-toggle-visibility">
                                            <label className="up-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={userData.allowNotifications !== false}
                                                    onChange={handleToggleNotifications}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span className="up-checkbox-text">Allow email and SMS notifications</span>
                                            </label>
                                            <p className="up-checkbox-note">
                                                When disabled, you will not receive any email or SMS notifications from our platform, including messages, updates, and alerts.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="up-contact-group">
                                    <h3 className="up-contact-group-title">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                                        Address
                                    </h3>
                                    <div className="up-contact-address">
                                        {isOwnProfile ? (
                                            <>
                                                {userData.address1 && <div>{userData.address1}</div>}
                                                {userData.address2 && <div>{userData.address2}</div>}
                                                {userData.city && <div>{userData.city}</div>}
                                                {userData.county && <div>{userData.county}</div>}
                                                {userData.postcode && <div className="up-contact-postcode">{userData.postcode}</div>}
                                                {!userData.address1 && !userData.address2 && !userData.city &&
                                                    !userData.county && !userData.postcode && <div>No address provided</div>}
                                            </>
                                        ) : (
                                            <>
                                                {userData.postcode ? (
                                                    <div className="up-contact-postcode-only">
                                                        <span>Postcode: {userData.postcode}</span>
                                                        <p className="up-address-privacy-note">
                                                            <FontAwesomeIcon icon={faEyeSlash} /> Full address is only visible to the profile owner
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="up-contact-privacy-note">
                                                        <FontAwesomeIcon icon={faEyeSlash} /> No location information available
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isOwnProfile && (
                                    <div className="up-contact-actions">
                                        <button
                                            className="up-edit-contact-btn"
                                            onClick={() => openProfileSettings('profile')}
                                        >
                                            <FontAwesomeIcon icon={faPencilAlt} />
                                            Edit Contact Details
                                        </button>

                                        <button
                                            className="up-change-password-btn"
                                            onClick={() => openProfileSettings('password')}
                                        >
                                            <FontAwesomeIcon icon={faLock} />
                                            Change Password
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isOwnProfile && (
                                <DeleteAccountSection
                                    currentUserId={currentUserId}
                                    userEmail={userData.email}
                                />
                            )}
                        </div>
                    )}

                    {activeSection === 'features' && isOwnProfile && (
                        <FeatureRequestSection isOwnProfile={isOwnProfile} userId={uid} />
                    )}
                </div>

                {showReportUserModal && (
                    <div className="modal-overlay" onClick={() => setShowReportUserModal(false)}>
                        <div className="report-user-modal" onClick={e => e.stopPropagation()}>
                            <button className="close-modal" onClick={() => setShowReportUserModal(false)}>×</button>
                            <h2>Report User</h2>

                            <label htmlFor="user-report-reason">Reason for Reporting</label>
                            <select
                                id="user-report-reason"
                                value={userReportReason}
                                onChange={e => setUserReportReason(e.target.value)}
                                required
                            >
                                <option value="">Select a reason</option>
                                <option value="Inappropriate Behaviour">Inappropriate Behaviour</option>
                                <option value="Spam or Scam">Spam or Scam</option>
                                <option value="Fraudulent Information">Fraudulent Information</option>
                                <option value="Other">Other</option>
                            </select>

                            <label htmlFor="user-report-comments">Additional Comments (optional)</label>
                            <textarea
                                id="user-report-comments"
                                value={userReportComments}
                                onChange={e => setUserReportComments(e.target.value)}
                                placeholder="Provide any additional details here..."
                            />

                            <button
                                className="submit-report-btn"
                                disabled={!userReportReason || userReportSubmitting}
                                onClick={async () => {
                                    if (!userReportReason) {
                                        alert("Please select a reason.");
                                        return;
                                    }
                                    setUserReportSubmitting(true);
                                    try {
                                        await addDoc(collection(db, "userReports"), {
                                            reportedUserId: uid,
                                            reporterId: currentUserId,
                                            reporterEmail: auth.currentUser.email,
                                            reporterName: userData.firstName ? `${userData.firstName} ${userData.lastName || ""}`.trim() : "",
                                            reason: userReportReason,
                                            comments: userReportComments,
                                            createdAt: serverTimestamp(),
                                            status: "pending"
                                        });
                                        alert("Report submitted successfully.");
                                        setShowReportUserModal(false);
                                        setUserReportReason('');
                                        setUserReportComments('');
                                    } catch (error) {
                                        console.error("Failed to submit user report:", error);
                                        alert("Failed to submit report. Please try again later.");
                                    } finally {
                                        setUserReportSubmitting(false);
                                    }
                                }}
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                )}

                {isOwnProfile && showSettingsModal && (
                    <ProfileSettingsModal
                        currentData={userData}
                        onSave={handleSaveContact}
                        onClose={() => setShowSettingsModal(false)}
                        initialTab={settingsInitialTab}
                    />
                )}
            </div>
        </>
    );
}