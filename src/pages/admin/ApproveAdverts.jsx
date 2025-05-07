// src/pages/admin/ApproveAdverts.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminSidebar from '../../components/AdminSidebar';
import { FaCheck, FaTimes, FaEye, FaUser, FaMapMarkerAlt, FaPoundSign, FaCalendarAlt, FaPalette } from 'react-icons/fa';
import './ApproveAdverts.css';

export default function ApproveAdverts() {
    const [adverts, setAdverts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAdvert, setSelectedAdvert] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchUnapprovedAdverts = async () => {
            try {
                setIsLoading(true);
                const q = query(collection(db, "studAds"), where("approved", "==", false));
                const querySnapshot = await getDocs(q);
                const fetched = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAdverts(fetched);
            } catch (error) {
                console.error("Error fetching adverts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnapprovedAdverts();
    }, []);

    const approveAdvert = async (id) => {
        try {
            const advertRef = doc(db, "studAds", id);
            await updateDoc(advertRef, { approved: true });
            setAdverts(prev => prev.filter(advert => advert.id !== id));

            if (selectedAdvert && selectedAdvert.id === id) {
                setSelectedAdvert(null);
            }
        } catch (error) {
            console.error("Failed to approve advert:", error);
        }
    };

    const rejectAdvert = async (id) => {
        if (window.confirm("Are you sure you want to reject and delete this advert?")) {
            try {
                const advertRef = doc(db, "studAds", id);
                await deleteDoc(advertRef);
                setAdverts(prev => prev.filter(advert => advert.id !== id));

                if (selectedAdvert && selectedAdvert.id === id) {
                    setSelectedAdvert(null);
                }
            } catch (error) {
                console.error("Failed to reject advert:", error);
            }
        }
    };

    const viewAdvert = (advert) => {
        setSelectedAdvert(advert);
        if (advert.images && advert.images.length > 0) {
            setPreviewImage(advert.images[0]);
        }
    };

    const closePreview = () => {
        setSelectedAdvert(null);
    };

    const changePreviewImage = (imageUrl) => {
        setPreviewImage(imageUrl);
    };

    return (
        <div className="admin-approve-adverts-page">
            <AdminSidebar />

            <div className="content-area">
                <h1 className="page-title">Approve Adverts</h1>

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
                ) : adverts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-content">
                            <FaCheck className="empty-state-icon" />
                            <h2>All Caught Up!</h2>
                            <p>There are no adverts awaiting approval at this time.</p>
                        </div>
                    </div>
                ) : (
                    <div className="adverts-grid">
                        {adverts.map(ad => (
                            <div key={ad.id} className="advert-card">
                                <div className="advert-image-container">
                                    {ad.images && ad.images.length > 0 ? (
                                        <img
                                            src={ad.images[0]}
                                            alt={ad.name || ad.breed || 'Stud dog'}
                                            className="advert-image"
                                        />
                                    ) : (
                                        <div className="advert-image-placeholder">
                                            No Image
                                        </div>
                                    )}
                                    <div className="advert-image-count">
                                        {ad.images ? ad.images.length : 0} photos
                                    </div>
                                </div>

                                <div className="advert-content">
                                    <h3 className="advert-title">
                                        {ad.name || 'Unnamed'}
                                        <span className="advert-breed">({ad.breed || 'Unknown breed'})</span>
                                    </h3>

                                    <div className="advert-details">
                                        <div className="advert-detail">
                                            <FaPalette className="detail-icon" />
                                            <span>{ad.colour || 'Unknown color'}</span>
                                        </div>

                                        <div className="advert-detail">
                                            <FaCalendarAlt className="detail-icon" />
                                            <span>{ad.age || 'Age not specified'}</span>
                                        </div>

                                        <div className="advert-detail">
                                            <FaPoundSign className="detail-icon" />
                                            <span>£{ad.fee || 'Fee not specified'}</span>
                                        </div>

                                        <div className="advert-detail">
                                            <FaMapMarkerAlt className="detail-icon" />
                                            <span>{ad.location || 'Location not specified'}</span>
                                        </div>

                                        <div className="advert-detail">
                                            <FaUser className="detail-icon" />
                                            <span>{ad.ownerName || 'Unknown owner'}</span>
                                        </div>
                                    </div>

                                    <div className="advert-description">
                                        {ad.description ? (
                                            ad.description.length > 100 ?
                                                `${ad.description.substring(0, 100)}...` :
                                                ad.description
                                        ) : (
                                            'No description provided.'
                                        )}
                                    </div>
                                </div>

                                <div className="advert-actions">
                                    <button
                                        className="action-button view"
                                        onClick={() => viewAdvert(ad)}
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        className="action-button approve"
                                        onClick={() => approveAdvert(ad.id)}
                                    >
                                        <FaCheck /> Approve
                                    </button>
                                    <button
                                        className="action-button reject"
                                        onClick={() => rejectAdvert(ad.id)}
                                    >
                                        <FaTimes /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Advert Preview Modal */}
                {selectedAdvert && (
                    <div className="advert-preview-modal">
                        <div className="modal-backdrop" onClick={closePreview}></div>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {selectedAdvert.name || 'Unnamed'}
                                    <span className="modal-subtitle">({selectedAdvert.breed || 'Unknown breed'})</span>
                                </h3>
                                <button className="modal-close" onClick={closePreview}>✕</button>
                            </div>

                            <div className="modal-body">
                                <div className="modal-image-container">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt={selectedAdvert.name || 'Stud dog'}
                                            className="modal-image"
                                        />
                                    ) : (
                                        <div className="modal-image-placeholder">
                                            No Image Available
                                        </div>
                                    )}

                                    {selectedAdvert.images && selectedAdvert.images.length > 1 && (
                                        <div className="image-thumbnails">
                                            {selectedAdvert.images.map((img, index) => (
                                                <div
                                                    key={index}
                                                    className={`image-thumbnail ${img === previewImage ? 'active' : ''}`}
                                                    onClick={() => changePreviewImage(img)}
                                                >
                                                    <img src={img} alt={`${selectedAdvert.name || 'Stud dog'} ${index + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-details">
                                    <div className="details-section">
                                        <h4 className="section-title">Details</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Breed:</span>
                                                <span className="detail-value">{selectedAdvert.breed || 'Not specified'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Color:</span>
                                                <span className="detail-value">{selectedAdvert.colour || 'Not specified'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Age:</span>
                                                <span className="detail-value">{selectedAdvert.age || 'Not specified'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Fee:</span>
                                                <span className="detail-value">£{selectedAdvert.fee || 'Not specified'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Location:</span>
                                                <span className="detail-value">{selectedAdvert.location || 'Not specified'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Owner:</span>
                                                <span className="detail-value">{selectedAdvert.ownerName || 'Unknown'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Contact:</span>
                                                <span className="detail-value">{selectedAdvert.ownerContact || 'Not provided'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Created:</span>
                                                <span className="detail-value">
                                                    {selectedAdvert.createdAt ?
                                                        new Date(selectedAdvert.createdAt.seconds * 1000).toLocaleDateString() :
                                                        'Unknown date'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4 className="section-title">Description</h4>
                                        <p className="full-description">
                                            {selectedAdvert.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="modal-action-button approve"
                                    onClick={() => approveAdvert(selectedAdvert.id)}
                                >
                                    <FaCheck /> Approve Advert
                                </button>
                                <button
                                    className="modal-action-button reject"
                                    onClick={() => rejectAdvert(selectedAdvert.id)}
                                >
                                    <FaTimes /> Reject Advert
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}