import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { updatedFieldConfigurations } from "../data/breedOptions";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import {
    FaCheck,
    FaArrowLeft,
    FaImages,
    FaPaw,
    FaTimes,
    FaRegCalendarAlt,
    FaPalette,
    FaPoundSign,
    FaMapMarkerAlt,
    FaUserAlt,
    FaClipboardCheck,
    FaEnvelope,
    FaPhone,
    FaIdCard,
    FaPause,
    FaHome,
    FaReply,
    FaRuler,
    FaWeight,
    FaHistory,
    FaCheckCircle,
    FaTimesCircle,
    FaFacebook,
    FaInstagram,
    FaVial,
    FaShieldAlt,
    FaInfoCircle,
    FaTags,
    FaSave,
    FaExclamationTriangle,
    FaComment,
    FaEdit,
    FaClipboard,
    FaEnvelopeOpen,
    FaList,
    FaShare,
    FaHeart,
    FaTrash,
    FaDog,
    FaCat,
    FaChild,
    FaBatteryHalf,
    FaNotesMedical,
    FaHandHoldingHeart,
    FaDna,
    FaSyringe,
    FaCalendarCheck,
    FaTiktok,
    FaEye
} from "react-icons/fa";
import "./AdminViewAdvert.css";
import AdminNotesModal from "../../components/admin/AdminNotesModal";
import { useAuth } from "../../firebase/firebaseAuth";

// Email functions for approval and rejection
const sendAdvertApprovedEmail = async (userData, advertData) => {
    try {
        const response = await fetch('http://localhost:6500/api/send-advert-approved-email', {
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
        const response = await fetch('http://localhost:6500/api/send-advert-rejected-email', {
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

export default function AdminViewAdvert() {
    const { advertId } = useParams();
    const navigate = useNavigate();
    const [advert, setAdvert] = useState(null);
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [ownerAds, setOwnerAds] = useState([]);
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [replyTexts, setReplyTexts] = useState({});
    const [showFullImage, setShowFullImage] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [noteCount, setNoteCount] = useState(0);
    const [activeSection, setActiveSection] = useState("overview");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    // New states for edit mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedAdvert, setEditedAdvert] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [hasBannedTerms, setHasBannedTerms] = useState(false);

    // New states for search functionality
    const [searchId, setSearchId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    const { userData } = useAuth();

    // Define banned terms at the top
    const bannedTerms = [
        "xl bully", "pit bull", "dogo argentino", "fila brasileiro", "japanese tosa",
        "f1 savannah", "serval", "caracal", "raccoon dog", "prohibited species",
        "invasive species", "cropped", "docked", "pregnant", "live", "food",
        "wild caught", "exotic pet", "no papers", "dangerous dog", "fighting dog",
    ];

    // Standard templates for quick replies/rejections
    const rejectTemplates = [
        "Images do not meet our quality standards. Please provide clearer photos.",
        "Missing required health information. Please complete health details.",
        "Pricing is not within our guidelines. Please adjust.",
        "Description contains prohibited content or claims.",
        "Duplicate listing detected."
    ];

    // Get advert type label
    const getAdvertTypeLabel = (intent) => {
        switch(intent) {
            case 'sale': return 'For Sale';
            case 'stud': return 'Stud Service';
            case 'rescue': return 'Adoption/Rescue';
            default: return 'Unknown';
        }
    };

    // Get advert type color
    const getAdvertTypeColor = (intent) => {
        switch(intent) {
            case 'sale': return '#10b981';
            case 'stud': return '#3b82f6';
            case 'rescue': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const resolveColourLabel = (advert = {}) => {
        const colourValue = advert.dogColor || advert.catColor || advert.colour;
        if (!colourValue) return "Not specified";

        const breedType = advert.breedOrType?.toLowerCase() || "";
        const isCat = breedType.includes("cat");
        const isDog = breedType.includes("dog");

        const colourOptions = isCat
            ? updatedFieldConfigurations.catColor?.options
            : isDog
                ? updatedFieldConfigurations.dogColor?.options
                : [];

        const match = colourOptions?.find(opt => opt.value.toLowerCase() === colourValue.toLowerCase());
        return match?.label || colourValue;
    };

    // Helper function to highlight banned terms in text
    const highlightBannedTerms = (text) => {
        if (!text) return text;

        let highlightedText = text;

        // Sort terms by length (longest first) to prevent partial replacements
        const sortedTerms = [...bannedTerms].sort((a, b) => b.length - a.length);

        sortedTerms.forEach(term => {
            // Escape special regex characters in the term
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Create regex with word boundaries where appropriate
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="advert-view-banned-term">$1</span>');
        });

        return highlightedText;
    };

    // Search handler
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchId.trim()) {
            setSearchError("Please enter an advert ID");
            return;
        }

        setIsSearching(true);
        setSearchError("");

        try {
            const searchedAdvertRef = doc(db, "allListings", searchId.trim());
            const searchedAdvertSnap = await getDoc(searchedAdvertRef);

            if (searchedAdvertSnap.exists()) {
                // Navigate to the new advert URL
                navigate(`/admin/view-advert/${searchId.trim()}`);
                setSearchId("");
            } else {
                setSearchError("No advert found with this ID");
            }
        } catch (error) {
            console.error("Error searching advert:", error);
            setSearchError("Error searching for advert. Please check the ID and try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const fetchAdvertData = async (id) => {
        try {
            setIsLoading(true);
            const adRef = doc(db, "allListings", id);
            const adSnap = await getDoc(adRef);
            if (adSnap.exists()) {
                const advertData = { id: adSnap.id, ...adSnap.data() };
                setAdvert(advertData);
                setEditedAdvert(advertData); // Initialize edited version
                setActiveImageIndex(advertData.mainImageIndex || 0);

                // Check for banned terms
                if (advertData.description) {
                    const lowerDesc = advertData.description.toLowerCase();
                    const foundTerms = bannedTerms.some(term => lowerDesc.includes(term.toLowerCase()));
                    setHasBannedTerms(foundTerms);
                }

                if (advertData.ownerId) {
                    const ownerRef = doc(db, "users", advertData.ownerId);
                    const ownerSnap = await getDoc(ownerRef);
                    if (ownerSnap.exists()) {
                        setOwnerInfo({ uid: ownerSnap.id, ...ownerSnap.data() });
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching advert or owner info:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAdvert = async () => {
        if (deleteConfirmText !== "DELETE PERMANENTLY") {
            alert("Please type 'DELETE PERMANENTLY' to confirm deletion");
            return;
        }

        if (!window.confirm("⚠️ FINAL WARNING: This will permanently delete the advert and cannot be undone. Are you absolutely sure?")) {
            return;
        }

        try {
            setIsDeleting(true);

            // Delete from main collection
            await deleteDoc(doc(db, "allListings", advertId));

            // Try to delete from other collections if they exist
            try {
                await deleteDoc(doc(db, "rejectedAdverts", advertId));
            } catch (e) {
                // Ignore if doesn't exist in rejected adverts
            }

            // Delete associated admin messages
            try {
                const messagesQuery = query(
                    collection(db, "adminMessages"),
                    where("advertId", "==", advertId)
                );
                const messagesSnap = await getDocs(messagesQuery);
                const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            } catch (e) {
                console.warn("Could not delete admin messages:", e);
            }

            // Delete associated updates
            try {
                const updatesQuery = query(
                    collection(db, "updates"),
                    where("advertId", "==", advertId)
                );
                const updatesSnap = await getDocs(updatesQuery);
                const deletePromises = updatesSnap.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            } catch (e) {
                console.warn("Could not delete updates:", e);
            }

            alert("✅ Advert has been permanently deleted");
            navigate("/admin");

        } catch (error) {
            console.error("Error deleting advert:", error);
            alert("❌ Failed to delete advert: " + error.message);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmText("");
        }
    };

    useEffect(() => {
        if (advertId) {
            fetchAdvertData(advertId);
        }
    }, [advertId]);

    const hasHealthTests = Array.isArray(advert?.healthTests) && advert.healthTests.length > 0;

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const updatesQuery = query(
                    collection(db, "updates"),
                    where("advertId", "==", advertId),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(updatesQuery);
                const updatesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUpdates(updatesList);
            } catch (err) {
                console.error("Error fetching updates:", err);
            }
        };
        if (advertId) fetchUpdates();
    }, [advertId]);

    useEffect(() => {
        const fetchNoteCount = async () => {
            if (!ownerInfo?.uid) return;
            const snap = await getDocs(
                query(collection(db, "adminNotes"), where("userId", "==", ownerInfo.uid))
            );
            setNoteCount(snap.size);
        };

        fetchNoteCount();
    }, [ownerInfo]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'a':
                    if (!isProcessing) handleApprove();
                    break;
                case 'r':
                    if (!isProcessing) setShowRejectBox(true);
                    break;
                case 'e': // Edit mode toggle
                    if (!isProcessing) handleEditToggle();
                    break;
                case 'ArrowRight':
                    if (advert?.images && activeImageIndex < advert.images.length - 1) {
                        setActiveImageIndex(activeImageIndex + 1);
                    }
                    break;
                case 'ArrowLeft':
                    if (activeImageIndex > 0) {
                        setActiveImageIndex(activeImageIndex - 1);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeImageIndex, advert, isProcessing, ownerInfo, isEditMode]);

    useEffect(() => {
        const fetchOwnerAds = async () => {
            if (!ownerInfo?.uid) return;
            const q = query(
                collection(db, "allListings"),
                where("ownerId", "==", ownerInfo.uid),
                where("approved", "==", true)
            );
            const snap = await getDocs(q);
            setOwnerAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchOwnerAds();
    }, [ownerInfo]);

    // Edit mode handlers
    const handleEditToggle = () => {
        if (isEditMode && hasChanges) {
            if (window.confirm("You have unsaved changes. Do you want to discard them?")) {
                setEditedAdvert(advert);
                setIsEditMode(false);
                setHasChanges(false);
            }
        } else {
            setIsEditMode(!isEditMode);
        }
    };

    const handleFieldChange = (field, value) => {
        setEditedAdvert(prev => ({
            ...prev,
            [field]: value
        }));
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        if (!hasChanges || isSaving) return;

        try {
            setIsSaving(true);
            const adRef = doc(db, "allListings", advertId);

            // Prepare update data (excluding id and system fields)
            const updateData = { ...editedAdvert };
            delete updateData.id;
            delete updateData.createdAt;
            delete updateData.ownerId;

            await updateDoc(adRef, {
                ...updateData,
                lastModified: serverTimestamp(),
                modifiedBy: userData?.uid || "admin"
            });

            setAdvert(editedAdvert);
            setIsEditMode(false);
            setHasChanges(false);
            alert("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (hasChanges && !window.confirm("Are you sure you want to discard your changes?")) {
            return;
        }
        setEditedAdvert(advert);
        setIsEditMode(false);
        setHasChanges(false);
    };

    const handleReplySubmit = async (e, updateId) => {
        e.preventDefault();
        const text = replyTexts[updateId]?.trim();
        if (!text) return;

        try {
            const repliesRef = collection(db, "updates", updateId, "replies");
            await addDoc(repliesRef, {
                userId: "admin",
                userName: "Admin",
                text,
                createdAt: serverTimestamp()
            });
            setReplyTexts(prev => ({ ...prev, [updateId]: "" }));
            alert("Reply posted");
        } catch (err) {
            console.error("Error posting reply:", err);
            alert("Failed to post reply");
        }
    };

    // Updated approve handler with email functionality
    const handleApprove = async () => {
        if (isProcessing) return;
        try {
            setIsProcessing(true);
            const adRef = doc(db, "allListings", advertId);
            await updateDoc(adRef, { approved: true });

            // Send approval email if owner info is available
            if (ownerInfo) {
                const emailUserData = {
                    email: ownerInfo.email,
                    firstName: ownerInfo.firstName || '',
                    lastName: ownerInfo.lastName || ''
                };

                const emailAdvertData = {
                    id: advertId,
                    petName: advert.name || advert.title || 'your pet',
                    type: advert.petType || 'pet'
                };

                await sendAdvertApprovedEmail(emailUserData, emailAdvertData);
            }

            alert("Advert approved successfully!");
            navigate("/admin");
        } catch (error) {
            console.error("Error approving advert:", error);
            alert("Failed to approve advert. Please try again.");
            setIsProcessing(false);
        }
    };

    // Updated reject handler with email functionality
    const handleReject = async () => {
        if (isProcessing || !rejectReason.trim()) return;

        if (window.confirm("Are you sure you want to reject this advert?")) {
            try {
                setIsProcessing(true);
                const rejectedAt = new Date();

                // First, update the main advert document (this should always work)
                const adRef = doc(db, "allListings", advertId);
                await updateDoc(adRef, {
                    approved: false,
                    rejectionReason: rejectReason,
                    rejectionDate: serverTimestamp(),
                    lastRejectedAt: rejectedAt.toISOString(),
                    lastRejectionReason: rejectReason,
                });

                // Try to save to rejectedAdverts collection (handle permission issues gracefully)
                try {
                    await setDoc(doc(db, 'rejectedAdverts', advertId), {
                        ...advert,
                        rejectedAt: rejectedAt.toISOString(),
                        rejectionReason: rejectReason,
                        reviewedBy: auth.currentUser?.uid || "admin",
                        originalId: advertId,
                        rejectedBy: userData?.firstName || "Admin"
                    });
                    console.log("✅ Successfully saved to rejectedAdverts collection");
                } catch (permissionError) {
                    console.warn('⚠️ Could not save to rejectedAdverts collection:', permissionError.message);
                }

                // Send rejection email using SendGrid template
                try {
                    if (ownerInfo) {
                        const emailUserData = {
                            email: ownerInfo.email,
                            firstName: ownerInfo.firstName || '',
                            lastName: ownerInfo.lastName || ''
                        };

                        const emailAdvertData = {
                            id: advertId,
                            petName: advert.name || advert.title || 'your pet',
                            type: advert.petType || 'pet'
                        };

                        await sendAdvertRejectedEmail(emailUserData, emailAdvertData, rejectReason);
                        console.log("✅ Rejection email sent successfully");
                    }
                } catch (emailError) {
                    console.error('⚠️ Failed to send rejection email:', emailError);
                }

                // Send admin message (keep existing functionality)
                try {
                    if (ownerInfo?.uid) {
                        await addDoc(collection(db, "adminMessages"), {
                            toUserId: ownerInfo.uid,
                            advertId,
                            reason: rejectReason,
                            createdAt: serverTimestamp(),
                            read: false,
                            type: "rejection",
                        });
                        console.log("✅ Admin message sent successfully");
                    }
                } catch (messageError) {
                    console.error('⚠️ Failed to send admin message:', messageError);
                }

                alert("Advert rejected successfully!");
                navigate("/admin");

            } catch (error) {
                console.error("❌ Critical error rejecting advert:", error);
                alert(`Failed to reject advert: ${error.message}. Please try again.`);
                setIsProcessing(false);
            }
        }
    };

    const handleScanForBannedTerms = () => {
        if (!advert?.description) {
            alert("No description found to scan.");
            return;
        }

        const lowerDesc = advert.description.toLowerCase();
        const foundTerms = bannedTerms.filter(term => lowerDesc.includes(term.toLowerCase()));

        if (foundTerms.length > 0) {
            alert(`⚠️ Warning: Found banned term(s):\n\n${foundTerms.join(", ")}\n\nThese terms are now highlighted in yellow in the description.`);
            // Scroll to description section if not visible
            setActiveSection("overview");
        } else {
            alert("✅ No banned terms detected in the description.");
        }
    };

    const handleToggleBlacklist = async () => {
        if (!ownerInfo?.uid) return;

        try {
            const userRef = doc(db, "users", ownerInfo.uid);
            await updateDoc(userRef, {
                blacklisted: !ownerInfo.blacklisted
            });

            setOwnerInfo((prev) => ({
                ...prev,
                blacklisted: !prev.blacklisted
            }));
        } catch (error) {
            console.error("Error toggling blacklist:", error);
            alert("Failed to update blacklist status.");
        }
    };

    const handleTogglePause = async () => {
        if (!advert?.id) return;
        try {
            const adRef = doc(db, "allListings", advert.id);
            await updateDoc(adRef, { paused: !advert.paused });

            setAdvert(prev => ({
                ...prev,
                paused: !prev.paused
            }));
        } catch (error) {
            console.error("Error toggling pause state:", error);
            alert("Failed to update advert pause status.");
        }
    };

    const handleImageChange = (index) => {
        setActiveImageIndex(index);
    };

    const toggleFullImage = () => {
        setShowFullImage(!showFullImage);
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const applyRejectTemplate = (template) => {
        setRejectReason(template);
    };

    const copyOwnerContact = () => {
        if (!ownerInfo) return;

        const contactInfo = `
Name: ${ownerInfo.firstName} ${ownerInfo.lastName}
Email: ${ownerInfo.email}
Phone: ${ownerInfo.phone || "Not provided"}
Address: ${ownerInfo.address1}, ${ownerInfo.city}, ${ownerInfo.postcode}
        `.trim();

        navigator.clipboard.writeText(contactInfo);
        alert("Contact information copied to clipboard");
    };

    const handleQuickReply = (template) => {
        const updatedReplies = {};
        updates.forEach(update => {
            updatedReplies[update.id] = template;
        });
        setReplyTexts(updatedReplies);
    };

    // Calculate pet age
    const calculateAge = (dob) => {
        if (!dob) return "Unknown";
        const birthDate = new Date(dob);
        const today = new Date();
        const diffMs = today - birthDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 60) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks !== 1 ? 's' : ''}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30.44);
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years !== 1 ? 's' : ''}`;
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page-container">
                <AdminSidebar />
                <div className="admin-content-area">
                    <div className="advert-view-loading-spinner">
                        <div className="advert-view-spinner"></div>
                        <p>Loading advert details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <AdminSidebar />
            <div className="admin-content-area">
                {advert ? (
                    <>
                        {/* Header Bar */}
                        <div className="advert-view-header">
                            <div className="advert-view-header-content">
                                <div className="advert-view-header-left">
                                    <button onClick={() => navigate('/admin')} className="advert-view-back-button">
                                        <FaArrowLeft /> Back
                                    </button>
                                    <div className="advert-view-title-section">
                                        <h1 className="advert-view-title">{advert.title || "Untitled Advert"}</h1>
                                        <div className="advert-view-meta">
                                            <span className="advert-view-id">ID: {advert.id}</span>
                                            <span className="advert-view-type-badge" style={{ backgroundColor: getAdvertTypeColor(advert.intent) }}>
                                                {getAdvertTypeLabel(advert.intent)}
                                            </span>
                                            {advert.paused && <span className="advert-view-paused-badge">Paused</span>}
                                            {advert.sold && <span className="advert-view-sold-badge">Sold</span>}
                                            {advert.adopted && <span className="advert-view-adopted-badge">Adopted</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="advert-view-header-actions">
                                    {isEditMode ? (
                                        <>
                                            <button onClick={handleSaveChanges} className="advert-view-save-btn" disabled={isSaving || !hasChanges}>
                                                <FaSave /> Save Changes
                                            </button>
                                            <button onClick={handleCancelEdit} className="advert-view-cancel-btn">
                                                <FaTimes /> Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleEditToggle} className="advert-view-edit-btn">
                                                <FaEdit /> Edit
                                            </button>
                                            <button onClick={handleApprove} className="advert-view-approve-btn" disabled={isProcessing}>
                                                <FaCheck /> Approve
                                            </button>
                                            <button onClick={() => setShowRejectBox(true)} className="advert-view-reject-btn" disabled={isProcessing}>
                                                <FaTimes /> Reject
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="advert-view-delete-btn"
                                                disabled={isProcessing}
                                                title="Permanently delete this advert"
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats Bar */}
                            <div className="advert-view-stats-bar">
                                <div className="advert-view-stat">
                                    <FaEye className="advert-view-stat-icon" />
                                    <span className="advert-view-stat-value">{advert.views || 0}</span>
                                    <span className="advert-view-stat-label">Views</span>
                                </div>
                                <div className="advert-view-stat">
                                    <FaHeart className="advert-view-stat-icon" />
                                    <span className="advert-view-stat-value">{advert.favoriteCount || 0}</span>
                                    <span className="advert-view-stat-label">Favourites</span>
                                </div>
                                <div className="advert-view-stat">
                                    <FaRegCalendarAlt className="advert-view-stat-icon" />
                                    <span className="advert-view-stat-value">{advert.createdAt ? new Date(advert.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                    <span className="advert-view-stat-label">Created</span>
                                </div>
                                <div className="advert-view-stat">
                                    <FaPoundSign className="advert-view-stat-icon" />
                                    <span className="advert-view-stat-value">£{advert.intent === 'rescue' ? (advert.adoptionFee || 0) : (advert.price || 0)}</span>
                                    <span className="advert-view-stat-label">{advert.intent === 'rescue' ? 'Adoption Fee' : 'Price'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="advert-view-content">
                            {/* Tabs */}
                            <div className="advert-view-tabs">
                                <button
                                    className={`advert-view-tab ${activeSection === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('overview')}
                                >
                                    <FaClipboardCheck /> Overview
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === 'images' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('images')}
                                >
                                    <FaImages /> Images
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === 'health' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('health')}
                                >
                                    <FaNotesMedical /> Health & Care
                                </button>
                                {advert.intent === 'rescue' && (
                                    <button
                                        className={`advert-view-tab ${activeSection === 'adoption' ? 'active' : ''}`}
                                        onClick={() => setActiveSection('adoption')}
                                    >
                                        <FaHandHoldingHeart /> Adoption Info
                                    </button>
                                )}
                                <button
                                    className={`advert-view-tab ${activeSection === 'owner' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('owner')}
                                >
                                    <FaUserAlt /> Owner
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === 'updates' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('updates')}
                                >
                                    <FaReply /> Updates {updates.length > 0 && `(${updates.length})`}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="advert-view-tab-content">
                                {/* Overview Tab */}
                                {activeSection === 'overview' && (
                                    <div className="advert-view-overview">
                                        <div className="advert-view-overview-grid">
                                            {/* Basic Information */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaInfoCircle /> Basic Information
                                                </h3>
                                                <div className="advert-view-info-grid">
                                                    {advert.name && (
                                                        <div className="advert-view-info-item">
                                                            <span className="advert-view-info-label">
                                                                <FaPaw /> Name:
                                                            </span>
                                                            {isEditMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="advert-view-edit-input"
                                                                    value={editedAdvert.name || ""}
                                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                                />
                                                            ) : (
                                                                <span className="advert-view-info-value">{advert.name}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaDna /> Breed/Type:
                                                        </span>
                                                        {isEditMode ? (
                                                            <input
                                                                type="text"
                                                                className="advert-view-edit-input"
                                                                value={editedAdvert.breedOrType || ""}
                                                                onChange={(e) => handleFieldChange('breedOrType', e.target.value)}
                                                            />
                                                        ) : (
                                                            <span className="advert-view-info-value">{advert.breedOrType || "Not specified"}</span>
                                                        )}
                                                    </div>

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaTags /> Category:
                                                        </span>
                                                        <span className="advert-view-info-value">{advert.category || "Not specified"}</span>
                                                    </div>

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaRegCalendarAlt /> Age:
                                                        </span>
                                                        <span className="advert-view-info-value">{calculateAge(advert.dob)}</span>
                                                    </div>

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaUserAlt /> Gender:
                                                        </span>
                                                        {isEditMode ? (
                                                            <select
                                                                className="advert-view-edit-select"
                                                                value={editedAdvert.gender || ""}
                                                                onChange={(e) => handleFieldChange('gender', e.target.value)}
                                                            >
                                                                <option value="">Not specified</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="both">Both Available</option>
                                                            </select>
                                                        ) : (
                                                            <span className="advert-view-info-value">{advert.gender || "Not specified"}</span>
                                                        )}
                                                    </div>

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaPalette /> Colour:
                                                        </span>
                                                        <span className="advert-view-info-value">{resolveColourLabel(advert)}</span>
                                                    </div>

                                                    {advert.intent === 'stud' && (
                                                        <>
                                                            <div className="advert-view-info-item">
                                                                <span className="advert-view-info-label">
                                                                    <FaRuler /> Height:
                                                                </span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.height || ""}
                                                                        onChange={(e) => handleFieldChange('height', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-info-value">{advert.height || "Not specified"}</span>
                                                                )}
                                                            </div>
                                                            <div className="advert-view-info-item">
                                                                <span className="advert-view-info-label">
                                                                    <FaWeight /> Weight:
                                                                </span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.weight || ""}
                                                                        onChange={(e) => handleFieldChange('weight', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-info-value">{advert.weight || "Not specified"}</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="advert-view-info-item">
                                                        <span className="advert-view-info-label">
                                                            <FaMapMarkerAlt /> Location:
                                                        </span>
                                                        <span className="advert-view-info-value">{advert.postcode || "Not specified"}</span>
                                                    </div>

                                                    {advert.intent === 'sale' && (
                                                        <div className="advert-view-info-item">
                                                            <span className="advert-view-info-label">
                                                                <FaCalendarCheck /> Available Date:
                                                            </span>
                                                            {isEditMode ? (
                                                                <input
                                                                    type="date"
                                                                    className="advert-view-edit-input"
                                                                    value={editedAdvert.availableDate || ""}
                                                                    onChange={(e) => handleFieldChange('availableDate', e.target.value)}
                                                                />
                                                            ) : (
                                                                <span className="advert-view-info-value">
                                                                    {advert.availableDate ? new Date(advert.availableDate).toLocaleDateString() : "Not specified"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaEdit /> Description
                                                    {hasBannedTerms && (
                                                        <span className="advert-view-warning-badge">
                                                            <FaExclamationTriangle /> Contains banned terms
                                                        </span>
                                                    )}
                                                </h3>
                                                {isEditMode ? (
                                                    <textarea
                                                        className="advert-view-edit-textarea"
                                                        value={editedAdvert.description || ""}
                                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                                        rows={6}
                                                    />
                                                ) : (
                                                    <div
                                                        className="advert-view-description"
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightBannedTerms(advert.description || "No description provided")
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaList /> Quick Actions
                                                </h3>
                                                <div className="advert-view-quick-actions">
                                                    <button onClick={handleTogglePause} className="advert-view-action-btn">
                                                        <FaPause /> {advert.paused ? 'Unpause' : 'Pause'} Advert
                                                    </button>
                                                    <button onClick={handleScanForBannedTerms} className="advert-view-action-btn">
                                                        <FaShieldAlt /> Scan for Banned Terms
                                                    </button>
                                                    {ownerInfo && (
                                                        <button onClick={() => setShowNotesModal(true)} className="advert-view-action-btn">
                                                            <FaComment /> Owner Notes ({noteCount})
                                                        </button>
                                                    )}
                                                    <Link to={`/admin/user/${ownerInfo?.uid}`} className="advert-view-action-btn">
                                                        <FaUserAlt /> View Owner Profile
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Social Media */}
                                            {(advert.facebookUrl || advert.instagramUrl || advert.tiktokUrl) && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaShare /> Social Media
                                                    </h3>
                                                    <div className="advert-view-social-links">
                                                        {advert.facebookUrl && (
                                                            <a href={advert.facebookUrl} target="_blank" rel="noopener noreferrer" className="advert-view-social-link facebook">
                                                                <FaFacebook /> Facebook
                                                            </a>
                                                        )}
                                                        {advert.instagramUrl && (
                                                            <a href={advert.instagramUrl} target="_blank" rel="noopener noreferrer" className="advert-view-social-link instagram">
                                                                <FaInstagram /> Instagram
                                                            </a>
                                                        )}
                                                        {advert.tiktokUrl && (
                                                            <a href={advert.tiktokUrl} target="_blank" rel="noopener noreferrer" className="advert-view-social-link tiktok">
                                                                <FaTiktok /> TikTok
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Images Tab */}
                                {activeSection === 'images' && (
                                    <div className="advert-view-images-section">
                                        <div className="advert-view-card">
                                            <h3 className="advert-view-card-title">
                                                <FaImages /> Image Gallery ({advert.images?.length || 0} images)
                                            </h3>
                                            {advert.images && advert.images.length > 0 ? (
                                                <div className="advert-view-gallery">
                                                    <div className="advert-view-main-image">
                                                        <img
                                                            src={advert.images[activeImageIndex]}
                                                            alt={`${advert.title} - Image ${activeImageIndex + 1}`}
                                                            onClick={toggleFullImage}
                                                        />
                                                        <div className="advert-view-image-nav">
                                                            <button
                                                                onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                                                                disabled={activeImageIndex === 0}
                                                            >
                                                                <FaArrowLeft />
                                                            </button>
                                                            <span>{activeImageIndex + 1} / {advert.images.length}</span>
                                                            <button
                                                                onClick={() => setActiveImageIndex(Math.min(advert.images.length - 1, activeImageIndex + 1))}
                                                                disabled={activeImageIndex === advert.images.length - 1}
                                                            >
                                                                <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="advert-view-thumbnails">
                                                        {advert.images.map((img, index) => (
                                                            <div
                                                                key={index}
                                                                className={`advert-view-thumbnail ${activeImageIndex === index ? 'active' : ''}`}
                                                                onClick={() => setActiveImageIndex(index)}
                                                            >
                                                                <img src={img} alt={`Thumbnail ${index + 1}`} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="advert-view-no-images">
                                                    <FaImages />
                                                    <p>No images uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Health & Care Tab */}
                                {activeSection === 'health' && (
                                    <div className="advert-view-health-section">
                                        <div className="advert-view-health-grid">
                                            {/* Health Status */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaVial /> Health Status
                                                </h3>
                                                <div className="advert-view-health-items">
                                                    {advert.intent !== 'rescue' && advert.category === 'dogs' && (
                                                        <div className="advert-view-health-item">
                                                            <span className="advert-view-health-label">KC Registered:</span>
                                                            <span className={`advert-view-health-badge ${advert.kcRegistered ? 'positive' : 'negative'}`}>
                                                                {advert.kcRegistered ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                {advert.kcRegistered ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="advert-view-health-item">
                                                        <span className="advert-view-health-label">Vaccinated:</span>
                                                        <span className={`advert-view-health-badge ${advert.vaccinated ? 'positive' : 'negative'}`}>
                                                            {advert.vaccinated ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {advert.vaccinated ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>

                                                    <div className="advert-view-health-item">
                                                        <span className="advert-view-health-label">Microchipped:</span>
                                                        <span className={`advert-view-health-badge ${advert.microchipped ? 'positive' : 'negative'}`}>
                                                            {advert.microchipped ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {advert.microchipped ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>

                                                    <div className="advert-view-health-item">
                                                        <span className="advert-view-health-label">Neutered/Spayed:</span>
                                                        <span className={`advert-view-health-badge ${advert.neutered ? 'positive' : 'negative'}`}>
                                                            {advert.neutered ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {advert.neutered ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>

                                                    <div className="advert-view-health-item">
                                                        <span className="advert-view-health-label">Wormed:</span>
                                                        <span className={`advert-view-health-badge ${advert.wormed ? 'positive' : 'negative'}`}>
                                                            {advert.wormed ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {advert.wormed ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>

                                                    <div className="advert-view-health-item">
                                                        <span className="advert-view-health-label">Flea Treated:</span>
                                                        <span className={`advert-view-health-badge ${advert.fleaTreated ? 'positive' : 'negative'}`}>
                                                            {advert.fleaTreated ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {advert.fleaTreated ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>

                                                    {advert.intent === 'stud' && (
                                                        <div className="advert-view-health-item">
                                                            <span className="advert-view-health-label">Proven Stud:</span>
                                                            <span className={`advert-view-health-badge ${advert.proven ? 'positive' : 'negative'}`}>
                                                                {advert.proven ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                {advert.proven ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Health Tests */}
                                            {hasHealthTests && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaSyringe /> Health Tests
                                                    </h3>
                                                    <div className="advert-view-health-tests">
                                                        {advert.healthTests.map((test, idx) => (
                                                            <div key={idx} className="advert-view-health-test">
                                                                <FaCheckCircle className="advert-view-test-icon" />
                                                                <span>{test}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* KC Details */}
                                            {advert.kcRegistered && advert.kcName && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaIdCard /> KC Registration
                                                    </h3>
                                                    <div className="advert-view-kc-info">
                                                        <p><strong>KC Name:</strong> {advert.kcName}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Adoption Info Tab (Rescue only) */}
                                {activeSection === 'adoption' && advert.intent === 'rescue' && (
                                    <div className="advert-view-adoption-section">
                                        <div className="advert-view-adoption-grid">
                                            {/* Behavioral Traits */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaPaw /> Behavioral Traits
                                                </h3>
                                                <div className="advert-view-traits-grid">
                                                    <div className="advert-view-trait-item">
                                                        <FaCat className="advert-view-trait-icon" />
                                                        <span className="advert-view-trait-label">Good with Cats:</span>
                                                        <span className={`advert-view-trait-value ${advert.goodWithCats}`}>
                                                            {advert.goodWithCats || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="advert-view-trait-item">
                                                        <FaDog className="advert-view-trait-icon" />
                                                        <span className="advert-view-trait-label">Good with Dogs:</span>
                                                        <span className={`advert-view-trait-value ${advert.goodWithDogs}`}>
                                                            {advert.goodWithDogs || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="advert-view-trait-item">
                                                        <FaChild className="advert-view-trait-icon" />
                                                        <span className="advert-view-trait-label">Good with Children:</span>
                                                        <span className={`advert-view-trait-value ${advert.goodWithChildren}`}>
                                                            {advert.goodWithChildren === 'yes' ? 'Yes - All Ages' :
                                                                advert.goodWithChildren === 'older' ? 'Older Children Only' :
                                                                    advert.goodWithChildren === 'no' ? 'No' : 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="advert-view-trait-item">
                                                        <FaBatteryHalf className="advert-view-trait-icon" />
                                                        <span className="advert-view-trait-label">Energy Level:</span>
                                                        <span className={`advert-view-trait-value energy-${advert.energyLevel}`}>
                                                            {advert.energyLevel === 'low' ? 'Low - Couch Potato' :
                                                                advert.energyLevel === 'moderate' ? 'Moderate - Daily Walks' :
                                                                    advert.energyLevel === 'high' ? 'High - Very Active' : 'Not specified'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rescue Story */}
                                            {advert.rescueStory && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaHistory /> Rescue Story
                                                    </h3>
                                                    <p className="advert-view-rescue-story">{advert.rescueStory}</p>
                                                </div>
                                            )}

                                            {/* Special Needs */}
                                            {advert.specialNeeds && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaExclamationTriangle /> Special Needs
                                                    </h3>
                                                    <p className="advert-view-special-needs">{advert.specialNeeds}</p>
                                                </div>
                                            )}

                                            {/* Home Requirements */}
                                            {advert.homeRequirements && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaHome /> Home Requirements
                                                    </h3>
                                                    <p className="advert-view-home-requirements">{advert.homeRequirements}</p>
                                                </div>
                                            )}

                                            {/* Behavioral Notes */}
                                            {advert.behavioralNotes && (
                                                <div className="advert-view-card">
                                                    <h3 className="advert-view-card-title">
                                                        <FaComment /> Behavioral Notes
                                                    </h3>
                                                    <p className="advert-view-behavioral-notes">{advert.behavioralNotes}</p>
                                                </div>
                                            )}

                                            {/* Additional Info */}
                                            <div className="advert-view-card">
                                                <h3 className="advert-view-card-title">
                                                    <FaInfoCircle /> Additional Information
                                                </h3>
                                                <div className="advert-view-additional-info">
                                                    <div className="advert-view-info-row">
                                                        <span>Fostering Available:</span>
                                                        <span className={`advert-view-badge ${advert.fosteringAvailable ? 'positive' : 'negative'}`}>
                                                            {advert.fosteringAvailable ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                    <div className="advert-view-info-row">
                                                        <span>With Mother:</span>
                                                        <span className={`advert-view-badge ${advert.withMother ? 'positive' : 'negative'}`}>
                                                            {advert.withMother ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Owner Tab */}
                                {activeSection === 'owner' && ownerInfo && (
                                    <div className="advert-view-owner-section">
                                        <div className="advert-view-card">
                                            <h3 className="advert-view-card-title">
                                                <FaUserAlt /> Owner Information
                                            </h3>
                                            <div className="advert-view-owner-content">
                                                <div className="advert-view-owner-header">
                                                    <div className="advert-view-owner-avatar">
                                                        {ownerInfo.avatar ? (
                                                            <img src={ownerInfo.avatar} alt={ownerInfo.firstName} />
                                                        ) : (
                                                            <FaUserAlt />
                                                        )}
                                                    </div>
                                                    <div className="advert-view-owner-details">
                                                        <h4>{ownerInfo.firstName} {ownerInfo.lastName}</h4>
                                                        <p className="advert-view-owner-meta">
                                                            Member since {ownerInfo.createdAt ? new Date(ownerInfo.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                        </p>
                                                        {ownerInfo.blacklisted && (
                                                            <span className="advert-view-blacklist-badge">
                                                                <FaExclamationTriangle /> Blacklisted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="advert-view-owner-contact">
                                                    <div className="advert-view-contact-item">
                                                        <FaEnvelope />
                                                        <span>{ownerInfo.email}</span>
                                                    </div>
                                                    <div className="advert-view-contact-item">
                                                        <FaPhone />
                                                        <span>{ownerInfo.phone || 'Not provided'}</span>
                                                    </div>
                                                    <div className="advert-view-contact-item">
                                                        <FaMapMarkerAlt />
                                                        <span>{ownerInfo.city}, {ownerInfo.postcode}</span>
                                                    </div>
                                                </div>

                                                <div className="advert-view-owner-actions">
                                                    <Link to={`/admin/user/${ownerInfo.uid}`} className="advert-view-owner-action-btn">
                                                        <FaUserAlt /> View Full Profile
                                                    </Link>
                                                    <button onClick={copyOwnerContact} className="advert-view-owner-action-btn">
                                                        <FaClipboard /> Copy Contact Info
                                                    </button>
                                                    <button onClick={handleToggleBlacklist} className="advert-view-owner-action-btn danger">
                                                        <FaExclamationTriangle /> {ownerInfo.blacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
                                                    </button>
                                                </div>

                                                <div className="advert-view-owner-stats">
                                                    <div className="advert-view-owner-stat">
                                                        <span className="stat-value">{ownerAds.length}</span>
                                                        <span className="stat-label">Active Adverts</span>
                                                    </div>
                                                    <div className="advert-view-owner-stat">
                                                        <span className="stat-value">{ownerInfo.advertCount || 0}</span>
                                                        <span className="stat-label">Total Adverts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Updates Tab */}
                                {activeSection === 'updates' && (
                                    <div className="advert-view-updates-section">
                                        <div className="advert-view-card">
                                            <h3 className="advert-view-card-title">
                                                <FaReply /> Updates & Communication
                                            </h3>
                                            {updates.length > 0 ? (
                                                <div className="advert-view-updates-list">
                                                    {updates.map(update => (
                                                        <div key={update.id} className="advert-view-update-item">
                                                            <div className="advert-view-update-content">
                                                                <p>{update.text}</p>
                                                                <span className="advert-view-update-time">
                                                                    {update.createdAt?.toDate().toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <form onSubmit={(e) => handleReplySubmit(e, update.id)} className="advert-view-reply-form">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Type a reply..."
                                                                    value={replyTexts[update.id] || ""}
                                                                    onChange={(e) => setReplyTexts(prev => ({...prev, [update.id]: e.target.value}))}
                                                                />
                                                                <button type="submit">
                                                                    <FaReply /> Reply
                                                                </button>
                                                            </form>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="advert-view-no-updates">
                                                    <FaEnvelopeOpen />
                                                    <p>No updates from the owner yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Full Image Modal */}
                        {showFullImage && advert?.images && (
                            <div className="advert-view-modal" onClick={toggleFullImage}>
                                <div className="advert-view-modal-content" onClick={(e) => e.stopPropagation()}>
                                    <button className="advert-view-modal-close" onClick={toggleFullImage}>
                                        <FaTimes />
                                    </button>
                                    <img src={advert.images[activeImageIndex]} alt="Full size" />
                                </div>
                            </div>
                        )}

                        {/* Reject Modal */}
                        {showRejectBox && (
                            <div className="advert-view-modal" style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }}>
                                <div className="advert-view-modal-content advert-view-reject-modal" style={{
                                    backgroundColor: 'white',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    maxWidth: '500px',
                                    width: '90%',
                                    maxHeight: '80vh',
                                    overflow: 'auto'
                                }}>
                                    <h3>Reject Advert</h3>
                                    <div className="advert-view-reject-templates">
                                        <p>Quick templates:</p>
                                        {rejectTemplates.map((template, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => applyRejectTemplate(template)}
                                                className="advert-view-template-btn"
                                                style={{
                                                    display: 'block',
                                                    margin: '5px 0',
                                                    padding: '8px',
                                                    width: '100%',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#f8f9fa',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {template}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Enter rejection reason..."
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            margin: '10px 0',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <div className="advert-view-modal-actions" style={{
                                        display: 'flex',
                                        gap: '10px',
                                        justifyContent: 'flex-end',
                                        marginTop: '15px'
                                    }}>
                                        <button
                                            onClick={() => setShowRejectBox(false)}
                                            className="advert-view-cancel-btn"

                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="advert-view-reject-confirm-btn"
                                            disabled={!rejectReason.trim()}
                                            style={{
                                                padding: '8px 16px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                backgroundColor: rejectReason.trim() ? '#dc3545' : '#ccc',
                                                color: 'white',
                                                cursor: rejectReason.trim() ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Notes Modal */}
                        {showNotesModal && ownerInfo && (
                            <AdminNotesModal
                                userId={ownerInfo.uid}
                                adminName={userData?.firstName || "Admin"}
                                onClose={() => setShowNotesModal(false)}
                            />
                        )}
                        {/* Delete Confirmation Modal */}
                        {showDeleteModal && (
                            <div className="advert-view-modal" style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }}>
                                <div className="advert-view-modal-content advert-view-delete-modal" style={{
                                    backgroundColor: 'white',
                                    padding: '2rem',
                                    borderRadius: '8px',
                                    maxWidth: '500px',
                                    width: '90%',
                                    border: '3px solid #dc2626'
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <FaTrash style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem' }} />
                                        <h3 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                            ⚠️ DANGER ZONE ⚠️
                                        </h3>
                                    </div>

                                    <div style={{
                                        background: '#fee2e2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <p style={{ margin: 0, color: '#991b1b', fontWeight: 'bold' }}>
                                            ⚠️ This action will PERMANENTLY DELETE the advert and ALL associated data including:
                                        </p>
                                        <ul style={{ margin: '0.5rem 0 0 1rem', color: '#991b1b' }}>
                                            <li>The advert listing</li>
                                            <li>All admin messages</li>
                                            <li>All owner updates</li>
                                            <li>All associated data</li>
                                        </ul>
                                        <p style={{ margin: '0.5rem 0 0 0', color: '#991b1b', fontWeight: 'bold' }}>
                                            THIS CANNOT BE UNDONE!
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#374151',
                                            fontWeight: 'bold'
                                        }}>
                                            Type "DELETE PERMANENTLY" to confirm:
                                        </label>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="DELETE PERMANENTLY"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                textAlign: 'center',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                        <p style={{
                                            margin: 0,
                                            color: '#6b7280',
                                            fontSize: '0.875rem'
                                        }}>
                                            Advert ID: <strong>{advertId}</strong><br />
                                            Title: <strong>{advert?.title || 'Untitled'}</strong>
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        justifyContent: 'flex-end'
                                    }}>
                                        <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setDeleteConfirmText("");
                                            }}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: '#f9fafb',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteAdvert}
                                            disabled={deleteConfirmText !== "DELETE PERMANENTLY" || isDeleting}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                border: 'none',
                                                borderRadius: '6px',
                                                backgroundColor: deleteConfirmText === "DELETE PERMANENTLY" && !isDeleting ? '#dc2626' : '#9ca3af',
                                                color: 'white',
                                                cursor: deleteConfirmText === "DELETE PERMANENTLY" && !isDeleting ? 'pointer' : 'not-allowed',
                                                fontWeight: 'bold',
                                                opacity: deleteConfirmText === "DELETE PERMANENTLY" && !isDeleting ? 1 : 0.5
                                            }}
                                        >
                                            {isDeleting ? 'DELETING...' : '🗑️ DELETE PERMANENTLY'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </>
                ) : (
                    <div className="advert-view-not-found">
                        <FaExclamationTriangle />
                        <h2>Advert Not Found</h2>
                        <p>The advert you're looking for doesn't exist or has been removed.</p>
                        <button onClick={() => navigate('/admin')} className="advert-view-back-btn">
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}