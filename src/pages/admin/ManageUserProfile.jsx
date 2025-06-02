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
        <div className="admin-user-profile-page">
            <AdminSidebar />

            <div className="content-area">
                <h1 className="page-title">Manage User Profile</h1>

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
                ) : userData ? (
                    <div className="profile-container">
                        <div className="profile-header">
                            <div className="user-summary">
                                <div className="avatar-container">
                                    {userData.avatar ? (
                                        <img src={userData.avatar} alt="Avatar" className="admin-user-avatar" />
                                    ) : (
                                        <FaUserCircle className="admin-user-avatar default-avatar-icon" />
                                    )}

                                    <span className={`status-indicator ${userData.blacklisted ? 'status-blacklisted' : 'status-active'}`}></span>
                                </div>
                                <div className="user-header-details">
                                    <h2 className="user-name">{userData.firstName} {userData.lastName}</h2>
                                    <p className="user-id">UID: {userId}</p>
                                    <span className={`user-status-badge ${
                                        userData.blacklisted
                                            ? 'status-badge-blacklisted'
                                            : 'status-badge-active'
                                    }`}>
                                        {userData.blacklisted ? 'Blacklisted' : 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div className="action-buttons">
                                <button
                                    className="action-button edit-button"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    Edit
                                </button>

                                <button
                                    className={`action-button ${userData?.blacklisted ? 'unblacklist-button' : 'blacklist-button'}`}
                                    onClick={handleToggleBlacklist}
                                >
                                    {userData?.blacklisted ? 'Unblacklist' : 'Blacklist'}
                                </button>


                                <button
                                    className="action-button delete-button"
                                    onClick={handleDeleteUser}
                                >
                                    Delete
                                </button>
                                <button
                                    className={`action-button admin-comment-button ${userNotes.length > 0 ? 'has-notes' : ''}`}
                                    onClick={() => setShowNotesPopup(true)}
                                >
                                    Admin Notes {userNotes.length > 0 ? `(${userNotes.length})` : ''}
                                </button>

                            </div>
                        </div>

                        <div className="profile-main">
                            <div className="profile-grid">
                                {/* User Info Card */}
                                <div className="user-card">
                                    <h3 className="section-header">User Information</h3>
                                    <div className="user-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{userData.email}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Phone:</span>
                                            <span className="detail-value">{userData.phone || 'Not provided'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">City:</span>
                                            <span className="detail-value">{userData.city || 'Not provided'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">County:</span>
                                            <span className="detail-value">{userData.county || 'Not provided'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Joined:</span>
                                            <span className="detail-value">
                                                {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                            </span>
                                        </div>
                                        {userData.lastSeen && (
                                            <div className="detail-row">
                                                <span className="detail-label">Last Seen:</span>
                                                <span className="detail-value">
            {new Date(userData.lastSeen.seconds * 1000).toLocaleString()}
        </span>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* Adverts Section - Redesigned without tables */}
                                <div className="data-card">
                                    <h3 className="section-header">
                                        <span>User Adverts</span>
                                        <span className="count-badge badge-blue">
                                            {adverts.length}
                                        </span>
                                    </h3>

                                    {adverts.length > 0 ? (
                                        <div className="advert-cards-container">
                                            {adverts.map(ad => (
                                                <div key={ad.id} className="advert-card">
                                                    <div className="advert-card-content">
                                                        <h4 className="advert-title">{ad.title || ad.breed || 'Unnamed Ad'}</h4>
                                                        <div className="advert-meta">
                                                            <span className={`status-badge ${
                                                                ad.paused
                                                                    ? 'status-paused'
                                                                    : ad.approved
                                                                        ? 'status-approved'
                                                                        : 'status-pending'
                                                            }`}>
                                                                {ad.paused ? 'Paused' : ad.approved ? 'Live' : 'Pending'}
                                                            </span>
                                                            <span className="advert-date">
                                                                Posted: {ad.createdAt ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="advert-card-actions">
                                                        <button
                                                            className="card-button view-button"
                                                            onClick={() => handleViewAdvert(ad.id)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="card-button pause-button-table"
                                                            onClick={() => togglePause(ad.id, ad.paused)}
                                                        >
                                                            {ad.paused ? "Unpause" : "Pause"}
                                                        </button>
                                                        <button
                                                            className="card-button remove-button"
                                                            onClick={() => handleRemoveAdvert(ad.id)}
                                                        >
                                                            Remove
                                                        </button>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="empty-state">No adverts found for this user.</p>
                                    )}
                                </div>

                                {/* Reviews Section */}
                                <div className="data-card">
                                    <h3 className="section-header">
                                        <span>User Reviews</span>
                                        <span className="count-badge badge-purple">
                                            {reviews.length}
                                        </span>
                                    </h3>

                                    {reviews.length > 0 ? (
                                        <>
                                            <div className="user-profile-reviews-grid">
                                                {reviews.map((review, index) => (
                                                    <div
                                                        key={review.id}
                                                        className="user-profile-review-item"
                                                        style={{ display: index >= 6 && !showAllReviews ? 'none' : 'block' }}
                                                        onClick={() => openReviewModal(review)}
                                                    >
                                                        <p className="user-profile-review-content">{review.text}</p>
                                                        <div className="user-profile-review-footer">
                                                            <div className="user-profile-star-rating">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        className={`user-profile-star ${i < (review.rating || 0) ? 'user-profile-star-filled' : 'user-profile-star-empty'}`}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 20 20"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <div className="user-profile-review-meta">
                                                                <span className="user-profile-reviewer-name">{review.reviewerName || 'Unknown User'}</span>
                                                                <span className="user-profile-review-date">{review.reviewDate || 'No date'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {reviews.length > 6 && (
                                                <div className="user-profile-show-more-container">
                                                    <button
                                                        className="user-profile-show-more-btn"
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
                                        <p className="empty-state">No reviews found for this user.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="error-state">
                        <p className="error-message">User not found or data could not be loaded.</p>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedReview && (
                <div className="review-modal-overlay" onClick={closeReviewModal}>
                    <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="review-modal-close" onClick={closeReviewModal}>
                            ×
                        </button>
                        <div className="review-modal-header">
                            <h4 className="review-modal-title">Review Details</h4>
                        </div>
                        <div className="review-modal-body">
                            <p className="review-modal-text">{selectedReview.text}</p>
                        </div>
                        <div className="review-modal-footer">
                            <div className="review-modal-meta">
                                <div className="review-modal-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`user-profile-star ${i < (selectedReview.rating || 0) ? 'user-profile-star-filled' : 'user-profile-star-empty'}`}
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
                                <span className="user-profile-reviewer-name">
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
                <div className="admin-notes-popup">
                    <div className="popup-backdrop" onClick={() => setShowNotesPopup(false)}></div>
                    <div className="popup-content">
                        <button className="popup-close-button" onClick={() => setShowNotesPopup(false)}>
                            <FaTimes />
                        </button>

                        <h3>Admin Notes</h3>

                        <ul className="note-list">
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
                                            className="note-delete-button"
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