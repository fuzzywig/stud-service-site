import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    getDoc,
    setDoc,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase'; // Added auth import
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
    FaSpinner,
    FaDog,
    FaCat,
    FaHeart,
    FaVenusMars,
    FaInfoCircle,
    FaEnvelope,
    FaPhone
} from 'react-icons/fa';
import './ApproveAdverts.css';

const sendAdvertApprovedEmail = async (userData, advertData) => {
    try {
        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-approved-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData, advertData }),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Advert approved email sent to ${userData.email}`);
        } else {
            console.error('❌ Failed to send advert approved email:', result.error);
        }
    } catch (err) {
        console.error('❌ Failed to send advert approved email:', err);
    }
};

const sendAdvertRejectedEmail = async (userData, advertData, rejectionReason) => {
    try {
        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-rejected-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData, advertData, rejectionReason }),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Advert rejected email sent to ${userData.email}`);
        } else {
            console.error('❌ Failed to send advert rejected email:', result.error);
        }
    } catch (err) {
        console.error('❌ Failed to send advert rejected email:', err);
    }
};

export default function ApproveAdverts() {
    const [adverts, setAdverts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectionTarget, setRejectionTarget] = useState(null);
    const [customReason, setCustomReason] = useState('');

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
                        let ownerEmail = '';
                        let location = '';

                        if (adData.ownerId) {
                            try {
                                const userSnap = await getDoc(doc(db, 'users', adData.ownerId));
                                if (userSnap.exists()) {
                                    const user = userSnap.data();
                                    ownerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                    ownerContact = user.phone || '';
                                    ownerEmail = user.email || '';
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
                            ownerEmail,
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
            (ad.breedOrType && ad.breedOrType.toLowerCase().includes(term)) ||
            (ad.ownerName && ad.ownerName.toLowerCase().includes(term)) ||
            (ad.ownerContact && ad.ownerContact.toLowerCase().includes(term)) ||
            (ad.postcode && ad.postcode.toLowerCase().includes(term)) ||
            (ad.location && ad.location.toLowerCase().includes(term)) ||
            (ad.rescueName && ad.rescueName.toLowerCase().includes(term))
        );
    });

    const RejectionModal = ({ isOpen, onClose, onSubmit, dogName }) => {
        const [selectedReason, setSelectedReason] = useState('');
        const [customMessage, setCustomMessage] = useState('');

        const reasons = [
            'Incomplete or missing information',
            'Inappropriate or misleading content',
            'Poor quality or unclear photos',
            'Violates site policies',
        ];

        const handleSend = () => {
            const finalMessage = customMessage || selectedReason;
            if (finalMessage) {
                onSubmit(finalMessage);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="approve-adverts-modal-backdrop">
                <div className="approve-adverts-modal">
                    <h2>Reject Advert for {dogName}</h2>
                    <p>Select a reason or type your own:</p>
                    <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                    >
                        <option value="">-- Choose a reason --</option>
                        {reasons.map((reason, index) => (
                            <option key={index} value={reason}>{reason}</option>
                        ))}
                    </select>
                    <textarea
                        placeholder="Optional custom message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={4}
                    />
                    <div className="approve-adverts-modal-actions">
                        <button onClick={handleSend} className="approve-adverts-btn-approve">Send Rejection</button>
                        <button onClick={onClose} className="approve-adverts-btn-reject">Cancel</button>
                    </div>
                </div>
            </div>
        );
    };

    // Approve advert - FIXED
    const approveAdvert = async (id) => {
        try {
            const adRef = doc(db, 'allListings', id);
            await updateDoc(adRef, { approved: true });

            const adSnap = await getDoc(adRef);
            const ad = adSnap.data();

            if (ad.ownerId) {
                const userSnap = await getDoc(doc(db, 'users', ad.ownerId));
                if (userSnap.exists()) {
                    const user = userSnap.data();

                    // Prepare user data
                    const userData = {
                        email: user.email,
                        firstName: user.firstName || '',
                        lastName: user.lastName || ''
                    };

                    // Prepare advert data
                    const advertData = {
                        id: id,
                        petName: ad.name || ad.title || 'your pet',
                        type: ad.petType || 'pet'
                    };

                    // Send using SendGrid template - FIXED to use approval email
                    await sendAdvertApprovedEmail(userData, advertData);
                }
            }

            setAdverts(adverts.filter(ad => ad.id !== id));
        } catch (error) {
            console.error('Error approving advert:', error);
        }
    };

    // Reject advert - FIXED to use SendGrid template
    const rejectAdvert = async (id, reasonText) => {
        try {
            const adRef = doc(db, 'allListings', id);
            const adSnap = await getDoc(adRef);
            const ad = adSnap.data();

            if (!adSnap.exists()) return;

            const rejectedAt = new Date();

            // Save rejection details to rejectedAdverts collection for record keeping
            try {
                await setDoc(doc(db, 'rejectedAdverts', id), {
                    ...ad,
                    rejectedAt: rejectedAt.toISOString(),
                    rejectionReason: reasonText,
                    reviewedBy: auth.currentUser?.uid || "admin",
                });
            } catch (permissionError) {
                console.error('Failed to save to rejectedAdverts:', permissionError);
            }

            // Update the advert to include rejection info
            try {
                await updateDoc(adRef, {
                    lastRejectedAt: rejectedAt.toISOString(),
                    lastRejectionReason: reasonText,
                    approved: false
                });
            } catch (updateError) {
                console.error('Failed to update advert with rejection info:', updateError);
            }

            // Send notification email to the owner using SendGrid template
            if (ad.ownerId) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', ad.ownerId));
                    if (userSnap.exists()) {
                        const user = userSnap.data();

                        // Prepare user data
                        const userData = {
                            email: user.email,
                            firstName: user.firstName || '',
                            lastName: user.lastName || ''
                        };

                        // Prepare advert data
                        const advertData = {
                            id: id,
                            petName: ad.name || ad.title || 'your pet',
                            type: ad.petType || 'pet'
                        };

                        // Send using SendGrid template
                        await sendAdvertRejectedEmail(userData, advertData, reasonText);
                    }
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                }
            }

            // Remove from the current view
            setAdverts(prev => prev.filter(ad => ad.id !== id));
            setModalOpen(false);
            setRejectionTarget(null);
            setCustomReason('');

        } catch (error) {
            console.error('Error rejecting advert:', error);
            alert('Failed to reject advert. Please try again.');
        }
    };

    // Helper function to determine pet type icon
    const getPetIcon = (advert) => {
        if (advert.petType === 'cat' || advert.catBreed) return <FaCat />;
        if (advert.isRescue) return <FaHeart />;
        return <FaDog />;
    };

    // Helper function to format advert type
    const getAdvertType = (advert) => {
        if (advert.isRescue) return 'Rescue';
        if (advert.petType === 'cat') return 'Cat Stud';
        return 'Dog Stud';
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
                    <div className="approve-adverts-loading-container">
                        <FaSpinner className="approve-adverts-loading-icon" />
                        <p>Loading adverts...</p>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && filteredAdverts.length === 0 && (
                    <div className="approve-adverts-empty-state">
                        <FaCheck className="approve-adverts-empty-icon" />
                        <h2>No Pending Adverts</h2>
                        <p>All adverts have been reviewed or no adverts match your search.</p>
                    </div>
                )}

                {/* Adverts Grid */}
                <div className="approve-adverts-grid">
                    {filteredAdverts.map(ad => (
                        <div key={ad.id} className="approve-adverts-card">
                            {/* Card Header */}
                            <div className="approve-adverts-card-header">
                                <div className="approve-adverts-type-badge">
                                    {getPetIcon(ad)}
                                    <span>{getAdvertType(ad)}</span>
                                </div>
                                {ad.createdAt && (
                                    <span className="approve-adverts-date">
                                        {new Date(ad.createdAt.toDate()).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Image Section */}
                            <div className="approve-adverts-image-container">
                                {ad.images && ad.images.length > 0 ? (
                                    <>
                                        <img
                                            src={ad.images[ad.mainImageIndex || 0]}
                                            alt={ad.name || ad.breedOrType || 'Pet'}
                                            className="approve-adverts-image"
                                        />
                                        {ad.images.length > 1 && (
                                            <div className="approve-adverts-image-count">
                                                <FaImages /> {ad.images.length}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="approve-adverts-no-image">
                                        <FaImages />
                                        <span>No image</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="approve-adverts-content">
                                <h3 className="approve-adverts-title">
                                    {ad.dogName || 'Unnamed'}
                                    {ad.breedOrType && ` - ${ad.breedOrType}`}
                                </h3>

                                {/* Key Details Grid */}
                                <div className="approve-adverts-details-grid">
                                    {ad.rescueName && (
                                        <div className="approve-adverts-detail-item">
                                            <FaHeart />
                                            <span>{ad.rescueName}</span>
                                        </div>
                                    )}

                                    <div className="approve-adverts-detail-item">
                                        <FaUser />
                                        <span>{ad.ownerName}</span>
                                    </div>

                                    <div className="approve-adverts-detail-item">
                                        <FaMapMarkerAlt />
                                        <span>{ad.location || ad.postcode || 'No location'}</span>
                                    </div>

                                    {ad.price && (
                                        <div className="approve-adverts-detail-item">
                                            <FaPoundSign />
                                            <span>£{ad.price}</span>
                                        </div>
                                    )}

                                    {ad.dob && (
                                        <div className="approve-adverts-detail-item">
                                            <FaCalendarAlt />
                                            <span>{new Date(ad.dob).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {ad.gender && (
                                        <div className="approve-adverts-detail-item">
                                            <FaVenusMars />
                                            <span>{ad.gender}</span>
                                        </div>
                                    )}

                                    {(ad.colour || ad.dogColor || ad.catColor) && (
                                        <div className="approve-adverts-detail-item">
                                            <FaPalette />
                                            <span>{ad.colour || ad.dogColor || ad.catColor}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {ad.description && (
                                    <div className="approve-adverts-description">
                                        <p>{ad.description.length > 150
                                            ? `${ad.description.substring(0, 150)}...`
                                            : ad.description}
                                        </p>
                                    </div>
                                )}

                                {/* Owner Contact Info */}
                                <div className="approve-adverts-contact-info">
                                    {ad.ownerEmail && (
                                        <div className="approve-adverts-contact-item">
                                            <FaEnvelope />
                                            <span>{ad.ownerEmail}</span>
                                        </div>
                                    )}
                                    {ad.ownerContact && (
                                        <div className="approve-adverts-contact-item">
                                            <FaPhone />
                                            <span>{ad.ownerContact}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="approve-adverts-actions">
                                <button
                                    className="approve-adverts-btn approve-adverts-btn-approve"
                                    onClick={() => approveAdvert(ad.id)}
                                >
                                    <FaCheck /> Approve
                                </button>
                                <button
                                    className="approve-adverts-btn approve-adverts-btn-reject"
                                    onClick={() => {
                                        setRejectionTarget(ad);
                                        setModalOpen(true);
                                    }}
                                >
                                    <FaTimes /> Reject
                                </button>
                                <button
                                    className="approve-adverts-btn approve-adverts-btn-view"
                                    onClick={() => navigate(`/admin/view-advert/${ad.id}`)}
                                >
                                    <FaEye /> View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Rejection Modal */}
            {modalOpen && rejectionTarget && (
                <RejectionModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setRejectionTarget(null);
                        setCustomReason('');
                    }}
                    onSubmit={(reason) => rejectAdvert(rejectionTarget.id, reason)}
                    dogName={rejectionTarget.name || 'this pet'}
                />
            )}
        </div>
    );
}