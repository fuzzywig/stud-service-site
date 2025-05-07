// src/pages/admin/ApproveReviews.jsx
import React, { useEffect, useState } from "react";
import {
    collectionGroup,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import { FaCheck, FaTimes, FaStar, FaUser, FaCalendarAlt, FaComment } from "react-icons/fa";
import "./ApproveReviews.css";

export default function ApproveReviews() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);

    useEffect(() => {
        const fetchUnapprovedReviews = async () => {
            try {
                setIsLoading(true);
                const q = query(
                    collectionGroup(db, "reviews"),
                    where("approved", "==", false)
                );
                const snapshot = await getDocs(q);
                const list = await Promise.all(snapshot.docs.map(async doc => {
                    const data = doc.data();
                    // Try to get more context about what this review is for
                    let itemDetails = null;
                    try {
                        // Assuming the review is in a subcollection of an advert
                        const parentPath = doc.ref.path.split('/reviews/')[0];
                        if (parentPath) {
                            const parentDoc = await getDoc(doc(db, parentPath));
                            if (parentDoc.exists()) {
                                itemDetails = {
                                    name: parentDoc.data().name || parentDoc.data().breed || 'Unknown item',
                                    type: parentPath.includes('studAds') ? 'Stud Advert' : 'Item'
                                };
                            }
                        }
                    } catch (err) {
                        console.warn("Could not fetch parent item:", err);
                    }

                    return {
                        id: doc.id,
                        ...data,
                        path: doc.ref.path,
                        itemDetails,
                        formattedDate: data.date ? new Date(data.date.seconds * 1000).toLocaleDateString() : 'Unknown date'
                    };
                }));
                setReviews(list);
            } catch (err) {
                console.error("❌ Failed to fetch reviews:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnapprovedReviews();
    }, []);

    const approveReview = async (reviewPath) => {
        try {
            const reviewRef = doc(db, reviewPath);
            await updateDoc(reviewRef, { approved: true });
            setReviews(prev => prev.filter(r => r.path !== reviewPath));

            if (selectedReview && selectedReview.path === reviewPath) {
                setSelectedReview(null);
            }
        } catch (err) {
            console.error("❌ Failed to approve review:", err);
        }
    };

    const rejectReview = async (reviewPath) => {
        if (window.confirm("Are you sure you want to reject and delete this review?")) {
            try {
                const reviewRef = doc(db, reviewPath);
                await deleteDoc(reviewRef);
                setReviews(prev => prev.filter(r => r.path !== reviewPath));

                if (selectedReview && selectedReview.path === reviewPath) {
                    setSelectedReview(null);
                }
            } catch (err) {
                console.error("❌ Failed to reject review:", err);
            }
        }
    };

    const formatReviewText = (text) => {
        if (!text) return "No comment provided";

        // If text is already short, return as is
        if (text.length <= 150) return text;

        // Otherwise truncate for the card view
        return text.substring(0, 150) + "...";
    };

    return (
        <div className="admin-approve-reviews-page">
            <AdminSidebar />

            <div className="content-area">
                <h1 className="page-title">Approve Reviews</h1>

                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-animation">
                            <div className="loading-circle"></div>
                            <div className="loading-lines">
                                <div className="loading-line"></div>
                                <div className="loading-line"></div>
                                <div className="loading-line"></div>
                            </div>
                        </div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-content">
                            <FaCheck className="empty-state-icon" />
                            <h2>All Caught Up!</h2>
                            <p>There are no reviews awaiting approval at this time.</p>
                        </div>
                    </div>
                ) : (
                    <div className="reviews-grid">
                        {reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {review.reviewerAvatar ? (
                                                <img src={review.reviewerAvatar} alt={review.reviewerName} />
                                            ) : (
                                                <FaUser />
                                            )}
                                        </div>
                                        <div className="reviewer-details">
                                            <h3 className="reviewer-name">{review.reviewerName || "Anonymous user"}</h3>
                                            <div className="review-metadata">
                                                <div className="rating">
                                                    <FaStar className="star-icon" />
                                                    <span>{review.rating || "No rating"}</span>
                                                </div>
                                                <div className="review-date">
                                                    <FaCalendarAlt className="date-icon" />
                                                    <span>{review.formattedDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {review.itemDetails && (
                                    <div className="reviewed-item">
                                        <span className="item-type">{review.itemDetails.type}</span>
                                        <span className="item-name">{review.itemDetails.name}</span>
                                    </div>
                                )}

                                <div className="review-content">
                                    <FaComment className="comment-icon" />
                                    <p className="review-text">{formatReviewText(review.comment)}</p>
                                </div>

                                <div className="review-actions">
                                    <button
                                        className="action-button view"
                                        onClick={() => setSelectedReview(review)}
                                    >
                                        View Full Review
                                    </button>
                                    <div className="action-buttons">
                                        <button
                                            className="action-button approve"
                                            onClick={() => approveReview(review.path)}
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            className="action-button reject"
                                            onClick={() => rejectReview(review.path)}
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Review Detail Modal */}
                {selectedReview && (
                    <div className="review-detail-modal">
                        <div className="modal-backdrop" onClick={() => setSelectedReview(null)}></div>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title">Review Details</h3>
                                <button className="modal-close" onClick={() => setSelectedReview(null)}>✕</button>
                            </div>

                            <div className="modal-body">
                                <div className="reviewer-section">
                                    <div className="reviewer-info-large">
                                        <div className="reviewer-avatar-large">
                                            {selectedReview.reviewerAvatar ? (
                                                <img src={selectedReview.reviewerAvatar} alt={selectedReview.reviewerName} />
                                            ) : (
                                                <FaUser />
                                            )}
                                        </div>
                                        <div className="reviewer-details-large">
                                            <h4 className="reviewer-name-large">{selectedReview.reviewerName || "Anonymous user"}</h4>

                                            <div className="rating-large">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        className={i < selectedReview.rating ? "star-filled" : "star-empty"}
                                                    />
                                                ))}
                                                <span className="rating-text">({selectedReview.rating || 0} out of 5)</span>
                                            </div>

                                            <div className="review-date-large">
                                                <FaCalendarAlt className="date-icon" />
                                                <span>Posted on {selectedReview.formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedReview.itemDetails && (
                                    <div className="item-details-section">
                                        <h4>Reviewed Item</h4>
                                        <div className="item-detail">
                                            <span className="item-label">Type:</span>
                                            <span className="item-value">{selectedReview.itemDetails.type}</span>
                                        </div>
                                        <div className="item-detail">
                                            <span className="item-label">Name:</span>
                                            <span className="item-value">{selectedReview.itemDetails.name}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="review-content-section">
                                    <h4>Review Content</h4>
                                    <div className="review-full-text">
                                        {selectedReview.comment || "No comment was provided with this review."}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="modal-action-button approve"
                                    onClick={() => approveReview(selectedReview.path)}
                                >
                                    <FaCheck /> Approve Review
                                </button>
                                <button
                                    className="modal-action-button reject"
                                    onClick={() => rejectReview(selectedReview.path)}
                                >
                                    <FaTimes /> Reject Review
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}