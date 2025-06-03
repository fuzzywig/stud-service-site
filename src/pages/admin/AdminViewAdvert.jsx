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
    serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import {
    FaCheck,
    FaAd,
    FaTimes,
    FaArrowLeft,
    FaImages,
    FaPaw,
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
    FaPrescriptionBottleAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaFacebook,
    FaInstagram,
    FaVial,
    FaBug,
    FaShieldAlt,
    FaMedal,
    FaSearch,
    FaInfoCircle,
    FaTags,
    FaSave,
    FaExclamationTriangle,
    FaComment,
    FaKeyboard,
    FaEdit,
    FaClipboard,
    FaEnvelopeOpen,
    FaList,
    FaThumbsUp,
    FaThumbsDown,
    FaFlag,
    FaShare
} from "react-icons/fa";
import "./AdminViewAdvert.css";
import AdminNotesModal from "../../components/admin/AdminNotesModal";
import { useAuth } from "../../firebase/firebaseAuth";

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
    const [activeSection, setActiveSection] = useState("images");

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
                case 'i':
                    setActiveSection("images");
                    break;
                case 'o':
                    setActiveSection("owner");
                    break;
                case 'u':
                    setActiveSection("updates");
                    break;
                case 'n':
                    if (ownerInfo) setShowNotesModal(true);
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

    const handleApprove = async () => {
        if (isProcessing) return;
        try {
            setIsProcessing(true);
            const adRef = doc(db, "allListings", advertId);
            await updateDoc(adRef, { approved: true });
            navigate("/admin");
        } catch (error) {
            console.error("Error approving advert:", error);
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (isProcessing || !rejectReason.trim()) return;

        if (window.confirm("Are you sure you want to reject this advert?")) {
            try {
                setIsProcessing(true);

                const adRef = doc(db, "allListings", advertId);
                await updateDoc(adRef, {
                    approved: false,
                    rejectionReason: rejectReason,
                    rejectionDate: serverTimestamp(),
                });

                if (ownerInfo?.uid) {
                    await addDoc(collection(db, "adminMessages"), {
                        toUserId: ownerInfo.uid,
                        advertId,
                        reason: rejectReason,
                        createdAt: serverTimestamp(),
                        read: false,
                        type: "rejection",
                    });
                }

                alert("Advert rejected. Message sent to user.");
                navigate("/admin");
            } catch (error) {
                console.error("Error rejecting advert:", error);
                alert("Failed to reject advert. Please try again.");
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
            setActiveSection("details");
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
                        {/* Top Action Bar */}
                        <div className="advert-view-action-bar">
                            <div className="advert-view-action-bar-left">
                                <h1 className="advert-view-title">{advert.title || "Untitled Advert"}</h1>
                                <span className="advert-view-id">ID: {advert.id}</span>
                            </div>
                            <div className="advert-view-action-bar-center">
                                {/* Search Form */}
                                <form onSubmit={handleSearch} className="advert-view-search-form">
                                    <div className="advert-view-search-wrapper">
                                        <input
                                            type="text"
                                            value={searchId}
                                            onChange={(e) => {
                                                setSearchId(e.target.value);
                                                setSearchError("");
                                            }}
                                            placeholder="Search by Advert ID..."
                                            className="advert-view-search-input"
                                            disabled={isSearching}
                                        />
                                        <button
                                            type="submit"
                                            className="advert-view-search-button"
                                            disabled={isSearching || !searchId.trim()}
                                        >
                                            {isSearching ? (
                                                <div className="advert-view-search-spinner"></div>
                                            ) : (
                                                <FaSearch />
                                            )}
                                        </button>
                                    </div>
                                    {searchError && (
                                        <div className="advert-view-search-error">{searchError}</div>
                                    )}
                                </form>
                            </div>
                            <div className="advert-view-action-bar-right">
                                {isEditMode ? (
                                    <>
                                        <button
                                            onClick={handleSaveChanges}
                                            className="advert-view-save-button"
                                            disabled={isSaving || !hasChanges}
                                        >
                                            <FaSave /> Save Changes
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="advert-view-cancel-edit-button"
                                            disabled={isSaving}
                                        >
                                            <FaTimes /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEditToggle}
                                            className="advert-view-edit-button"
                                            disabled={isProcessing}
                                            title="Shortcut: Press 'E'"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="advert-view-approve-button"
                                            disabled={isProcessing}
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            onClick={() => setShowRejectBox(true)}
                                            className="advert-view-reject-button"
                                            disabled={isProcessing || showRejectBox}
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                        <button
                                            onClick={handleScanForBannedTerms}
                                            className={`advert-view-flag-button ${hasBannedTerms ? 'has-banned-terms' : ''}`}
                                            title={hasBannedTerms ? "Banned terms detected!" : "Scan description for banned terms"}
                                        >
                                            <FaShieldAlt /> {hasBannedTerms ? 'Banned Terms Found!' : 'Scan Terms'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Content Layout */}
                        <div className="advert-view-content-layout">
                            {/* Navigation Tabs */}
                            <div className="advert-view-nav-tabs">
                                <button
                                    className={`advert-view-tab ${activeSection === "images" ? "active" : ""}`}
                                    onClick={() => handleSectionChange("images")}
                                >
                                    <FaImages /> Images
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === "details" ? "active" : ""}`}
                                    onClick={() => handleSectionChange("details")}
                                >
                                    <FaClipboardCheck /> Details
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === "owner" ? "active" : ""}`}
                                    onClick={() => handleSectionChange("owner")}
                                >
                                    <FaUserAlt /> Owner
                                </button>
                                <button
                                    className={`advert-view-tab ${activeSection === "updates" ? "active" : ""}`}
                                    onClick={() => handleSectionChange("updates")}
                                >
                                    <FaReply /> Updates {updates.length > 0 && `(${updates.length})`}
                                </button>
                            </div>

                            {/* Main and Side Content */}
                            <div className="advert-view-two-column-layout">
                                {/* Main Content Area */}
                                <div className="advert-view-main-content">
                                    {/* Images Section */}
                                    {activeSection === "images" && (
                                        <div className="advert-view-panel">
                                            <div className="advert-view-panel-header">
                                                <h2 className="advert-view-panel-title">
                                                    <FaImages /> Image Gallery
                                                    {advert.images && advert.images.length > 0 && (
                                                        <span className="advert-view-image-counter">
                                                            {activeImageIndex + 1}/{advert.images.length}
                                                        </span>
                                                    )}
                                                </h2>
                                                <div className="advert-view-image-actions">
                                                    <button
                                                        className="advert-view-icon-button"
                                                        disabled={activeImageIndex === 0}
                                                        onClick={() => setActiveImageIndex(activeImageIndex - 1)}
                                                        title="Previous image (←)"
                                                    >
                                                        <FaArrowLeft />
                                                    </button>
                                                    <button
                                                        className="advert-view-icon-button"
                                                        disabled={!advert.images || activeImageIndex === advert.images.length - 1}
                                                        onClick={() => setActiveImageIndex(activeImageIndex + 1)}
                                                        title="Next image (→)"
                                                    >
                                                        <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                                    </button>
                                                    <button
                                                        className="advert-view-icon-button advert-view-zoom-button"
                                                        onClick={toggleFullImage}
                                                        title="View full size"
                                                    >
                                                        <FaSearch />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="advert-view-panel-content">
                                                {advert.images && advert.images.length > 0 ? (
                                                    <div className="advert-view-gallery-container">
                                                        <div className="advert-view-main-image-container">
                                                            <img
                                                                src={advert.images[activeImageIndex]}
                                                                alt={`Main view of ${advert.name || 'pet'}`}
                                                                className="advert-view-main-image"
                                                                onClick={toggleFullImage}
                                                            />
                                                        </div>
                                                        <div className="advert-view-thumbnail-strip">
                                                            {advert.images.map((img, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`advert-view-thumbnail-wrap ${activeImageIndex === index ? 'active' : ''}`}
                                                                    onClick={() => handleImageChange(index)}
                                                                    title={`Image ${index + 1}`}
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt={`Thumbnail ${index + 1}`}
                                                                        className="advert-view-thumbnail"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="advert-view-no-images">
                                                        <FaPaw className="advert-view-no-data-icon" />
                                                        <p>No images available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Details Section */}
                                    {activeSection === "details" && (
                                        <div className="advert-view-panel">
                                            <div className="advert-view-panel-header">
                                                <h2 className="advert-view-panel-title">
                                                    <FaClipboardCheck /> Advert Details
                                                </h2>
                                                <div className="advert-view-details-actions">
                                                    <button
                                                        className="advert-view-icon-button"
                                                        onClick={() => {
                                                            const details = Object.entries(advert)
                                                                .filter(([key]) => !['images', 'ownerId', 'id'].includes(key))
                                                                .map(([key, value]) => `${key}: ${value}`)
                                                                .join('\n');
                                                            navigator.clipboard.writeText(details);
                                                            alert("Advert details copied to clipboard");
                                                        }}
                                                    >
                                                        <FaClipboard /> Copy Details
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="advert-view-panel-content">
                                                <div className="advert-view-detail-columns">
                                                    <div className="advert-view-detail-column">
                                                        <div className="advert-view-detail-section">
                                                            <h3 className="advert-view-section-heading"><FaInfoCircle /> Basic Information</h3>

                                                            <div className="advert-view-detail-item">
                                                                <FaPaw className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Name:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.name || ""}
                                                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.name || "Not specified"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaPalette className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Breed:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.breedOrType || ""}
                                                                        onChange={(e) => handleFieldChange('breedOrType', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.breedOrType || "Not specified"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaRegCalendarAlt className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Age/DOB:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.dob || ""}
                                                                        onChange={(e) => handleFieldChange('dob', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.dob || "Not specified"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaPoundSign className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Fee:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="number"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.price || ""}
                                                                        onChange={(e) => handleFieldChange('price', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">£{advert.price || "0"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaMapMarkerAlt className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Location:</span>
                                                                <span className="advert-view-detail-value">
                                                                    {(ownerInfo?.city && ownerInfo?.county)
                                                                        ? `${ownerInfo.city}, ${ownerInfo.county}`
                                                                        : ownerInfo?.city || ownerInfo?.county || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="advert-view-detail-section">
                                                            <h3 className="advert-view-section-heading"><FaRuler /> Physical Attributes</h3>

                                                            <div className="advert-view-detail-item">
                                                                <FaPalette className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Colour:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.dogColor || editedAdvert.catColor || editedAdvert.colour || ""}
                                                                        onChange={(e) => {
                                                                            const field = editedAdvert.dogColor ? 'dogColor' :
                                                                                editedAdvert.catColor ? 'catColor' : 'colour';
                                                                            handleFieldChange(field, e.target.value);
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">
                                                                        {resolveColourLabel(advert) || "N/A"}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaRuler className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Height:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.height || ""}
                                                                        onChange={(e) => handleFieldChange('height', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.height || "N/A"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaWeight className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Weight:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.weight || ""}
                                                                        onChange={(e) => handleFieldChange('weight', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.weight || "N/A"}</span>
                                                                )}
                                                            </div>

                                                            <div className="advert-view-detail-item">
                                                                <FaHistory className="advert-view-detail-icon" />
                                                                <span className="advert-view-detail-label">Mating History:</span>
                                                                {isEditMode ? (
                                                                    <input
                                                                        type="text"
                                                                        className="advert-view-edit-input"
                                                                        value={editedAdvert.matings || ""}
                                                                        onChange={(e) => handleFieldChange('matings', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="advert-view-detail-value">{advert.matings ? `${advert.matings} Matings Included` : "N/A"}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {Array.isArray(advert.healthTests) && advert.healthTests.length > 0 && (
                                                            <div className="advert-view-detail-section">
                                                                <h3 className="advert-view-section-heading"><FaVial /> Health Tests</h3>
                                                                {advert.healthTests.map((test, idx) => (
                                                                    <div key={idx} className="advert-view-detail-item">
                                                                        <FaCheckCircle className="advert-view-detail-icon" />
                                                                        <span className="advert-view-detail-label">Test:</span>
                                                                        <span className="advert-view-detail-value">{test}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="advert-view-detail-column">
                                                        {(advert.description || isEditMode) && (
                                                            <div className="advert-view-detail-section">
                                                                <h3 className="advert-view-section-heading"><FaEdit /> Description</h3>
                                                                {isEditMode ? (
                                                                    <textarea
                                                                        className="advert-view-edit-textarea"
                                                                        value={editedAdvert.description || ""}
                                                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                                                        rows={8}
                                                                    />
                                                                ) : (
                                                                    <p className="advert-view-description-text"
                                                                       dangerouslySetInnerHTML={{
                                                                           __html: highlightBannedTerms(advert.description)
                                                                       }}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="advert-view-detail-section">
                                                            <h3 className="advert-view-section-heading"><FaVial /> Health Status</h3>
                                                            <div className="advert-view-health-status-grid">
                                                                <div className="advert-view-status-item">
                                                                    <span className="advert-view-status-label"><FaShieldAlt /> KC Registered:</span>
                                                                    {isEditMode ? (
                                                                        <label className="advert-view-checkbox-label">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editedAdvert.kcRegistered || false}
                                                                                onChange={(e) => handleFieldChange('kcRegistered', e.target.checked)}
                                                                            />
                                                                            <span>{editedAdvert.kcRegistered ? "Yes" : "No"}</span>
                                                                        </label>
                                                                    ) : (
                                                                        <span className="advert-view-status-value">
                                                                            {advert.kcRegistered ?
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> Yes</span> :
                                                                                <span className="advert-view-status-badge negative"><FaTimesCircle /> No</span>
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="advert-view-status-item">
                                                                    <span className="advert-view-status-label"><FaVial /> Health Tested:</span>
                                                                    <span className="advert-view-status-value">
                                                                        {hasHealthTests ? (
                                                                            <span className="advert-view-status-badge positive"><FaCheckCircle /> Yes</span>
                                                                        ) : (
                                                                            <span className="advert-view-status-badge negative"><FaTimesCircle /> No</span>
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="advert-view-status-item">
                                                                    <span className="advert-view-status-label"><FaPrescriptionBottleAlt /> Vaccinations:</span>
                                                                    {isEditMode ? (
                                                                        <label className="advert-view-checkbox-label">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editedAdvert.vacsUpToDate === true}
                                                                                onChange={(e) => handleFieldChange('vacsUpToDate', e.target.checked)}
                                                                            />
                                                                            <span>{editedAdvert.vacsUpToDate ? "Up to date" : "Not up to date"}</span>
                                                                        </label>
                                                                    ) : (
                                                                        <span className="advert-view-status-value">
                                                                            {advert.vacsUpToDate === true ? (
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> Up to date</span>
                                                                            ) : advert.vacsUpToDate === false ? (
                                                                                <span className="advert-view-status-badge negative"><FaTimesCircle /> Not up to date</span>
                                                                            ) : (
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> N/A</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="advert-view-status-item">
                                                                    <span className="advert-view-status-label"><FaBug /> Flea/Worm:</span>
                                                                    {isEditMode ? (
                                                                        <label className="advert-view-checkbox-label">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editedAdvert.fleaWormed === true}
                                                                                onChange={(e) => handleFieldChange('fleaWormed', e.target.checked)}
                                                                            />
                                                                            <span>{editedAdvert.fleaWormed ? "Yes" : "No"}</span>
                                                                        </label>
                                                                    ) : (
                                                                        <span className="advert-view-status-value">
                                                                            {advert.fleaWormed === true ? (
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> Yes</span>
                                                                            ) : advert.fleaWormed === false ? (
                                                                                <span className="advert-view-status-badge negative"><FaTimesCircle /> No</span>
                                                                            ) : (
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> N/A</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="advert-view-status-item">
                                                                    <span className="advert-view-status-label"><FaMedal /> Proven Stud:</span>
                                                                    {isEditMode ? (
                                                                        <label className="advert-view-checkbox-label">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editedAdvert.proven || false}
                                                                                onChange={(e) => handleFieldChange('proven', e.target.checked)}
                                                                            />
                                                                            <span>{editedAdvert.proven ? "Yes" : "No"}</span>
                                                                        </label>
                                                                    ) : (
                                                                        <span className="advert-view-status-value">
                                                                            {advert.proven ?
                                                                                <span className="advert-view-status-badge positive"><FaCheckCircle /> Yes</span> :
                                                                                <span className="advert-view-status-badge negative"><FaTimesCircle /> No</span>
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {advert.healthChecks?.length > 0 && (
                                                            <div className="advert-view-detail-section">
                                                                <h3 className="advert-view-section-heading"><FaVial /> Health Checks</h3>
                                                                <div className="advert-view-tags-container">
                                                                    {advert.healthChecks.map((check, idx) => (
                                                                        <span key={idx} className="advert-view-tag advert-view-health-check-tag">{check}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {(advert.facebookUrl || advert.instagramUrl || isEditMode) && (
                                                            <div className="advert-view-detail-section">
                                                                <h3 className="advert-view-section-heading"><FaShare /> Social Media</h3>
                                                                {isEditMode ? (
                                                                    <div>
                                                                        <div className="advert-view-detail-item">
                                                                            <FaFacebook className="advert-view-detail-icon" />
                                                                            <span className="advert-view-detail-label">Facebook:</span>
                                                                            <input
                                                                                type="text"
                                                                                className="advert-view-edit-input"
                                                                                value={editedAdvert.facebookUrl || ""}
                                                                                onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
                                                                                placeholder="Facebook URL"
                                                                            />
                                                                        </div>
                                                                        <div className="advert-view-detail-item">
                                                                            <FaInstagram className="advert-view-detail-icon" />
                                                                            <span className="advert-view-detail-label">Instagram:</span>
                                                                            <input
                                                                                type="text"
                                                                                className="advert-view-edit-input"
                                                                                value={editedAdvert.instagramUrl || ""}
                                                                                onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
                                                                                placeholder="Instagram URL"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="advert-view-social-buttons">
                                                                        {advert.facebookUrl && (
                                                                            <a
                                                                                href={advert.facebookUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="advert-view-social-button facebook"
                                                                            >
                                                                                <FaFacebook /> Facebook
                                                                            </a>
                                                                        )}
                                                                        {advert.instagramUrl && (
                                                                            <a
                                                                                href={advert.instagramUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="advert-view-social-button instagram"
                                                                            >
                                                                                <FaInstagram /> Instagram
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Owner Section */}
                                    {activeSection === "owner" && (
                                        <div className="advert-view-panel">
                                            <div className="advert-view-panel-header">
                                                <h2 className="advert-view-panel-title">
                                                    <FaUserAlt /> Owner Information
                                                </h2>
                                                <div className="advert-view-owner-actions">
                                                    <button
                                                        className="advert-view-icon-button"
                                                        onClick={copyOwnerContact}
                                                        disabled={!ownerInfo}
                                                        title="Copy owner contact information to clipboard"
                                                    >
                                                        <FaClipboard /> Copy Contact
                                                    </button>
                                                    <button
                                                        className="advert-view-icon-button"
                                                        onClick={() => setShowNotesModal(true)}
                                                        disabled={!ownerInfo}
                                                        title="Shortcut: Press 'N'"
                                                    >
                                                        <FaComment /> Notes {noteCount > 0 && `(${noteCount})`}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="advert-view-panel-content">
                                                {ownerInfo ? (
                                                    <div className="advert-view-owner-profile">
                                                        <div className="advert-view-owner-header">
                                                            <div className="advert-view-owner-avatar">
                                                                {ownerInfo.avatar ? (
                                                                    <img src={ownerInfo.avatar} alt="Owner" className="advert-view-avatar-image" />
                                                                ) : (
                                                                    <div className="advert-view-default-avatar">
                                                                        <FaUserAlt />
                                                                    </div>
                                                                )}
                                                                <div
                                                                    className={`advert-view-status-dot ${ownerInfo.blacklisted ? "blacklisted" : "active"}`}
                                                                    title={ownerInfo.blacklisted ? "Blacklisted" : "Active"}
                                                                ></div>
                                                            </div>

                                                            <div className="advert-view-owner-basic-info">
                                                                <h3 className="advert-view-owner-name">{ownerInfo.firstName} {ownerInfo.lastName}</h3>
                                                                <p className="advert-view-owner-joined">
                                                                    <FaRegCalendarAlt /> Joined: {ownerInfo.createdAt ? new Date(ownerInfo.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                                                                </p>
                                                                <div className="advert-view-owner-id">ID: {ownerInfo.uid}</div>

                                                                <div className="advert-view-owner-stats">
                                                                    <div className="advert-view-stat-box">
                                                                        <span className="advert-view-stat-number">{ownerAds.length || 0}</span>
                                                                        <span className="advert-view-stat-label">Active Ads</span>
                                                                    </div>
                                                                    {ownerInfo.advertCount && (
                                                                        <div className="advert-view-stat-box">
                                                                            <span className="advert-view-stat-number">{ownerInfo.advertCount}</span>
                                                                            <span className="advert-view-stat-label">Total Ads</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="advert-view-owner-details">
                                                            <div className="advert-view-contact-section">
                                                                <h4 className="advert-view-section-title">
                                                                    <FaEnvelope /> Contact Information
                                                                </h4>
                                                                <div className="advert-view-contact-item">
                                                                    <FaEnvelope className="advert-view-contact-icon" />
                                                                    <span className="advert-view-contact-value">{ownerInfo.email}</span>
                                                                </div>
                                                                <div className="advert-view-contact-item">
                                                                    <FaPhone className="advert-view-contact-icon" />
                                                                    <span className="advert-view-contact-value">{ownerInfo.phone || "Not provided"}</span>
                                                                </div>
                                                                <div className="advert-view-contact-item">
                                                                    <FaHome className="advert-view-contact-icon" />
                                                                    <span className="advert-view-contact-value">
                                                                        {ownerInfo.address1}, {ownerInfo.city}, {ownerInfo.postcode}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="advert-view-owner-actions">
                                                                <Link to={`/admin/user/${ownerInfo.uid}`} className="advert-view-action-button view-profile">
                                                                    <FaUserAlt /> View Full Profile
                                                                </Link>

                                                                <button
                                                                    className={`advert-view-action-button blacklist ${ownerInfo.blacklisted ? "active" : ""}`}
                                                                    onClick={handleToggleBlacklist}
                                                                >
                                                                    <FaExclamationTriangle /> {ownerInfo.blacklisted ? "Unblacklist" : "Blacklist"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="advert-view-no-owner-info">
                                                        <FaUserAlt className="advert-view-no-data-icon" />
                                                        <p>Owner information not available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Updates Section */}
                                    {activeSection === "updates" && (
                                        <div className="advert-view-panel">
                                            <div className="advert-view-panel-header">
                                                <h2 className="advert-view-panel-title">
                                                    <FaReply /> Updates and Communication
                                                </h2>
                                                <div className="advert-view-updates-actions">
                                                    <div className="advert-view-quick-reply-dropdown">
                                                        <button className="advert-view-dropdown-toggle">
                                                            <FaReply /> Quick Replies
                                                        </button>
                                                        <div className="advert-view-dropdown-menu">
                                                            <button
                                                                onClick={() => handleQuickReply("Thank you for the update. Your advert is under review.")}
                                                                className="advert-view-dropdown-item"
                                                            >
                                                                Under Review
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickReply("Please provide additional details about health records.")}
                                                                className="advert-view-dropdown-item"
                                                            >
                                                                Request Health Info
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickReply("We need better quality images. Please upload clearer photos.")}
                                                                className="advert-view-dropdown-item"
                                                            >
                                                                Request Better Images
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="advert-view-panel-content">
                                                {updates.length > 0 ? (
                                                    <div className="advert-view-updates-list">
                                                        {updates.map(update => (
                                                            <div key={update.id} className="advert-view-update-item">
                                                                <div className="advert-view-update-content">
                                                                    <p className="advert-view-update-text">{update.text}</p>
                                                                    <span className="advert-view-update-timestamp">
                                                                        {update.createdAt?.toDate().toLocaleString() || 'Recent'}
                                                                    </span>
                                                                </div>
                                                                <form onSubmit={e => handleReplySubmit(e, update.id)} className="advert-view-reply-form">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Reply to this update..."
                                                                        value={replyTexts[update.id] || ""}
                                                                        onChange={e => setReplyTexts(prev => ({ ...prev, [update.id]: e.target.value }))}
                                                                        required
                                                                        className="advert-view-reply-input"
                                                                    />
                                                                    <button type="submit" className="advert-view-reply-button">
                                                                        <FaReply /> Reply
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="advert-view-no-updates">
                                                        <FaEnvelopeOpen className="advert-view-no-data-icon" />
                                                        <p>No updates or messages from the owner</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Sidebar */}
                                <div className="advert-view-sidebar">
                                    <div className="advert-view-sidebar-section advert-view-quick-summary">
                                        <h3 className="advert-view-sidebar-heading">
                                            <FaInfoCircle /> Quick Summary
                                        </h3>
                                        <div className="advert-view-sidebar-content">
                                            {advert.name && (
                                                <div className="advert-view-summary-item">
                                                    <FaPaw className="advert-view-summary-icon" />
                                                    <span className="advert-view-summary-label">Pet:</span>
                                                    <span className="advert-view-summary-value">{advert.name}</span>
                                                </div>
                                            )}

                                            <div className="advert-view-summary-item">
                                                <FaPalette className="advert-view-summary-icon" />
                                                <span className="advert-view-summary-label">Breed:</span>
                                                <span className="advert-view-summary-value">{advert.breedOrType || "Not specified"}</span>
                                            </div>
                                            <div className="advert-view-summary-item">
                                                <FaPoundSign className="advert-view-summary-icon" />
                                                <span className="advert-view-summary-label">Fee:</span>
                                                <span className="advert-view-summary-value">£{advert.price || "0"}</span>
                                            </div>
                                            <div className="advert-view-summary-item">
                                                <FaMapMarkerAlt className="advert-view-summary-icon" />
                                                <span className="advert-view-summary-label">Location:</span>
                                                <span className="advert-view-summary-value">
                                                    {(ownerInfo?.city && ownerInfo?.county)
                                                        ? `${ownerInfo.city}, ${ownerInfo.county}`
                                                        : ownerInfo?.city || ownerInfo?.county || "Not specified"}
                                                </span>
                                            </div>

                                            <div className="advert-view-summary-divider"></div>

                                            {ownerInfo && (
                                                <>
                                                    <div className="advert-view-summary-item">
                                                        <FaUserAlt className="advert-view-summary-icon" />
                                                        <span className="advert-view-summary-label">Owner:</span>
                                                        <span className="advert-view-summary-value">{ownerInfo.firstName} {ownerInfo.lastName}</span>
                                                    </div>
                                                    <div className="advert-view-summary-item">
                                                        <FaPhone className="advert-view-summary-icon" />
                                                        <span className="advert-view-summary-label">Phone:</span>
                                                        <span className="advert-view-summary-value">{ownerInfo.phone || "No phone"}</span>
                                                    </div>
                                                    <div className="advert-view-summary-item">
                                                        <FaAd className="advert-view-summary-icon" />
                                                        <span className="advert-view-summary-label">Advert</span>
                                                        <span className="advert-view-summary-value">{advert.intent || "Not specified"}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="advert-view-sidebar-section advert-view-quick-actions">
                                        <h3 className="advert-view-sidebar-heading">
                                            <FaList /> Quick Actions
                                        </h3>
                                        <div className="advert-view-action-buttons">
                                            {!isEditMode ? (
                                                <>
                                                    <button
                                                        className="advert-view-sidebar-action-button edit"
                                                        onClick={handleEditToggle}
                                                        disabled={isProcessing}
                                                        title="Shortcut: Press 'E'"
                                                    >
                                                        <FaEdit /> Edit Advert
                                                    </button>

                                                    <button
                                                        className="advert-view-sidebar-action-button approve"
                                                        onClick={handleApprove}
                                                        disabled={isProcessing}
                                                        title="Shortcut: Press 'A'"
                                                    >
                                                        <FaThumbsUp /> Approve Advert
                                                    </button>

                                                    <button
                                                        className="advert-view-sidebar-action-button reject"
                                                        onClick={() => setShowRejectBox(true)}
                                                        disabled={isProcessing || showRejectBox}
                                                        title="Shortcut: Press 'R'"
                                                    >
                                                        <FaThumbsDown /> Reject Advert
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="advert-view-sidebar-action-button save"
                                                        onClick={handleSaveChanges}
                                                        disabled={isSaving || !hasChanges}
                                                    >
                                                        <FaSave /> Save Changes
                                                    </button>

                                                    <button
                                                        className="advert-view-sidebar-action-button cancel"
                                                        onClick={handleCancelEdit}
                                                        disabled={isSaving}
                                                    >
                                                        <FaTimes /> Cancel Edit
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                className="advert-view-sidebar-action-button pause"
                                                onClick={handleTogglePause}
                                                disabled={isProcessing}
                                            >
                                                {advert?.paused ? (
                                                    <>
                                                        <FaThumbsUp /> Unpause Advert
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPause /> Pause Advert
                                                    </>
                                                )}
                                            </button>

                                            {ownerInfo && (
                                                <button
                                                    className="advert-view-sidebar-action-button notes"
                                                    onClick={() => setShowNotesModal(true)}
                                                    title="Shortcut: Press 'N'"
                                                >
                                                    <FaComment /> Owner Notes {noteCount > 0 && `(${noteCount})`}
                                                </button>
                                            )}

                                            <button className="advert-view-sidebar-action-button flag">
                                                <FaFlag /> Flag for Review
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full-size image modal */}
                        {showFullImage && advert?.images && advert.images.length > 0 && (
                            <div className="advert-view-modal-backdrop" onClick={toggleFullImage}>
                                <div className="advert-view-modal-content advert-view-image-modal-content" onClick={e => e.stopPropagation()}>
                                    <button className="advert-view-modal-close" onClick={toggleFullImage}>
                                        <FaTimes />
                                    </button>
                                    <img
                                        src={advert.images[activeImageIndex]}
                                        alt={`Full size view of ${advert.name || 'pet'}`}
                                        className="advert-view-modal-image"
                                    />
                                    <div className="advert-view-modal-image-controls">
                                        <button
                                            className="advert-view-image-nav-button prev"
                                            disabled={activeImageIndex === 0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeImageIndex > 0) setActiveImageIndex(activeImageIndex - 1);
                                            }}
                                        >
                                            <FaArrowLeft />
                                        </button>
                                        <span className="advert-view-image-counter">{activeImageIndex + 1} / {advert.images.length}</span>
                                        <button
                                            className="advert-view-image-nav-button next"
                                            disabled={activeImageIndex === advert.images.length - 1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeImageIndex < advert.images.length - 1) setActiveImageIndex(activeImageIndex + 1);
                                            }}
                                        >
                                            <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rejection modal */}
                        {showRejectBox && (
                            <div className="advert-view-modal-backdrop">
                                <div className="advert-view-modal-content advert-view-reject-modal">
                                    <div className="advert-view-modal-header">
                                        <h3 className="advert-view-modal-title">Reject Advert</h3>
                                        <button className="advert-view-modal-close" onClick={() => setShowRejectBox(false)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <div className="advert-view-modal-body">
                                        <div className="advert-view-template-section">
                                            <h4 className="advert-view-template-heading">Rejection Templates</h4>
                                            <div className="advert-view-template-buttons">
                                                {rejectTemplates.map((template, index) => (
                                                    <button
                                                        key={index}
                                                        className="advert-view-template-button"
                                                        onClick={() => applyRejectTemplate(template)}
                                                    >
                                                        {template.substring(0, 30)}...
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="advert-view-reject-reason-container">
                                            <label htmlFor="reject-reason" className="advert-view-reject-label">Rejection Reason:</label>
                                            <textarea
                                                id="reject-reason"
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Enter detailed reason for rejecting this advert..."
                                                className="advert-view-reject-textarea"
                                                rows={4}
                                            />
                                            <p className="advert-view-reject-info">
                                                This information will be sent to the owner of the advert.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="advert-view-modal-footer">
                                        <button
                                            onClick={() => setShowRejectBox(false)}
                                            className="advert-view-modal-button advert-view-cancel-button"
                                            disabled={isProcessing}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="advert-view-modal-button advert-view-confirm-button"
                                            disabled={!rejectReason.trim() || isProcessing}
                                        >
                                            <FaThumbsDown /> Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="advert-view-not-found-message">
                        <FaExclamationTriangle className="advert-view-not-found-icon" />
                        <h2>Advert Not Found</h2>
                        <p>The advert you're looking for may have been deleted or moved.</p>
                        <button onClick={() => navigate('/admin')} className="advert-view-back-button">
                            <FaArrowLeft /> Return to Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Admin Notes Modal */}
            {showNotesModal && ownerInfo && (
                <AdminNotesModal
                    userId={advert.ownerId}
                    adminName={userData?.firstName || "Admin"}
                    onClose={() => setShowNotesModal(false)}
                />
            )}
        </div>
    );
}