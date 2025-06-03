import React, { useEffect, useState } from "react";
import "./AdvertDetails.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { updateDoc, increment } from "firebase/firestore";
import FollowButton from '../components/FollowButton';
import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
    setDoc,
    deleteDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheckCircle,
    faSearch,
    faEye,
    faPenToSquare,
    faEnvelopeOpenText,
    faStar as solidStar,
    faChevronLeft,
    faChevronRight,
    faMapMarkerAlt,
    faUser,
    faDna,
    faClock,
    faDog,
    faClipboardList,
    faCalendarAlt,
    faPoundSign,
    faRuler,
    faWeight,
    faInfoCircle,
    faSyringe,
    faLayerGroup,
    faPalette,
    faCertificate,
    faPhone,
    faMicrochip,
    faHome,
    faBuilding,
    faStethoscope,
    faHeart as fasHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookSquare, faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { faStar as regularStar, faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";
import { auth } from "../firebase/firebaseAuth";
import AdvertUpdates from "../components/AdvertUpdates";
import "../components/AdvertUpdates.css";
import SimilarStuds from "../components/SimilarStuds";
import { useLoginModal } from "../context/LoginContext";

// If you don't want to pull in date-fns, here's a quick helper:
function calculateAge(dob) {
    const birth = dob.toDate ? dob.toDate() : new Date(dob);
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff); // epoch at diff ms
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Helper function to format member since date
function formatMemberSince(timestamp) {
    if (!timestamp) return null;

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
}

// Helper function to format last active
function formatLastActive(timestamp) {
    if (!timestamp) return "Unknown";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 5) {
        return "Online now";
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }
}

function AdvertDetails() {
    const { id } = useParams();
    const { openLogin } = useLoginModal();

    console.log("🔍 Advert ID:", id);

    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [ownerName, setOwnerName] = useState("");
    const [ownerLocation, setOwnerLocation] = useState("");
    const [ownerPhone, setOwnerPhone] = useState(""); // Added state for phone number
    const [ownerMemberSince, setOwnerMemberSince] = useState(null);
    const [ownerLastActive, setOwnerLastActive] = useState(null);
    const [ownerBreederType, setOwnerBreederType] = useState(""); // Added state for breeder type
    const [averageRating, setAverageRating] = useState(null);
    const navigate = useNavigate();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviewAspects, setReviewAspects] = useState([]);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isArrowTapped, setIsArrowTapped] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportComments, setReportComments] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [healthTestsExpanded, setHealthTestsExpanded] = useState(false);
    const currentUser = auth.currentUser;
    const [updatesCount, setUpdatesCount] = useState(null); // Changed from 0 to null to track loading state
    const [isFavorite, setIsFavorite] = useState(false);
    const [ownerAvatar, setOwnerAvatar] = useState("");
    const [totalAdverts, setTotalAdverts] = useState(0);
    const [councilRating, setCouncilRating] = useState(4); // Mock data - rating from 1-5
    const [ownerLicenceNumber, setOwnerLicenceNumber] = useState(""); // ADD THIS
    const [ownerLocalAuthority, setOwnerLocalAuthority] = useState(""); // ADD THIS
    const [currentUserFullData, setCurrentUserFullData] = useState(null);
    const handleMessageOwner = () => {
        const currentUser = auth.currentUser;
        if (!currentUser || !advert?.ownerId) {
            alert("Please log in to message the owner.");
            return;
        }

        // include the advert title as a query-param
        navigate(
            `/messages?recipient=${advert.ownerId}` +
            `&advert=${advert.id}` +                                // ← include advert ID
            `&title=${encodeURIComponent(advert.title)}`
        );
    }

    const AdvertDetails = ({ advert }) => {
        console.log('Advert intent:', advert?.intent);

        return (
            <div className="advert-details-wrapper">
                <AdvertHeader data={advert} />

                {advert?.intent?.toLowerCase() !== 'stud' && (
                    <section className="updates-section desktop-only">
                        <AdvertUpdates advertId={advert.id} ownerId={advert.ownerId} />
                    </section>
                )}

                <AdvertFooter />
            </div>
        );
    };



    const [userData, setUserData] = useState({});

    // Check if advert is favorited
    useEffect(() => {
        if (!currentUser || !advert?.id) return;

        const checkFavorite = async () => {
            try {
                const favDoc = await getDoc(doc(db, "users", currentUser.uid, "favourites", advert.id));
                setIsFavorite(favDoc.exists());
            } catch (error) {
                console.error("Error checking favorite status:", error);
            }
        };

        checkFavorite();
    }, [currentUser, advert?.id]);

    // Toggle favorite function
    // In AdvertDetails.js, update the toggleFavorite function:
    // Toggle favorite function
    const toggleFavorite = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please log in to add favorites");
            return;
        }

        try {
            const favRef = doc(db, "users", currentUser.uid, "favourites", advert.id);
            const countRef = doc(db, "favoritesCounts", advert.id);

            if (isFavorite) {
                // Remove favorite
                await deleteDoc(favRef);
                setIsFavorite(false);

                // Update count in favoritesCounts collection
                try {
                    const countDoc = await getDoc(countRef);
                    if (countDoc.exists()) {
                        const currentCount = countDoc.data().count || 0;
                        if (currentCount > 1) {
                            await updateDoc(countRef, {
                                count: increment(-1)
                            });
                        } else {
                            // Delete the document if count would be 0
                            await deleteDoc(countRef);
                        }
                    }
                } catch (error) {
                    console.log("Could not update favorite count:", error);
                }
            } else {
                // Add favorite
                await setDoc(favRef, {
                    advertId: advert.id,
                    addedAt: serverTimestamp()
                });
                setIsFavorite(true);

                // Update count in favoritesCounts collection
                try {
                    const countDoc = await getDoc(countRef);
                    if (countDoc.exists()) {
                        await updateDoc(countRef, {
                            count: increment(1)
                        });
                    } else {
                        // Initialize if doesn't exist
                        await setDoc(countRef, {
                            count: 1,
                            advertId: advert.id,
                            createdAt: serverTimestamp()
                        });
                    }
                } catch (error) {
                    console.log("Could not update favorite count:", error);
                }
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            alert("Failed to update favorite. Please try again.");
        }
    };



    const getIpAddress = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return "Unknown";
        }
    };

    // Define the six checkbox options
    const aspectOptions = [
        "Handler Professionalism",
        "Communication",
        "On Time (If Mobile)",
        "Aftercare Advice",
        "Pet as Described"
    ];

    useEffect(() => {
        const fetchAdvert = async () => {
            if (!id) {
                console.error("Missing advert ID.");
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, "allListings", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let reorderedImages = data.images || [];
                    if (typeof data.mainImageIndex === 'number' && reorderedImages[data.mainImageIndex]) {
                        const mainImg = reorderedImages[data.mainImageIndex];
                        reorderedImages = [
                            mainImg,
                            ...reorderedImages.filter((_, i) => i !== data.mainImageIndex)
                        ];
                    }

                    setAdvert({ id: docSnap.id, ...data, images: reorderedImages });
                    setSelectedImage(reorderedImages[0]);
                    setCurrentIndex(0);

                    setSelectedImage(data.images?.[data.mainImageIndex || 0]);
                    setCurrentIndex(data.mainImageIndex || 0);

                    const userRef = doc(db, "users", data.ownerId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const {
                            firstName,
                            lastName,
                            city,
                            postcode,
                            phone,
                            showPhoneOnAdverts,
                            createdAt,
                            lastSeen,
                            breederType,
                            avatar,
                            licenceNumber,      // ADD THIS
                            localAuthority      // ADD THIS
                        } = userSnap.data();

                        setOwnerName(`${firstName} ${lastName?.charAt(0) || ""}.`);
                        setOwnerLocation(
                            `${city || ""}${city && postcode ? ", " : ""}${postcode || ""}`
                        );

                        // Set member since and last active
                        setOwnerMemberSince(createdAt);
                        setOwnerLastActive(lastSeen);

                        // Set breeder type
                        setOwnerBreederType(breederType || "");
                        setOwnerAvatar(avatar || "");

                        // ADD THIS BLOCK - Set licence information for licensed breeders
                        if (breederType === "licensed") {
                            setOwnerLicenceNumber(licenceNumber || "");
                            setOwnerLocalAuthority(localAuthority || "");
                        }

                        // ✅ Only show phone if logged in AND owner opted in
                        if (auth.currentUser && showPhoneOnAdverts === true) {
                            setOwnerPhone(phone || "");
                        } else {
                            setOwnerPhone(""); // Hides phone
                        }
                    }



                    const reviewsRef = collection(db, "reviews");
                    const ratingQuery = query(
                        reviewsRef,
                        where("advertId", "==", id),
                        where("approved", "==", true)
                    );
                    const snapshot = await getDocs(ratingQuery);
                    const ratings = snapshot.docs.map(d => d.data().rating || 0);
                    if (ratings.length) {
                        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                        setAverageRating(avg);
                    } else {
                        setAverageRating(null);
                    }
                } else {
                    setAdvert(null); // ensures "Advert not found" shows
                }
            } catch (err) {
                console.error("Error fetching advert:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdvert();
    }, [id]);

    useEffect(() => {
        if (advert?.id) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [advert?.id]);

    // ✅ Increment views only after advert is loaded
    useEffect(() => {
        if (!advert?.id) return;

        const viewedKey = `viewed_${advert.id}`;
        if (sessionStorage.getItem(viewedKey)) return;

        const incrementViews = async () => {
            try {
                // Always point at allListings now
                const adRef = doc(db, "allListings", advert.id);
                await updateDoc(adRef, {
                    views: increment(1)
                });
                sessionStorage.setItem(viewedKey, "true");
            } catch (err) {
                console.error("Failed to increment views:", err);
            }
        };

        incrementViews();
    }, [advert]);

    useEffect(() => {
        const fetchCurrentUserData = async () => {
            console.log("🔍 fetchCurrentUserData called, currentUser:", currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUserFullData(userData);
                        console.log("✅ Current user data loaded:", userData);
                    } else {
                        console.log("❌ User document does not exist");
                    }
                } catch (error) {
                    console.error("❌ Error fetching current user data:", error);
                }
            } else {
                console.log("⚠️ No current user");
            }
        };

        fetchCurrentUserData();
    }, [currentUser]);

    const submitReview = async () => {
        try {
            if (!advert) {
                alert("Advert data not available!");
                return;
            }
            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Please log in before leaving a review.");
                return;
            }
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                alert("User data not found!");
                return;
            }
            const { firstName, lastName, avatar } = userSnap.data();
            const reviewerName = `${firstName} ${lastName?.charAt(0) || ""}.`;
            const reviewerAvatar = avatar || "";
            const ipAddress = await getIpAddress();

            await addDoc(collection(db, "reviews"), {
                advertId: advert.id,
                reviewerId: currentUser.uid,
                reviewerName,
                reviewerAvatar,
                rating,
                ipAddress,
                text: reviewText.trim(),
                aspects: reviewAspects,
                approved: false,
                createdAt: serverTimestamp(),
                ownerId: advert.ownerId,
            });

            alert("Review submitted!");
            setShowReviewModal(false);
            setRating(0);
            setReviewText("");
            setReviewAspects([]);
        } catch (err) {
            console.error("Review failed:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    // Function to handle touch events for swipe
    const handleTouch = () => {
        // This is just a placeholder function to handle touch events
        // It's referenced in the JSX but not defined in your code
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading advert...</p>
        </div>
    );

    if (!advert) return (
        <div className="not-found-container">
            <div className="not-found-icon">🐾</div>
            <p>Advert not found.</p>
            <button className="back-button" onClick={() => navigate("/browse")}>
                Return to Browse
            </button>
        </div>
    );

    const handleSwipe = () => {
        if (isArrowTapped) {
            setIsArrowTapped(false); // reset
            return; // ✅ skip swipe if an arrow was just tapped
        }

        if (!advert?.images?.length) return;

        const swipeDistance = touchStartX - touchEndX;
        const threshold = 50;

        if (swipeDistance > threshold && currentIndex < advert.images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedImage(advert.images[currentIndex + 1]);
        } else if (swipeDistance < -threshold && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedImage(advert.images[currentIndex - 1]);
        }

        setTouchStartX(0);
        setTouchEndX(0);
    };

    const handlePrevImage = () => {
        setIsArrowTapped(true); // ✅ prevent swipe after click
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedImage(advert.images[currentIndex - 1]);
        }
    };

    const handleNextImage = () => {
        setIsArrowTapped(true); // ✅ prevent swipe after click
        if (currentIndex < advert.images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedImage(advert.images[currentIndex + 1]);
        }
    };

    // Safely read breed/type
    const breedLabel = advert.breedOrType || advert.breed || "—";

    // Color depends on category
    const colorValue =
        advert.dogColor ||
        advert.catColor ||
        advert.otherColor ||
        null;

    // Fee vs price
    const feeValue = advert.fee ?? advert.price ?? "N/A";

    // Age from dob
// Age from dob
    let ageValue = null;

    if (advert?.dob) {
        const birth = new Date(advert.dob);
        const now = new Date();
        const diffMs = now - birth;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            ageValue = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else if (diffDays < 60) {
            const weeks = Math.floor(diffDays / 7);
            ageValue = `${weeks} week${weeks !== 1 ? "s" : ""}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30.44);
            ageValue = `${months} month${months !== 1 ? "s" : ""}`;
        } else {
            let years = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                years--;
            }
            ageValue = `${years} year${years !== 1 ? "s" : ""}`;
        }
    }


    // Inside your component, before `return(...)`
    const hasHealthTests =
        Array.isArray(advert.healthTests) && advert.healthTests.length > 0;

    function formatDate(value) {
        if (!value) return null;

        try {
            const date = value.toDate ? value.toDate() : new Date(value);
            if (isNaN(date.getTime())) return null;

            return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch {
            return null;
        }
    }
    return (
        <div className="stud-details-container">
            <div className="stud-details-layout">
                {/* LEFT COLUMN */}
                <div className="left-column">
                    {/* Breadcrumb and Title Section */}
                    <div className="breadcrumb-section">
                        <button
                            className={`advert-details-favorite ${isFavorite ? "active" : ""}`}
                            onClick={toggleFavorite}
                            aria-label="Toggle Favorite"
                        >
                            <FontAwesomeIcon icon={isFavorite ? fasHeart : farHeart} />
                        </button>
                        <h1 className="page-title">{advert.title}</h1>

                        <nav className="breadcrumb-nav">
                            <Link to="/" className="breadcrumb-link">Home</Link>
                            <span className="breadcrumb-separator">»</span>
                            <Link to="/browse" className="breadcrumb-link">Browse</Link>
                            <span className="breadcrumb-separator">»</span>
                            <Link to={`/browse?category=${advert.category === 'dog' ? 'dogs' : advert.category === 'cat' ? 'cats' : advert.category}`} className="breadcrumb-link">
                                {advert.category ?
                                    (advert.category === 'dog' ? 'Dogs' :
                                        advert.category === 'cat' ? 'Cats' :
                                            advert.category === 'other' ? 'Others' :
                                                advert.category.charAt(0).toUpperCase() + advert.category.slice(1))
                                    : 'Pets'}
                            </Link>
                            <span className="breadcrumb-separator">»</span>
                            <Link to={`/browse?category=${advert.category === 'dog' ? 'dogs' : advert.category === 'cat' ? 'cats' : advert.category}&intent=${advert.intent}`} className="breadcrumb-link">
                                {advert.intent ? advert.intent.charAt(0).toUpperCase() + advert.intent.slice(1) : 'All'}
                            </Link>
                            {ownerLocation && (
                                <>
                                    <span className="breadcrumb-separator">»</span>
                                    <Link to={`/browse?location=${ownerLocation.split(',')[0].trim()}`} className="breadcrumb-link">
                                        {ownerLocation.split(',')[0].trim()}
                                    </Link>
                                </>
                            )}
                            {breedLabel && breedLabel !== "—" && (
                                <>
                                    <span className="breadcrumb-separator">»</span>
                                    <Link to={`/browse?category=${advert.category === 'dog' ? 'dogs' : advert.category === 'cat' ? 'cats' : advert.category}&breed=${encodeURIComponent(breedLabel)}`} className="breadcrumb-link">
                                        {breedLabel}
                                    </Link>
                                </>
                            )}

                        </nav>
                    </div>

                    <div className="gallery-section">
                        <div
                            className="main-image-container"
                            onTouchStart={(e) => { setTouchStartX(e.touches[0].clientX); handleTouch(); }}
                            onTouchMove={(e) => { setTouchEndX(e.touches[0].clientX); handleTouch(); }}
                            onTouchEnd={() => { handleSwipe(); handleTouch(); }}
                        >
                            <img src={selectedImage} alt={`${advert.name}`} className="main-image" />

                            {advert.images && advert.images.length > 1 && (
                                <>
                                    <button
                                        className={`nav-arrow prev ${currentIndex === 0 ? 'disabled' : ''}`}
                                        onClick={handlePrevImage}
                                        disabled={currentIndex === 0}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <button
                                        className={`nav-arrow next ${currentIndex === advert.images.length - 1 ? 'disabled' : ''}`}
                                        onClick={handleNextImage}
                                        disabled={currentIndex === advert.images.length - 1}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </>
                            )}

                            {/* Image counter */}
                            {advert.images && advert.images.length > 1 && (
                                <div className="image-counter">
                                    {currentIndex + 1} / {advert.images.length}
                                </div>
                            )}
                        </div>

                        <div className="thumbnails-container">
                            {advert.images?.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumbnail ${img === selectedImage ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedImage(img);
                                        setCurrentIndex(idx);
                                    }}
                                >
                                    <img src={img} alt={`${advert.name} - view ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="about-section">
                        <div className="name-price-header">
                            <div className="header-left">
                                <h1 className="advert-title">
                                    {advert.intent === 'sale' ?
                                        (advert.breedOrType || advert.breed || "Breed not specified") :
                                        (advert.name || "Name not specified")}
                                </h1>
                                <div className="published-date">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    <span>Published {formatDate(advert.createdAt)}</span>
                                    {/* ADD VIEW COUNT HERE */}
                                    <span className="view-count">
                <FontAwesomeIcon icon={faEye} />
                <span>{advert.views || 0} </span>
            </span>
                                </div>
                            </div>
                            <div className="price-badge">
                                <FontAwesomeIcon icon={faPoundSign} />
                                <span>{feeValue}</span>
                            </div>
                        </div>



                        <div className="description-content">
                            <p>{advert.description}</p>
                            <div className="advert-footer-info">
                                <div className="advert-id">ID: {advert.id}</div>
                                <div className="report-text">
                                    <small>
                                        Think this advert is inappropriate?{' '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (auth.currentUser) {
                                                    setShowReportModal(true);
                                                } else {
                                                    alert("Please log in to report this advert.");
                                                }
                                            }}
                                            className="report-link"
                                        >
                                            Report it here
                                        </a>.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="right-column">
                    {auth.currentUser?.uid !== advert.ownerId && (
                        <div className="action-section">
                            <button className="primary-button message-button" onClick={handleMessageOwner}>
                                <FontAwesomeIcon icon={faEnvelopeOpenText} />
                                Message Owner
                            </button>
                            {ownerPhone ? (
                                <a href={`tel:${ownerPhone}`} className="phone-link">
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faPhone} />
                                        <span>Call Owner</span>
                                    </div>
                                </a>
                            ) : (
                                <div className="phone-link disabled">
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faPhone} />
                                        <span>Phone number hidden</span>
                                    </div>
                                </div>
                            )}


                        </div>
                    )}

                    <div className="owner-info-wrapper">
                    <div className="info-card owner-card">

                        <h2>
                            <FontAwesomeIcon icon={faUser} className="card-icon" />
                            Owner Information
                        </h2>
                        <div className="owner-details">
                            <div className="owner-header">
                                <div className="owner-avatar">
                                    {ownerAvatar ? (
                                        <img src={ownerAvatar} alt={ownerName} />
                                    ) : (
                                        <div className="owner-avatar-placeholder">
                                            <FontAwesomeIcon icon={faUser} />
                                        </div>
                                    )}
                                </div>
                                <div className="owner-identity">
                                    <h3 className="owner-name">{ownerName || "N/A"}</h3>
                                    <div className="owner-details">
                                        <p className="owner-detail-item">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                                            {ownerLocation || "Location not specified"}
                                        </p>
                                        {ownerBreederType === "licensed" && ownerLicenceNumber && (
                                            <p className="owner-detail-item licence-info">
                                                <FontAwesomeIcon icon={faCertificate} />
                                                {ownerLicenceNumber}
                                            </p>
                                        )}
                                        {ownerBreederType === "licensed" && ownerLocalAuthority && (
                                            <p className="owner-detail-item authority-info">
                                                <FontAwesomeIcon icon={faBuilding} />
                                                {ownerLocalAuthority}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Remove the separate badge section */}

                            {ownerBreederType && (
                                <div className="owner-badge-section">
                                    <div className={`breeder-badge ${ownerBreederType === 'licensed' ? 'licensed' : 'hobby'}`}>
                                        <FontAwesomeIcon icon={faCertificate} className="badge-icon" />
                                        <span>{ownerBreederType === "licensed" ? "Licensed Breeder" : "Hobby Breeder"}</span>
                                    </div>
                                </div>
                            )}

                            <div className="owner-stats">
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Member Since</span>
                                        <span className="stat-value">{formatMemberSince(ownerMemberSince) || "Unknown"}</span>
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon active">
                                        <FontAwesomeIcon icon={faClock} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Last Active</span>
                                        <span className="stat-value">
                    {ownerLastActive && formatLastActive(ownerLastActive).includes("Online now") ? (
                        <span className="online-now">
                            <span className="online-dot"></span>
                            Online
                        </span>
                    ) : (
                        formatLastActive(ownerLastActive)
                    )}
                </span>
                                    </div>
                                </div>

                                {totalAdverts > 0 && (
                                    <div className="stat-item">
                                        <div className="stat-icon">
                                            <FontAwesomeIcon icon={faClipboardList} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-label">Active Adverts</span>
                                            <span className="stat-value">{totalAdverts}</span>
                                        </div>
                                    </div>
                                )}

                                {averageRating !== null && (
                                    <div className="stat-item">
                                        <div className="stat-icon">
                                            <FontAwesomeIcon icon={solidStar} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-label">Average Rating</span>
                                            <span className="stat-value">{averageRating.toFixed(1)} / 5.0</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Profile and Phone buttons side by side */}
                        <div className="owner-actions">
                            <Link to={`/profile/${advert.ownerId}`} className="profile-link">
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>View Profile</span>
                                </div>
                            </Link>

                            {/* Debug logging */}
                            {console.log("🔍 Follow Button Debug:", {
                                currentUser: !!currentUser,
                                currentUserFullData: !!currentUserFullData,
                                currentUserData: currentUserFullData,
                                currentUserId: currentUser?.uid,
                                advertOwnerId: advert.ownerId,
                                isOwnAdvert: currentUser?.uid === advert.ownerId,
                                ownerName: ownerName,
                                extractedFirstName: ownerName.split(' ')[0],
                                shouldShowFollowButton: currentUser && currentUserFullData && currentUser.uid !== advert.ownerId
                            })}

                            {/* Follow Button - only show if user is logged in and it's not their own advert */}
                            {currentUser && currentUserFullData && currentUser.uid !== advert.ownerId && (
                                <>
                                    {console.log("✅ Rendering FollowButton with props:", {
                                        targetUserId: advert.ownerId,
                                        currentUserId: currentUser.uid,
                                        targetUserName: ownerName.split(' ')[0],
                                        currentUserName: currentUserFullData.firstName
                                    })}
                                    <FollowButton
                                        targetUserId={advert.ownerId}
                                        currentUserId={currentUser.uid}
                                        targetUserName={ownerName.split(' ')[0]} // Extract first name from "FirstName L."
                                        currentUserName={currentUserFullData.firstName}
                                    />
                                </>
                            )}

                            {advert.intent !== 'sale' && (
                                <button
                                    className="secondary-button review-button"
                                    onClick={() => {
                                        if (auth.currentUser) {
                                            setShowReviewModal(true);
                                        } else {
                                            alert("Please log in to leave a review.");
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                    Review Stud
                                </button>
                            )}
                        </div>
                    </div>




                    </div>
                <div className="pet-card-wrapper">
                    <div className="info-card details-card">
                        <h2>
                            <FontAwesomeIcon icon={faClipboardList} />
                            Pet Details
                        </h2>
                        <div className="pet-details-wrapper">
                        <div className="pet-details-box">
                            <ul className="pet-details-list">
                                {breedLabel && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faDog} />
                                            <span>Breed / Type:</span>
                                        </div>
                                        <div className="pet-detail-value">{breedLabel}</div>
                                    </li>
                                )}
                                {advert.category && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faInfoCircle} />
                                            <span>Category:</span>
                                        </div>
                                        <div className="pet-detail-value">
                                            {advert.category.charAt(0).toUpperCase() + advert.category.slice(1)}
                                        </div>
                                    </li>
                                )}
                                {advert.quantity && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faLayerGroup} />
                                            <span>Available:</span>
                                        </div>
                                        <div className="pet-detail-value">{advert.quantity}</div>
                                    </li>
                                )}
                                {ageValue && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                            <span>Age:</span>
                                        </div>
                                        <div className="pet-detail-value">{ageValue}</div>
                                    </li>
                                )}
                                {advert.gender && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faDna} />
                                            <span>Boys/Girls:</span>
                                        </div>
                                        <div className="pet-detail-value">
                                            {advert.gender.charAt(0).toUpperCase() + advert.gender.slice(1)}
                                        </div>
                                    </li>
                                )}


                                {advert.availableDate && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faHome} />
                                            <span>Ready to Leave:</span>
                                        </div>
                                        <div className="pet-detail-value">
                                            {(() => {
                                                const availableDate = advert.availableDate.toDate ? advert.availableDate.toDate() : new Date(advert.availableDate);
                                                const now = new Date();
                                                now.setHours(0, 0, 0, 0);
                                                availableDate.setHours(0, 0, 0, 0);
                                                return availableDate <= now ? "Ready Now" : formatDate(advert.availableDate);
                                            })()}
                                        </div>
                                    </li>
                                )}
                                {colorValue && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faPalette} />
                                            <span>Colour:</span>
                                        </div>
                                        <div className="pet-detail-value">{colorValue}</div>
                                    </li>
                                )}
                                {advert.height && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faRuler} />
                                            <span>Height:</span>
                                        </div>
                                        <div className="pet-detail-value">{advert.height}</div>
                                    </li>
                                )}
                                {advert.weight && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faWeight} />
                                            <span>Weight:</span>
                                        </div>
                                        <div className="pet-detail-value">{advert.weight}</div>
                                    </li>
                                )}
                                {advert.neutered !== undefined && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Neutered/Spayed:</span>
                                        </div>
                                        <div className="pet-detail-value">{advert.neutered ? "Yes" : "No"}</div>
                                    </li>
                                )}
                                {advert.kcRegistered && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faCertificate} />
                                            <span>KC Registered:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.healthChecked && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faStethoscope} />
                                            <span>Health Checked:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.microchipped && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faMicrochip} />
                                            <span>Microchipped:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.vaccinated && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faSyringe} />
                                            <span>Vaccinated:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.wormed && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Wormed:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.fleaTreated && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Flea Treated:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.withMother && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>With Mother:</span>
                                        </div>
                                        <div className="pet-detail-value">Yes</div>
                                    </li>
                                )}
                                {advert.matings && (
                                    <li className="pet-detail-row">
                                        <div className="pet-detail-label">
                                            <FontAwesomeIcon icon={faLayerGroup} />
                                            <span>Matings:</span>
                                        </div>
                                        <div className="pet-detail-value">{advert.matings}</div>
                                    </li>
                                )}
                            </ul>

                        </div>
                        </div>

                        {/* INSERT KC NAME SECTION HERE - only show if kcRegistered is true */}
                        {advert.kcRegistered && advert.kcName && (
                            <div className="kc-name-section">
                                <h3>KC Registration Details</h3>
                                <div className="kc-name-display">
                                    <FontAwesomeIcon icon={faCertificate} className="kc-icon" />
                                    {auth.currentUser ? (
                                        <span>{advert.kcName}</span>
                                    ) : (
                                        <span className="login-prompt">
                                            <button
                                                className="login-button"
                                                onClick={openLogin}
                                            >
                                                Log in
                                            </button> to view KC name
                                        </span>
                                    )}
                                </div>
                                <div className="coi-link-container">
                                    <a
                                        href="https://www.thekennelclub.org.uk/search/inbreeding-co-efficient/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="coi-link"
                                    >
                                        <FontAwesomeIcon icon={faSearch} className="coi-icon" />
                                        Check COI at The Kennel Club
                                    </a>
                                    <div className="tooltip-container">
                                        <FontAwesomeIcon
                                            icon={faInfoCircle}
                                            className="info-icon"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.querySelector('#coiTooltip').classList.toggle('active');
                                                document.querySelector('#coiTooltipOverlay').classList.toggle('active');
                                                document.body.classList.toggle('tooltip-open');
                                            }}
                                            aria-label="Information about COI"
                                        />
                                    </div>
                                </div>
                                <div id="coiTooltipOverlay" className="tooltip-overlay" onClick={() => {
                                    document.querySelector('#coiTooltip').classList.remove('active');
                                    document.querySelector('#coiTooltipOverlay').classList.remove('active');
                                    document.body.classList.remove('tooltip-open');
                                }}></div>
                                <div id="coiTooltip" className="tooltip-text">
                                    <div className="tooltip-content">
                                        COI (Coefficient of Inbreeding) is a measure that helps breeders understand the genetic diversity of a dog. Lower values indicate greater genetic diversity and potentially fewer inherited health issues.<br/><br/>
                                        To perform a COI lookup at The Kennel Club website, you will need both the KC name shown in this advert and your dog's KC name or registration number.
                                    </div>
                                    <button
                                        className="close-tooltip"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.querySelector('#coiTooltip').classList.remove('active');
                                            document.querySelector('#coiTooltipOverlay').classList.remove('active');
                                            document.body.classList.remove('tooltip-open');
                                        }}
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Social Media Links */}
                        {(advert.facebookUrl || advert.instagramUrl || advert.tiktokUrl) && (
                            <div className="advert-social-links">
                                <h3>{`${advert.name}${advert.name.endsWith('s') ? "'" : "'s"} Social Media`}</h3>
                                <div className="advert-social-icons">
                                    {advert.facebookUrl && (
                                        <a
                                            href={advert.facebookUrl.startsWith("http") ? advert.facebookUrl : `https://${advert.facebookUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="advert-social-icon facebook"
                                        >
                                            <FontAwesomeIcon icon={faFacebookSquare} />
                                        </a>
                                    )}

                                    {advert.instagramUrl && (
                                        <a
                                            href={advert.instagramUrl.startsWith("http") ? advert.instagramUrl : `https://${advert.instagramUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="advert-social-icon instagram"
                                        >
                                            <FontAwesomeIcon icon={faInstagram} />
                                        </a>
                                    )}
                                    {advert.tiktokUrl && (
                                        <a
                                            href={advert.tiktokUrl.startsWith("http") ? advert.tiktokUrl : `https://${advert.tiktokUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="advert-social-icon tiktok"
                                        >
                                            <FontAwesomeIcon icon={faTiktok} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                    {hasHealthTests && (
                        <div className="info-card health-card">
                            <h2
                                className="expandable-header"
                                onClick={() => setHealthTestsExpanded(!healthTestsExpanded)}
                            >
                                <div className="header-left">
                                    <FontAwesomeIcon icon={faCheckCircle} className="card-icon" />
                                    Health Tests ({advert.healthTests.length})
                                </div>
                                <div className="header-right">
                                    <span className="expand-text">
                                        {healthTestsExpanded ? "Click to collapse" : "Click to expand"}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={healthTestsExpanded ? faChevronLeft : faChevronRight}
                                        className="expand-icon"
                                    />
                                </div>
                            </h2>
                            {healthTestsExpanded && (
                                <ul className="health-checks-list">
                                    {advert.healthTests.map((test, idx) => (
                                        <li key={idx} className="health-check-item">
                                            <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />
                                            {test}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowReviewModal(false)}>×</button>
                        <h2>Review {advert.name}</h2>

                        <div className="rating-selector">
                            <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`rating-star ${star <= rating ? "selected" : ""}`}
                                        onClick={() => setRating(star)}
                                    >
                                        <FontAwesomeIcon icon={star <= rating ? solidStar : regularStar} />
                                    </span>
                                ))}
                            </div>
                            <span className="rating-text">
                                {rating === 0 ? "Select a rating" :
                                    rating === 1 ? "Poor" :
                                        rating === 2 ? "Fair" :
                                            rating === 3 ? "Good" :
                                                rating === 4 ? "Very Good" : "Excellent"}
                            </span>
                        </div>

                        <p className="review-instructions">
                            Review should represent the stud dog as well as the stud handler.
                            Please check any boxes that are relevant to the service provided.
                        </p>

                        <div className="aspect-selection">
                            <h3>Service Aspects</h3>
                            <div className="aspects-grid">
                                {aspectOptions.map(option => (
                                    <label key={option} className="aspect-checkbox">
                                        <input
                                            type="checkbox"
                                            value={option}
                                            checked={reviewAspects.includes(option)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setReviewAspects(prev => [...prev, option]);
                                                } else {
                                                    setReviewAspects(prev => prev.filter(a => a !== option));
                                                }
                                            }}
                                        />
                                        <span className="checkbox-label">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="review-text-area">
                            <label htmlFor="review-text">Your Review</label>
                            <textarea
                                id="review-text"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Tell us about your experience with this stud service (min 100 characters)"
                                minLength={100}
                                maxLength={500}
                            />
                            <div className="char-count">
                                {reviewText.length}/500 characters
                                {reviewText.length < 100 &&
                                    <span className="char-warning">
                                        (Minimum 100 characters required)
                                    </span>
                                }
                            </div>
                        </div>

                        <button
                            className="submit-review-btn"
                            disabled={rating === 0 || reviewText.length < 100}
                            onClick={submitReview}
                        >
                            Submit Review
                        </button>
                    </div>
                </div>
            )}

            {/* Similar Adverts Section */}
            <SimilarStuds
                breedOrType={advert.breedOrType || advert.breed}
                intent={advert.intent}
                currentAdvertId={advert.id}
            />

            {/* Report Advert Section */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowReportModal(false)}>×</button>
                        <h2>Report Advert</h2>

                        <label htmlFor="reason">Reason for Reporting</label>
                        <select
                            id="reason"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            required
                        >
                            <option value="">Select a reason</option>
                            <option value="Inappropriate Content">Inappropriate Content</option>
                            <option value="Spam or Scam">Spam or Scam</option>
                            <option value="Fraudulent Advert">Fraudulent Advert</option>
                            <option value="Other">Other</option>
                        </select>

                        <label htmlFor="comments">Additional Comments (optional)</label>
                        <textarea
                            id="comments"
                            value={reportComments}
                            onChange={(e) => setReportComments(e.target.value)}
                            placeholder="Provide any additional details here..."
                        />

                        <button
                            className="submit-report-btn"
                            disabled={!reportReason || reportSubmitting}
                            onClick={async () => {
                                if (!reportReason) {
                                    alert("Please select a reason.");
                                    return;
                                }
                                setReportSubmitting(true);
                                try {
                                    await addDoc(collection(db, "advertReports"), {
                                        advertId: advert.id,
                                        ownerId: advert.ownerId,
                                        reporterId: currentUser.uid,
                                        reporterEmail: currentUser.email,
                                        reporterName: userData.firstName ? `${userData.firstName} ${userData.lastName || ""}`.trim() : "",
                                        reason: reportReason,
                                        comments: reportComments,
                                        createdAt: serverTimestamp(),
                                        status: "pending"
                                    });
                                    alert("Report submitted successfully.");
                                    setShowReportModal(false);
                                    setReportReason('');
                                    setReportComments('');
                                } catch (error) {
                                    console.error("Failed to submit report:", error);
                                    alert("Failed to submit report. Please try again later.");
                                } finally {
                                    setReportSubmitting(false);
                                }
                            }}
                        >
                            Submit Report
                        </button>
                    </div>
                </div>
            )}

            <footer className="advert-report-footer" style={{ display: 'none' }}>
                {/* Footer content removed - report link moved to description area */}
            </footer>


        </div>
    );
}

export default AdvertDetails;