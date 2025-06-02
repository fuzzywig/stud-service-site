// src/pages/admin/ApproveReviews.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
    collectionGroup,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    orderBy,
    limit,
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import {
    FaCheck,
    FaTimes,
    FaStar,
    FaUser,
    FaCalendarAlt,
    FaComment,
    FaSearch,
    FaEnvelope,
    FaCheckCircle,
    FaSpinner,
    FaExclamationCircle,
    FaUserCheck,
    FaUserTimes,
    FaChevronDown,
    FaChevronUp,
    FaComments,
    FaInfoCircle
} from "react-icons/fa";
import "./ApproveReviews.css";

export default function ApproveReviews() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedReviews, setExpandedReviews] = useState({});
    const [loadingActions, setLoadingActions] = useState({});
    const [filterType, setFilterType] = useState('all'); // all, listing, user
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating-high, rating-low

    const [senderNames, setSenderNames] = useState({});

    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    console.log("Current User ID:", currentUserId);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messagesError, setMessagesError] = useState(null);


    const [selectedReviewId, setSelectedReviewId] = useState(null);
    const [conversationData, setConversationData] = useState(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    const [conversationError, setConversationError] = useState(null);

    const fetchConversationActivity = async (advertId, reviewerId, ownerId) => {
        try {
            const q = query(
                collection(db, "conversations"),
                where("advertId", "==", advertId),
                where("users", "array-contains", reviewerId)
            );

            const snap = await getDocs(q);
            let convo = null;

            snap.forEach(doc => {
                const data = doc.data();
                if (data.users.includes(ownerId)) {
                    convo = { id: doc.id, ...data };
                }
            });

            return convo;
        } catch (err) {
            console.error("Error fetching conversation:", err);
            return null;
        }
    };

    const fetchConversationMessages = async (conversationId) => {
        try {
            setIsLoadingMessages(true);
            setMessagesError(null);

            const messagesQuery = query(
                collection(db, "conversations", conversationId, "messages"),
                orderBy("createdAt", "desc"),
                limit(30)
            );

            const messagesSnap = await getDocs(messagesQuery);

            const messages = messagesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            const orderedMessages = messages.reverse(); // Show oldest first
            setConversationMessages(orderedMessages);
            return orderedMessages;  // <--- Return here!
        } catch (error) {
            console.error("Failed to fetch conversation messages:", error);
            setMessagesError("Failed to load messages.");
            setConversationMessages([]);
            return [];
        } finally {
            setIsLoadingMessages(false);
        }
    };


    const handleLookupActivity = async (advertId, reviewerId, ownerId, reviewId) => {
        setSelectedReviewId(reviewId);
        setConversationData(null);
        setConversationMessages([]);   // Clear messages initially
        setConversationError(null);
        setMessagesError(null);
        setIsLoadingConversation(true);

        try {
            const conversation = await fetchConversationActivity(advertId, reviewerId, ownerId);

            if (conversation) {
                setConversationData(conversation);

                // Fetch messages
                const messages = await fetchConversationMessages(conversation.id);
                setConversationMessages(messages);

                // Fetch sender names for these messages
                if (messages && messages.length > 0) {
                    await fetchSenderNames(messages);
                } else {
                    setSenderNames({}); // no messages, clear sender names
                }
            } else {
                setConversationError("No conversation found between these users for this listing.");
                setConversationMessages([]);
                setSenderNames({});
            }
        } catch (err) {
            console.error("Error in handleLookupActivity:", err);
            setConversationError("Error fetching conversation data.");
            setConversationMessages([]);
            setSenderNames({});
        } finally {
            setIsLoadingConversation(false);
        }
    };



    const toggleReviewExpansion = (reviewId) => {
        setExpandedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    const fetchSenderNames = async (messages) => {
        const ids = [...new Set(messages.map(m => m.from))];
        const namesMap = {};

        for (const id of ids) {
            const userDoc = await getDoc(doc(db, "users", id));
            if (userDoc.exists()) {
                const data = userDoc.data();
                namesMap[id] = data.firstName || id; // fallback to id if no name
            }
        }

        setSenderNames(namesMap); // update the state with fetched names
    };


    useEffect(() => {
        const fetchUnapprovedReviews = async () => {
            try {
                setIsLoading(true);
                const q = query(collectionGroup(db, "reviews"), where("approved", "==", false));
                const snapshot = await getDocs(q);

                const list = await Promise.all(snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const path = docSnap.ref.path;
                    const reviewId = docSnap.id;

                    let itemDetails = null;
                    let reviewerDetails = {};
                    let ownerDetails = {};

                    try {
                        // Fetch advert info if advertId is present
                        if (data.advertId) {
                            const advertRef = doc(db, "allListings", data.advertId);
                            const advertSnap = await getDoc(advertRef);

                            if (advertSnap.exists()) {
                                const advertData = advertSnap.data();
                                itemDetails = {
                                    name: advertData.title || advertData.breedOrType || "Unnamed",
                                    type: "Listing",
                                    price: advertData.price,
                                    category: advertData.category,
                                    image: advertData.images?.[0],
                                };

                                // Fetch advert owner
                                if (advertData.ownerId) {
                                    const ownerSnap = await getDoc(doc(db, "users", advertData.ownerId));
                                    if (ownerSnap.exists()) {
                                        ownerDetails = ownerSnap.data();
                                        ownerDetails.userId = advertData.ownerId;
                                    }
                                }
                            }
                        }

                        // Fetch reviewer details
                        if (data.reviewerId) {
                            const reviewerSnap = await getDoc(doc(db, "users", data.reviewerId));
                            if (reviewerSnap.exists()) {
                                reviewerDetails = reviewerSnap.data();
                                reviewerDetails.userId = data.reviewerId;
                            }
                        }

                    } catch (err) {
                        console.warn("Could not fetch related details:", err);
                    }

                    return {
                        id: reviewId,
                        path,
                        ...data,
                        comment: data.text || "",
                        itemDetails,
                        formattedDate: data.createdAt && data.createdAt.seconds
                            ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
                            : "Unknown",
                        timestamp: data.createdAt?.seconds || 0,
                        reviewerDetails,
                        ownerDetails,
                    };
                }));

                setReviews(list);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnapprovedReviews();
    }, []);

    const approveReview = async (review) => {
        setLoadingActions(prev => ({ ...prev, [`approve-${review.id}`]: true }));
        try {
            const reviewRef = doc(db, review.path);
            await updateDoc(reviewRef, { approved: true });
            setReviews(prev => prev.filter(r => r.path !== review.path));
        } catch (err) {
            console.error("Failed to approve review:", err);
            alert("Failed to approve review. Please try again.");
        } finally {
            setLoadingActions(prev => ({ ...prev, [`approve-${review.id}`]: false }));
        }
    };

    const rejectReview = async (review) => {
        if (window.confirm("Are you sure you want to reject and delete this review?")) {
            setLoadingActions(prev => ({ ...prev, [`reject-${review.id}`]: true }));
            try {
                const reviewRef = doc(db, review.path);
                await deleteDoc(reviewRef);
                setReviews(prev => prev.filter(r => r.path !== review.path));
            } catch (err) {
                console.error("Failed to reject review:", err);
                alert("Failed to reject review. Please try again.");
            } finally {
                setLoadingActions(prev => ({ ...prev, [`reject-${review.id}`]: false }));
            }
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    // Filter and sort reviews
    let processedReviews = [...reviews];

    // Apply type filter
    if (filterType !== 'all') {
        processedReviews = processedReviews.filter(review => {
            if (filterType === 'listing') return review.itemDetails?.type === 'Listing';
            if (filterType === 'user') return review.itemDetails?.type === 'User';
            return true;
        });
    }

    // Apply search filter
    if (searchTerm) {
        processedReviews = processedReviews.filter(review => {
            const term = searchTerm.toLowerCase();
            return (
                (review.reviewerDetails?.firstName?.toLowerCase().includes(term)) ||
                (review.reviewerDetails?.lastName?.toLowerCase().includes(term)) ||
                (review.reviewerDetails?.email?.toLowerCase().includes(term)) ||
                (review.comment?.toLowerCase().includes(term)) ||
                (review.itemDetails?.name?.toLowerCase().includes(term)) ||
                (review.ownerDetails?.firstName?.toLowerCase().includes(term)) ||
                (review.ownerDetails?.lastName?.toLowerCase().includes(term))
            );
        });
    }

    // Apply sorting
    processedReviews.sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return a.timestamp - b.timestamp;
            case 'rating-high':
                return (b.rating || 0) - (a.rating || 0);
            case 'rating-low':
                return (a.rating || 0) - (b.rating || 0);
            default: // newest
                return b.timestamp - a.timestamp;
        }
    });

    return (
        <div className="admin-approve-reviews-page">
            <AdminSidebar />

            <div className="apr-content-area">
                <div className="apr-page-header">
                    <div className="apr-header-content">
                        <h1 className="apr-page-title">Review Approval Center</h1>
                        <p className="apr-page-description">
                            Review and moderate user-submitted reviews before they go live
                        </p>
                    </div>
                    <div className="apr-header-stats">
                        <div className="apr-stat-card">
                            <FaExclamationCircle className="apr-stat-icon pending" />
                            <div className="apr-stat-content">
                                <span className="apr-stat-value">{reviews.length}</span>
                                <span className="apr-stat-label">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="apr-controls-section">
                    <div className="apr-search-container">
                        <FaSearch className="apr-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by reviewer name, email, content, or listing..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="apr-search-input"
                        />
                        {searchTerm && (
                            <button
                                className="apr-clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <div className="apr-filter-controls">
                        <div className="apr-filter-group">
                            <label className="apr-filter-label">Type:</label>
                            <select
                                className="apr-filter-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Reviews</option>
                                <option value="listing">Listing Reviews</option>
                                <option value="user">User Reviews</option>
                            </select>
                        </div>

                        <div className="apr-filter-group">
                            <label className="apr-filter-label">Sort:</label>
                            <select
                                className="apr-filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="rating-high">Highest Rating</option>
                                <option value="rating-low">Lowest Rating</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="apr-loading-container">
                        <div className="apr-loading-spinner">
                            <FaSpinner className="apr-spinner-icon" />
                        </div>
                        <p className="apr-loading-text">Loading pending reviews...</p>
                    </div>
                ) : processedReviews.length === 0 ? (
                    <div className="apr-empty-state">
                        <div className="apr-empty-content">
                            {reviews.length === 0 ? (
                                <>
                                    <FaCheckCircle className="apr-empty-icon success" />
                                    <h2>All Caught Up!</h2>
                                    <p>There are no reviews awaiting approval at this time.</p>
                                </>
                            ) : (
                                <>
                                    <FaSearch className="apr-empty-icon" />
                                    <h2>No Results Found</h2>
                                    <p>Try adjusting your search or filters to find reviews.</p>
                                    <button
                                        className="apr-reset-button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterType('all');
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="apr-results-info">
                        <span>Showing {processedReviews.length} of {reviews.length} pending reviews</span>
                    </div>
                )}

                <div className="apr-reviews-list">
                    {processedReviews.map(review => (
                        <div key={review.id} className="apr-review-card">
                            <div className="apr-review-header">
                                <div className="apr-reviewer-info">
                                    <div className="apr-avatar-wrapper">
                                        {review.reviewerDetails?.avatar ? (
                                            <img
                                                src={review.reviewerDetails.avatar}
                                                alt={`${review.reviewerDetails.firstName} ${review.reviewerDetails.lastName}`}
                                                className="apr-reviewer-avatar"
                                            />
                                        ) : (
                                            <div className="apr-avatar-placeholder">
                                                <FaUser />
                                            </div>
                                        )}
                                    </div>
                                    <div className="apr-reviewer-details">
                                        <h3 className="apr-reviewer-name">
                                            {review.reviewerDetails?.firstName} {review.reviewerDetails?.lastName || "Anonymous"}
                                        </h3>
                                        <span className="apr-reviewer-email">
                                            <FaEnvelope className="apr-detail-icon" />
                                            {review.reviewerDetails?.email || "No email"}
                                        </span>
                                    </div>
                                </div>

                                <div className="apr-review-meta">
                                    <div className="apr-rating-display">
                                        <div className="apr-rating-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={i < review.rating ? "apr-star-filled" : "apr-star-empty"}
                                                />
                                            ))}
                                        </div>
                                        <span className="apr-rating-value">{review.rating}/5</span>
                                    </div>
                                    <span className="apr-review-date">
                                        <FaCalendarAlt className="apr-detail-icon" />
                                        {review.formattedDate}
                                    </span>
                                </div>
                            </div>

                            {review.itemDetails && (
                                <div className="apr-reviewed-item">
                                    <div className="apr-item-badge">
                                        {review.itemDetails.type === 'Listing' ? 'Listing Review' : 'User Review'}
                                    </div>
                                    <div className="apr-item-info">
                                        {review.itemDetails.image && (
                                            <img
                                                src={review.itemDetails.image}
                                                alt={review.itemDetails.name}
                                                className="apr-item-image"
                                            />
                                        )}
                                        <div className="apr-item-details">
                                            <h4 className="apr-item-name">{review.itemDetails.name}</h4>
                                            {review.itemDetails.category && (
                                                <span className="apr-item-category">{review.itemDetails.category}</span>
                                            )}
                                            {review.itemDetails.price && (
                                                <span className="apr-item-price">£{review.itemDetails.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="apr-review-content">
                                <FaComment className="apr-content-icon" />
                                <p className="apr-review-text">
                                    {review.comment || "No comment provided"}
                                </p>
                            </div>

                            <div className="apr-review-footer">
                                <button
                                    className="apr-expand-button"
                                    onClick={() => toggleReviewExpansion(review.id)}
                                >
                                    <FaInfoCircle />
                                    {expandedReviews[review.id] ? 'Hide' : 'Show'} Details
                                    {expandedReviews[review.id] ? <FaChevronUp /> : <FaChevronDown />}
                                </button>

                                <div className="apr-action-buttons">
                                    <button
                                        className="apr-action-button apr-approve"
                                        onClick={() => approveReview(review)}
                                        disabled={loadingActions[`approve-${review.id}`]}
                                    >
                                        {loadingActions[`approve-${review.id}`] ? (
                                            <FaSpinner className="apr-spinner" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        className="apr-action-button apr-reject"
                                        onClick={() => rejectReview(review)}
                                        disabled={loadingActions[`reject-${review.id}`]}
                                    >
                                        {loadingActions[`reject-${review.id}`] ? (
                                            <FaSpinner className="apr-spinner" />
                                        ) : (
                                            <FaTimes />
                                        )}
                                        Reject
                                    </button>
                                </div>
                            </div>

                            {expandedReviews[review.id] && (
                                <div className="apr-expanded-details">
                                    <div className="apr-details-grid">
                                        <div className="apr-detail-section">
                                            <h4 className="apr-detail-title">
                                                <FaUserCheck /> Reviewer Details
                                            </h4>
                                            <div className="apr-detail-content">
                                                <p><strong>Name:</strong> {review.reviewerDetails?.firstName} {review.reviewerDetails?.lastName || "Unknown"}</p>
                                                <p><strong>Email:</strong> {review.reviewerDetails?.email || "N/A"}</p>
                                                <p><strong>Phone:</strong> {review.reviewerDetails?.phone || "N/A"}</p>
                                                <p><strong>Location:</strong> {
                                                    review.reviewerDetails?.city || review.reviewerDetails?.county
                                                        ? `${review.reviewerDetails.city || ''} ${review.reviewerDetails.county ? `, ${review.reviewerDetails.county}` : ''}`.trim()
                                                        : "N/A"
                                                }</p>
                                                <p><strong>User ID:</strong> <code>{review.reviewerDetails?.userId || review.reviewerId}</code></p>
                                            </div>
                                        </div>

                                        <div className="apr-detail-section">
                                            <h4 className="apr-detail-title">
                                                <FaUserTimes /> Reviewed User
                                            </h4>
                                            <div className="apr-detail-content">
                                                <p><strong>Name:</strong> {review.ownerDetails?.firstName} {review.ownerDetails?.lastName || "Unknown"}</p>
                                                <p><strong>Email:</strong> {review.ownerDetails?.email || "N/A"}</p>
                                                <p><strong>Phone:</strong> {review.ownerDetails?.phone || "N/A"}</p>
                                                <p><strong>Location:</strong> {
                                                    review.ownerDetails?.city || review.ownerDetails?.county
                                                        ? `${review.ownerDetails.city || ''} ${review.ownerDetails.county ? `, ${review.ownerDetails.county}` : ''}`.trim()
                                                        : "N/A"
                                                }</p>
                                                <p><strong>User ID:</strong> <code>{review.ownerDetails?.userId || review.ownerId}</code></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="apr-conversation-section">
                                        <button
                                            className="apr-lookup-button"
                                            onClick={() => handleLookupActivity(review.advertId, review.reviewerId, review.ownerId, review.id)}
                                            disabled={isLoadingConversation && selectedReviewId === review.id}
                                        >
                                            <FaComments />
                                            {isLoadingConversation && selectedReviewId === review.id ? (
                                                <>
                                                    <FaSpinner className="apr-spinner" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Check Conversation History'
                                            )}
                                        </button>

                                        {selectedReviewId === review.id && (
                                            <div className="apr-conversation-results">
                                                {conversationError && (
                                                    <div className="apr-conversation-error">
                                                        <FaExclamationCircle />
                                                        {conversationError}
                                                    </div>
                                                )}
                                                {conversationData && (
                                                    <div className="apr-conversation-data">
                                                        <h5>
                                                            <FaComments /> Conversation Found
                                                        </h5>
                                                        <div className="apr-conversation-details">
                                                            <p><strong>Conversation ID:</strong> <code>{conversationData.id}</code></p>
                                                            <p><strong>Listing:</strong> {conversationData.advertTitle || "Unknown"}</p>
                                                            <p><strong>Last Message:</strong> {conversationData.lastMessageText || "No messages"}</p>
                                                            <p><strong>Last Updated:</strong> {
                                                                conversationData.lastUpdated?.seconds
                                                                    ? new Date(conversationData.lastUpdated.seconds * 1000).toLocaleString()
                                                                    : "Unknown"
                                                            }</p>
                                                            <p><strong>Participants:</strong> {conversationData.users?.length || 0} users</p>
                                                        </div>

                                                        <div className="apr-messages-section">
                                                            <h6>Last 30 Messages</h6>

                                                            {isLoadingMessages ? (
                                                                <p>Loading messages...</p>
                                                            ) : messagesError ? (
                                                                <p className="error">{messagesError}</p>
                                                            ) : conversationMessages.length === 0 ? (
                                                                <p>No messages found in this conversation.</p>
                                                            ) : (
                                                                <ul className="apr-message-list">
                                                                    {conversationMessages.map(msg => {
                                                                        const isCurrentUser = msg.from === currentUserId;
                                                                        const senderName = senderNames[msg.from] || msg.from;

                                                                        // You might have a filename or fileUrl field for images
                                                                        const isImage = msg.text && /\.(jpeg|jpg|gif|png|webp|bmp)(\?|$)/i.test(msg.text);

                                                                        return (
                                                                            <li
                                                                                key={msg.id}
                                                                                className={`apr-message-item ${isCurrentUser ? "apr-message-sent" : "apr-message-received"}`}
                                                                                style={{ backgroundColor: isCurrentUser ? 'lightgreen' : 'lightgray', float: isCurrentUser ? 'right' : 'left', clear: 'both' }}
                                                                            >
                                                                                <strong>{isCurrentUser ? "You" : senderName}:</strong>
                                                                                <br />
                                                                                {isImage ? (
                                                                                    <img
                                                                                        src={msg.text}
                                                                                        alt="Sent Image"
                                                                                        style={{ maxWidth: "200px", maxHeight: "200px", marginTop: "5px", borderRadius: "8px" }}
                                                                                    />
                                                                                ) : (
                                                                                    msg.text
                                                                                )}
                                                                                <br />
                                                                                <small>{msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : "Unknown time"}</small>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>






                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}