// src/pages/admin/ManageUserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AdminSidebar from '../../components/AdminSidebar';
import './ManageUserProfile.css';

const ManageUserProfile = () => {
    const { userId } = useParams();
    const [userData, setUserData] = useState(null);
    const [adverts, setAdverts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }

                const advertsQuery = query(collection(db, 'studAds'), where('ownerId', '==', userId));
                const advertsSnap = await getDocs(advertsQuery);
                setAdverts(advertsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const reviewsQuery = query(collection(db, 'reviews'), where('userId', '==', userId));
                const reviewsSnap = await getDocs(reviewsQuery);
                setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    return (
        <div className="admin-user-profile-page">
            {/* AdminSidebar is already a component with its own state management */}
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
                                    <img
                                        src={userData.avatar || '/default-avatar.png'}
                                        alt="User avatar"
                                        className="user-avatar"
                                    />
                                    <span className={`status-indicator ${userData.blacklisted ? 'status-blacklisted' : 'status-active'}`}></span>
                                </div>
                                <div className="user-header-details">
                                    <h2 className="user-name">{userData.firstName} {userData.lastName}</h2>
                                    <p className="user-id">ID: {userId.substring(0, 8)}...</p>
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
                                <button className="action-button edit-button">
                                    Edit
                                </button>
                                <button className="action-button pause-button">
                                    Pause
                                </button>
                                <button className="action-button delete-button">
                                    Delete
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
                                        <div className="detail-row">
                                            <span className="detail-label">Last Login:</span>
                                            <span className="detail-value">
                                                {userData.lastLogin ? new Date(userData.lastLogin.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Adverts Section */}
                                <div className="data-card">
                                    <h3 className="section-header">
                                        <span>User Adverts</span>
                                        <span className="count-badge badge-blue">
                                            {adverts.length}
                                        </span>
                                    </h3>

                                    {adverts.length > 0 ? (
                                        <div className="table-container">
                                            <table className="data-table">
                                                <thead className="table-header">
                                                <tr>
                                                    <th className="table-header-cell">Ad Title</th>
                                                    <th className="table-header-cell">Status</th>
                                                    <th className="table-header-cell">Date Posted</th>
                                                    <th className="table-header-cell">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody className="table-body">
                                                {adverts.map(ad => (
                                                    <tr key={ad.id} className="table-row">
                                                        <td className="table-cell">
                                                            {ad.name || ad.breed || 'Unnamed Ad'}
                                                        </td>
                                                        <td className="table-cell">
                                                                <span className={`status-badge ${
                                                                    ad.approved
                                                                        ? 'status-approved'
                                                                        : 'status-pending'
                                                                }`}>
                                                                    {ad.approved ? 'Approved' : 'Pending'}
                                                                </span>
                                                        </td>
                                                        <td className="table-cell">
                                                            {ad.createdAt ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                        </td>
                                                        <td className="table-cell">
                                                            <button className="action-link view-link">
                                                                View
                                                            </button>
                                                            <button className="action-link remove-link">
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
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
                                        <div className="reviews-list">
                                            {reviews.map(review => (
                                                <div key={review.id} className="review-card">
                                                    <p className="review-text">{review.text}</p>
                                                    <div className="review-footer">
                                                        <div className="star-rating">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg
                                                                    key={i}
                                                                    className={`star ${i < (review.rating || 0) ? 'star-filled' : 'star-empty'}`}
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <div className="review-date">
                                                            {review.date ? new Date(review.date.seconds * 1000).toLocaleDateString() : 'No date'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
        </div>
    );
};

export default ManageUserProfile;