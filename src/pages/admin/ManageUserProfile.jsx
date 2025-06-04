// src/pages/admin/ManageUserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/AdminSidebar';
import './ManageUserProfile.css';
import { FaUserCircle, FaTimes } from 'react-icons/fa';
import EditContactModal from "../../components/EditContactModal";

const ManageUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [adverts, setAdverts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [userNotes, setUserNotes] = useState([]);
    const [noteText, setNoteText] = useState('');
    const [showNotesPopup, setShowNotesPopup] = useState(false);

    // State for review modal
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Handle opening review modal
    const openReviewModal = (review) => {
        setSelectedReview(review);
        setShowReviewModal(true);
        document.body.style.overflow = 'hidden';
    };

    // Handle closing review modal
    const closeReviewModal = () => {
        setShowReviewModal(false);
        setSelectedReview(null);
        // Re-enable scrolling
        document.body.style.overflow = 'auto';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData(userSnap.data());

                    const fetchAdminNotes = async () => {
                        const notesSnap = await getDocs(
                            query(collection(db, 'adminNotes'), where('userId', '==', userId))
                        );
                        setUserNotes(notesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                    };

                    await fetchAdminNotes();
                }

                const advertsQuery = query(collection(db, 'allListings'), where('ownerId', '==', userId));
                const advertsSnap = await getDocs(advertsQuery);
                const advertsList = advertsSnap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        paused: data.paused || false
                    };
                });
                setAdverts(advertsList);

                // Collect advertIds
                const advertIds = advertsList.map(ad => ad.id);

                if (advertIds.length > 0) {
                    const reviewsQuery = query(
                        collection(db, 'reviews'),
                        where('advertId', 'in', advertIds.slice(0, 10)) // Firestore allows up to 10
                    );
                    const reviewsSnap = await getDocs(reviewsQuery);

                    const enrichedReviews = await Promise.all(
                        reviewsSnap.docs.map(async (docSnap) => {
                            const review = docSnap.data();
                            const reviewerId = review.reviewerId;

                            let reviewerName = 'Unknown';

                            // Prevent crashing if userId is missing
                            if (!reviewerId) {
                                console.warn(`Review ${docSnap.id} has no userId`);
                                return {
                                    id: docSnap.id,
                                    ...review,
                                    reviewerName: 'Unknown',
                                    reviewDate: review.createdAt?.seconds
                                        ? new Date(review.createdAt.seconds * 1000).toLocaleDateString()
                                        : 'No date'
                                };
                            }

                            try {
                                const userSnap = await getDoc(doc(db, 'users', reviewerId));
                                if (userSnap.exists()) {
                                    const u = userSnap.data();
                                    reviewerName = `${u.firstName || 'Unknown'} ${u.lastName?.charAt(0) || ''}.`;
                                }
                            } catch (e) {
                                console.warn(`Failed to fetch reviewer ${reviewerId}`, e);
                            }

                            return {
                                id: docSnap.id,
                                ...review,
                                reviewerName,
                                reviewDate: review.createdAt?.seconds
                                    ? new Date(review.createdAt.seconds * 1000).toLocaleDateString()
                                    : 'No date'
                            };
                        })
                    );

                    setReviews(enrichedReviews);
                } else {
                    setReviews([]);
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const togglePause = async (adId, currentlyPaused) => {
        try {
            const adRef = doc(db, "allListings", adId);
            await updateDoc(adRef, { paused: !currentlyPaused });
            setAdverts(prev =>
                prev.map(ad => ad.id === adId ? { ...ad, paused: !currentlyPaused } : ad)
            );
        } catch (error) {
            console.error("Error toggling pause state:", error);
            alert("Failed to update pause state.");
        }
    };

    const handleViewAdvert = (adId) => {
        navigate(`/admin/view-advert/${adId}`);
    };

    const handleEditUser = () => {
        setShowEditModal(true);
    };

    const handlePauseUser = () => {
        // Placeholder for pause user functionality
        console.log("Pause user:", userId);
    };

    const handleToggleBlacklist = async () => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                blacklisted: !userData.blacklisted,
            });
            setUserData((prev) => ({
                ...prev,
                blacklisted: !prev.blacklisted,
            }));
        } catch (error) {
            console.error("Error updating blacklist status:", error);
            alert("Failed to update user status.");
        }
    };

    const handleDeleteUser = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this user and all related data? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete user document
            await deleteDoc(doc(db, "users", userId));

            // Delete their stud adverts
            const adsSnap = await getDocs(query(collection(db, "allListings"), where("ownerId", "==", userId)));
            const adDeletes = adsSnap.docs.map(docSnap => deleteDoc(doc(db, "allListings", docSnap.id)));
            await Promise.all(adDeletes);

            // Delete their reviews
            const reviewsSnap = await getDocs(query(collection(db, "reviews"), where("reviewerId", "==", userId)));
            const reviewDeletes = reviewsSnap.docs.map(docSnap => deleteDoc(doc(db, "reviews", docSnap.id)));
            await Promise.all(reviewDeletes);

            alert("User and associated data successfully deleted.");
            navigate("/admin/manage-users");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. Check console for details.");
        }
    };

    const handleRemoveAdvert = async (adId) => {
        const confirm = window.confirm("Are you sure you want to permanently delete this advert?");
        if (!confirm) return;

        try {
            await deleteDoc(doc(db, "allListings", adId));
            setAdverts(prev => prev.filter(ad => ad.id !== adId));
            alert("Advert successfully deleted.");
        } catch (error) {
            console.error("Error deleting advert:", error);
            alert("Failed to delete advert.");
        }
    };

    return (
        <div className="mup-page">
            <AdminSidebar />

            <div className="mup-content-area">
                <h1 className="mup-page-title">Manage User Profile</h1>

                {isLoading ? (
                    <div className="mup-loading-container">
                        <div className="mup-loading-animation">
                            <div className="mup-loading-circle"></div>
                            <div className="mup-loading-lines">
                                <div className="mup-loading-line"></div>
                                <div className="mup-loading-line"></div>
                                <div className="mup-loading-line"></div>
                            </div>
                        </div>
                    </div>
                ) : userData ? (
                    <div className="mup-profile-container">
                        <div className="mup-profile-header">
                            <div className="mup-user-summary">
                                <div className="mup-avatar-container">
                                    {userData.avatar ? (
                                        <img src={userData.avatar} alt="Avatar" className="mup-user-avatar" />
                                    ) : (
                                        <FaUserCircle className="mup-user-avatar mup-default-avatar-icon" />
                                    )}

                                    <span className={`mup-status-indicator ${userData.blacklisted ? 'mup-status-blacklisted' : 'mup-status-active'}`}></span>
                                </div>
                                <div className="mup-user-header-details">
                                    <h2 className="mup-user-name">{userData.firstName} {userData.lastName}</h2>
                                    <p className="mup-user-id">UID: {userId}</p>
                                    <span className={`mup-user-status-badge ${
                                        userData.blacklisted
                                            ? 'mup-status-badge-blacklisted'
                                            : 'mup-status-badge-active'
                                    }`}>
                                        {userData.blacklisted ? 'Blacklisted' : 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div className="mup-action-buttons">
                                <button
                                    className="mup-action-button mup-edit-button"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    Edit
                                </button>

                                <button
                                    className={`mup-action-button ${userData?.blacklisted ? 'mup-unblacklist-button' : 'mup-blacklist-button'}`}
                                    onClick={handleToggleBlacklist}
                                >
                                    {userData?.blacklisted ? 'Unblacklist' : 'Blacklist'}
                                </button>

                                <button
                                    className="mup-action-button mup-delete-button"
                                    onClick={handleDeleteUser}
                                >
                                    Delete
                                </button>
                                <button
                                    className={`mup-action-button mup-admin-comment-button ${userNotes.length > 0 ? 'mup-has-notes' : ''}`}
                                    onClick={() => setShowNotesPopup(true)}
                                >
                                    Admin Notes {userNotes.length > 0 ? `(${userNotes.length})` : ''}
                                </button>
                            </div>
                        </div>

                        <div className="mup-profile-main">
                            <div className="mup-profile-grid">
                                {/* User Info Card */}
                                <div className="mup-user-card">
                                    <h3 className="mup-section-header">User Information</h3>
                                    <div className="mup-user-details">
                                        <div className="mup-detail-row">
                                            <span className="mup-detail-label">Email:</span>
                                            <span className="mup-detail-value">{userData.email}</span>
                                        </div>
                                        <div className="mup-detail-row">
                                            <span className="mup-detail-label">Phone:</span>
                                            <span className="mup-detail-value">{userData.phone || 'Not provided'}</span>
                                        </div>
                                        <div className="mup-detail-row">
                                            <span className="mup-detail-label">City:</span>
                                            <span className="mup-detail-value">{userData.city || 'Not provided'}</span>
                                        </div>
                                        <div className="mup-detail-row">
                                            <span className="mup-detail-label">County:</span>
                                            <span className="mup-detail-value">{userData.county || 'Not provided'}</span>
                                        </div>
                                        <div className="mup-detail-row">
                                            <span className="mup-detail-label">Joined:</span>
                                            <span className="mup-detail-value">
                                                {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                            </span>
                                        </div>
                                        {userData.lastSeen && (
                                            <div className="mup-detail-row">
                                                <span className="mup-detail-label">Last Seen:</span>
                                                <span className="mup-detail-value">
                                                    {new Date(userData.lastSeen.seconds * 1000).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Adverts Section - Redesigned without tables */}
                                <div className="mup-data-card">
                                    <h3 className="mup-section-header">
                                        <span>User Adverts</span>
                                        <span className="mup-count-badge mup-badge-blue">
                                            {adverts.length}
                                        </span>
                                    </h3>

                                    {adverts.length > 0 ? (
                                        <div className="mup-advert-cards-container">
                                            {adverts.map(ad => (
                                                <div key={ad.id} className="mup-advert-card">
                                                    <div className="mup-advert-card-content">
                                                        <h4 className="mup-advert-title">{ad.title || ad.breed || 'Unnamed Ad'}</h4>
                                                        <div className="mup-advert-meta">
                                                            <span className={`mup-status-badge ${
                                                                ad.paused
                                                                    ? 'mup-status-paused'
                                                                    : ad.approved
                                                                        ? 'mup-status-approved'
                                                                        : 'mup-status-pending'
                                                            }`}>
                                                                {ad.paused ? 'Paused' : ad.approved ? 'Live' : 'Pending'}
                                                            </span>
                                                            <span className="mup-advert-date">
                                                                Posted: {ad.createdAt ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mup-advert-card-actions">
                                                        <button
                                                            className="mup-card-button mup-view-button"
                                                            onClick={() => handleViewAdvert(ad.id)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="mup-card-button mup-pause-button-table"
                                                            onClick={() => togglePause(ad.id, ad.paused)}
                                                        >
                                                            {ad.paused ? "Unpause" : "Pause"}
                                                        </button>
                                                        <button
                                                            className="mup-card-button mup-remove-button"
                                                            onClick={() => handleRemoveAdvert(ad.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mup-empty-state">No adverts found for this user.</p>
                                    )}
                                </div>

                                {/* Reviews Section */}
                                <div className="mup-data-card">
                                    <h3 className="mup-section-header">
                                        <span>User Reviews</span>
                                        <span className="mup-count-badge mup-badge-purple">
                                            {reviews.length}
                                        </span>
                                    </h3>

                                    {reviews.length > 0 ? (
                                        <>
                                            <div className="mup-reviews-grid">
                                                {reviews.map((review, index) => (
                                                    <div
                                                        key={review.id}
                                                        className="mup-review-item"
                                                        style={{ display: index >= 6 && !showAllReviews ? 'none' : 'block' }}
                                                        onClick={() => openReviewModal(review)}
                                                    >
                                                        <p className="mup-review-content">{review.text}</p>
                                                        <div className="mup-review-footer">
                                                            <div className="mup-star-rating">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        className={`mup-star ${i < (review.rating || 0) ? 'mup-star-filled' : 'mup-star-empty'}`}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 20 20"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <div className="mup-review-meta">
                                                                <span className="mup-reviewer-name">{review.reviewerName || 'Unknown User'}</span>
                                                                <span className="mup-review-date">{review.reviewDate || 'No date'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {reviews.length > 6 && (
                                                <div className="mup-show-more-container">
                                                    <button
                                                        className="mup-show-more-btn"
                                                        onClick={() => setShowAllReviews(!showAllReviews)}
                                                    >
                                                        {showAllReviews ? 'Show Less' : 'Show More'}
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            width="16"
                                                            height="16"
                                                            style={{ transform: showAllReviews ? 'rotate(180deg)' : 'rotate(0)' }}
                                                        >
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="mup-empty-state">No reviews found for this user.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mup-error-state">
                        <p className="mup-error-message">User not found or data could not be loaded.</p>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedReview && (
                <div className="mup-review-modal-overlay" onClick={closeReviewModal}>
                    <div className="mup-review-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="mup-review-modal-close" onClick={closeReviewModal}>
                            ×
                        </button>
                        <div className="mup-review-modal-header">
                            <h4 className="mup-review-modal-title">Review Details</h4>
                        </div>
                        <div className="mup-review-modal-body">
                            <p className="mup-review-modal-text">{selectedReview.text}</p>
                        </div>
                        <div className="mup-review-modal-footer">
                            <div className="mup-review-modal-meta">
                                <div className="mup-review-modal-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`mup-star ${i < (selectedReview.rating || 0) ? 'mup-star-filled' : 'mup-star-empty'}`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            width="20"
                                            height="20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="mup-reviewer-name">
                                    Review by {selectedReview.reviewerName} on {selectedReview.reviewDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && userData && (
                <EditContactModal
                    uid={userId}
                    currentData={userData}
                    onClose={() => setShowEditModal(false)}
                    onSave={async (updatedData) => {
                        const userRef = doc(db, "users", userId);
                        try {
                            await updateDoc(userRef, updatedData);
                            setUserData(prev => ({ ...prev, ...updatedData }));
                            setShowEditModal(false);
                            alert("User profile updated.");
                        } catch (err) {
                            console.error("Error saving user data:", err);
                            alert("Failed to save user info.");
                        }
                    }}
                />
            )}

            {showNotesPopup && (
                <div className="mup-admin-notes-popup">
                    <div className="mup-popup-backdrop" onClick={() => setShowNotesPopup(false)}></div>
                    <div className="mup-popup-content">
                        <button className="mup-popup-close-button" onClick={() => setShowNotesPopup(false)}>
                            <FaTimes />
                        </button>

                        <h3>Admin Notes</h3>

                        <ul className="mup-note-list">
                            {userNotes.length > 0 ? (
                                userNotes.map((note) => (
                                    <li key={note.id}>
                                        <p>{note.text}</p>
                                        <small>
                                            {note.adminName || 'Admin'} &middot;{' '}
                                            {note.createdAt?.seconds
                                                ? new Date(note.createdAt.seconds * 1000).toLocaleString()
                                                : 'Unknown date'}
                                        </small>
                                        <button
                                            className="mup-note-delete-button"
                                            onClick={async () => {
                                                await deleteDoc(doc(db, 'adminNotes', note.id));
                                                const snap = await getDocs(
                                                    query(collection(db, 'adminNotes'), where('userId', '==', userId))
                                                );
                                                setUserNotes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                                            }}
                                            title="Delete note"
                                        >
                                            <FaTimes />
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li>No notes yet for this user.</li>
                            )}
                        </ul>

                        <textarea
                            className="form-control"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a new note..."
                            rows={4}
                        />

                        <button
                            onClick={async () => {
                                const first = userData?.firstName || 'Admin';
                                const lastInitial = userData?.lastName?.charAt(0).toUpperCase() || '';
                                const fullAdminName = `${first} ${lastInitial}.`;

                                const newNote = {
                                    userId,
                                    text: noteText,
                                    createdAt: new Date(),
                                    adminName: fullAdminName,
                                };

                                await setDoc(doc(collection(db, 'adminNotes')), newNote);
                                setNoteText('');
                                const snap = await getDocs(
                                    query(collection(db, 'adminNotes'), where('userId', '==', userId))
                                );
                                setUserNotes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                            }}
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUserProfile;