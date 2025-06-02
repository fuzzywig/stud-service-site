import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    getDoc,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminSidebar from '../../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

import {
    FaUser,
    FaMapMarkerAlt,
    FaPoundSign,
    FaCalendarAlt,
    FaPalette,
    FaCheck,
    FaTimes,
    FaEye,
    FaImages,
    FaSpinner
} from 'react-icons/fa';

import './ApproveAdverts.css';

export default function ApproveAdverts() {
    const [adverts, setAdverts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Fetch unapproved adverts and owner info
    useEffect(() => {
        async function fetchAdverts() {
            setIsLoading(true);

            try {
                const q = query(collection(db, 'allListings'), where('approved', '==', false));
                const snapshot = await getDocs(q);

                const advertsWithOwners = await Promise.all(
                    snapshot.docs.map(async (adDoc) => {
                        const adData = { id: adDoc.id, ...adDoc.data() };

                        let ownerName = 'Unknown';
                        let ownerContact = '';
                        let location = '';

                        if (adData.ownerId) {
                            try {
                                const userSnap = await getDoc(doc(db, 'users', adData.ownerId));
                                if (userSnap.exists()) {
                                    const user = userSnap.data();
                                    ownerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                    ownerContact = user.phone || '';
                                    location = `${user.city || ''}${user.city && user.county ? ', ' : ''}${user.county || ''}`.trim();
                                }
                            } catch {
                                // Silent fail on owner fetch error
                            }
                        }

                        return {
                            ...adData,
                            ownerName,
                            ownerContact,
                            location
                        };
                    })
                );

                setAdverts(advertsWithOwners);
            } catch (error) {
                console.error('Error fetching adverts:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAdverts();
    }, []);

    // Search filter
    const filteredAdverts = adverts.filter(ad => {
        const term = searchTerm.toLowerCase();
        return (
            (ad.name && ad.name.toLowerCase().includes(term)) ||
            (ad.breed && ad.breed.toLowerCase().includes(term)) ||
            (ad.ownerName && ad.ownerName.toLowerCase().includes(term)) ||
            (ad.ownerContact && ad.ownerContact.toLowerCase().includes(term)) ||
            (ad.postcode && ad.postcode.toLowerCase().includes(term)) ||
            (ad.location && ad.location.toLowerCase().includes(term))
        );
    });

    // Approve advert
    const approveAdvert = async (id) => {
        try {
            const adRef = doc(db, 'allListings', id);
            await updateDoc(adRef, { approved: true });
            setAdverts(adverts.filter(ad => ad.id !== id));
        } catch (error) {
            console.error('Error approving advert:', error);
        }
    };

    // Reject advert (delete)
    const rejectAdvert = async (id) => {
        try {
            const adRef = doc(db, 'allListings', id);
            await deleteDoc(adRef);
            setAdverts(adverts.filter(ad => ad.id !== id));
        } catch (error) {
            console.error('Error rejecting advert:', error);
        }
    };

    return (
        <div className="admin-approve-adverts-page">
            <AdminSidebar />
            <main className="content-area">
                <h1 className="page-title">Approve Adverts</h1>

                {/* Search */}
                <div className="search-section">
                    <div className="search-container">
                        <FaUser className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by name, breed, owner, location..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="search-results-count">
                        {isLoading ? <FaSpinner className="loading-spinner" /> : `${filteredAdverts.length} adverts pending approval`}
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="loading-container">
                        <FaSpinner className="loading-icon" />
                        Loading adverts...
                    </div>
                )}

                {/* Empty */}
                {!isLoading && filteredAdverts.length === 0 && (
                    <div className="empty-state">
                        <FaCheck className="empty-state-icon" />
                        <h2>No Matching Results</h2>
                        <p>No adverts awaiting approval match your search.</p>
                    </div>
                )}

                {/* Adverts List */}
                <div className="adverts-list">
                    {filteredAdverts.map(ad => (
                        <div key={ad.id} className="advert-card">
                            <div className="advert-image-section">
                                {ad.images && ad.images.length > 0 ? (
                                    <img
                                        src={ad.images[ad.mainImageIndex || 0]}
                                        alt={ad.name || ad.breed || 'Advert Image'}
                                        className="advert-image"
                                    />
                                ) : (
                                    <div className="advert-image-placeholder">
                                        <FaImages />
                                    </div>
                                )}
                                {ad.images && ad.images.length > 1 && (
                                    <div className="image-count-badge">{ad.images.length}</div>
                                )}
                            </div>

                            <div className="advert-details-section">
                                <h3 className="advert-title">
                                    {ad.breedOrType || 'Unknown breed'}
                                    {ad.name ? ` - ${ad.name}` : ''}
                                </h3>

                                <div className="advert-details-inline">
                                    <div className="detail-item">
                                        <FaUser className="meta-icon" />
                                        <span>{ad.ownerName || 'Unknown owner'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FaMapMarkerAlt className="meta-icon" />
                                        <span>{ad.location || 'Unknown location'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FaPoundSign className="meta-icon" />
                                        <span>£{ad.price || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FaCalendarAlt className="meta-icon" />
                                        <span>{ad.dob ? new Date(ad.dob).toLocaleDateString() : 'DOB not specified'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FaPalette className="meta-icon" />
                                        <span>{ad.colour || ad.dogColor || ad.catColor || 'Colour not specified'}</span>
                                    </div>
                                </div>


                                {/* Description Section */}
                                <div className="advert-description-block">
                                    <h4 className="description-heading">Description</h4>
                                    {ad.description && (
                                        <p className="advert-description">
                                            {ad.description.length > 120
                                                ? `${ad.description.substring(0, 120)}...`
                                                : ad.description}
                                        </p>
                                    )}
                                </div>

                            </div>


                            <div className="advert-actions">
                                <button
                                    className="btn-approve"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        approveAdvert(ad.id);
                                    }}
                                >
                                    <FaCheck /> Approve
                                </button>
                                <button
                                    className="btn-reject"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        rejectAdvert(ad.id);
                                    }}
                                >
                                    <FaTimes /> Reject
                                </button>
                                <button
                                    className="btn-view"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/admin/view-advert/${ad.id}`);
                                    }}
                                >
                                    <FaEye /> View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
