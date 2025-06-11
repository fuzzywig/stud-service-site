import React, { useEffect, useState, useCallback } from "react";
import "./AdvertDetails.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { updateDoc, increment } from "firebase/firestore";
import SEO from '../components/SEO';
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
    faHandshake,
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
    faCat,
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
import { useLoginModal } from "../context/LoginContext";

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

// Helper function to format date
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

function AdvertDetails() {
    const { id } = useParams();
    const { openLogin } = useLoginModal();
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    console.log("🔍 Advert ID:", id);

    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [ownerName, setOwnerName] = useState("");
    const [ownerLocation, setOwnerLocation] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [ownerMemberSince, setOwnerMemberSince] = useState(null);
    const [ownerLastActive, setOwnerLastActive] = useState(null);
    const [ownerBreederType, setOwnerBreederType] = useState("");
    const [averageRating, setAverageRating] = useState(null);
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
    const [isFavorite, setIsFavorite] = useState(false);
    const [ownerAvatar, setOwnerAvatar] = useState("");
    const [totalAdverts, setTotalAdverts] = useState(0);
    const [ownerLicenceNumber, setOwnerLicenceNumber] = useState("");
    const [ownerLocalAuthority, setOwnerLocalAuthority] = useState("");
    const [currentUserFullData, setCurrentUserFullData] = useState(null);
    const [similarAds, setSimilarAds] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(true);
    const [similarUsersMap, setSimilarUsersMap] = useState({});
    const [similarRatingsMap, setSimilarRatingsMap] = useState({});
    const [userData, setUserData] = useState({});
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [viewStats, setViewStats] = useState({
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0
    });    const getSEOData = useCallback(() => {
        if (!advert) {
            return {
                title: "Pet Advert | My Pet Connect",
                description: "View this pet advert on My Pet Connect"
            };
        }

        const breedLabel = advert.breedOrType || advert.breed || "Pet";
        const title = `${advert.title || advert.name || breedLabel} — ${breedLabel} in ${ownerLocation || advert.location || "UK"}`;

        // Keep descriptions under ~160 characters
        const description = advert.description && advert.description.length > 160
            ? advert.description.slice(0, 157) + '…'
            : advert.description || `${breedLabel} available in ${ownerLocation || "UK"}`;

        return { title, description };
    }, [advert, ownerLocation]);

    const handleMessageOwner = useCallback(() => {
        if (!currentUser || !advert?.ownerId) {
            alert("Please log in to message the owner.");
            return;
        }

        navigate(
            `/messages?recipient=${advert.ownerId}` +
            `&advert=${advert.id}` +
            `&title=${encodeURIComponent(advert.title)}`
        );
    }, [currentUser, advert, navigate]);

    // REPLACE your existing trackDailyView function with this debug version:

    const trackDailyView = async (advertId) => {
        console.log("🔍 trackDailyView called for advertId:", advertId);

        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const viewDocId = `${advertId}_${today}`;
            const viewDocRef = doc(db, "advertViews", viewDocId);

            console.log("📅 Today's date:", today);
            console.log("📄 View document ID:", viewDocId);
            console.log("🔗 Document reference:", viewDocRef);

            const viewDoc = await getDoc(viewDocRef);
            console.log("📖 Existing document exists?", viewDoc.exists());

            if (viewDoc.exists()) {
                console.log("📈 Incrementing existing view count...");
                console.log("📊 Current views:", viewDoc.data().views);

                // Increment today's views
                await updateDoc(viewDocRef, {
                    views: increment(1),
                    lastUpdated: new Date()
                });
                console.log("✅ View count incremented successfully");
            } else {
                console.log("📝 Creating new view document...");

                // Create first view for today
                await setDoc(viewDocRef, {
                    advertId: advertId,
                    date: today,
                    views: 1,
                    lastUpdated: new Date()
                });
                console.log("✅ New view document created successfully");
            }

            console.log(`📊 Daily view tracked for ${advertId} on ${today}`);

        } catch (error) {
            console.error("❌ Error tracking daily view:", error);
            console.error("❌ Error code:", error.code);
            console.error("❌ Error message:", error.message);
        }
    };

    const fetchAdvertViewStats = async (advertId) => {
        const today = new Date();
        const viewStats = {
            today: 0,
            yesterday: 0,
            last7Days: 0,
            last30Days: 0
        };

        try {
            // Get today's views
            const todayStr = today.toISOString().split('T')[0];
            const todayDocRef = doc(db, "advertViews", `${advertId}_${todayStr}`);
            const todayDoc = await getDoc(todayDocRef);
            if (todayDoc.exists()) {
                viewStats.today = todayDoc.data().views || 0;
            }

            // Get yesterday's views
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayDocRef = doc(db, "advertViews", `${advertId}_${yesterdayStr}`);
            const yesterdayDoc = await getDoc(yesterdayDocRef);
            if (yesterdayDoc.exists()) {
                viewStats.yesterday = yesterdayDoc.data().views || 0;
            }

            // Get last 7 days total
            const promises7Days = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const viewDocRef = doc(db, "advertViews", `${advertId}_${dateStr}`);
                promises7Days.push(getDoc(viewDocRef));
            }

            const docs7Days = await Promise.all(promises7Days);
            viewStats.last7Days = docs7Days.reduce((sum, doc) => {
                return sum + (doc.exists() ? doc.data().views || 0 : 0);
            }, 0);

            // Get last 30 days total
            const promises30Days = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const viewDocRef = doc(db, "advertViews", `${advertId}_${dateStr}`);
                promises30Days.push(getDoc(viewDocRef));
            }

            const docs30Days = await Promise.all(promises30Days);
            viewStats.last30Days = docs30Days.reduce((sum, doc) => {
                return sum + (doc.exists() ? doc.data().views || 0 : 0);
            }, 0);

            return viewStats;

        } catch (error) {
            console.error("Error fetching view stats:", error);
            return viewStats;
        }
    };

    // Add this function at the top of your AdvertDetails.jsx file
    const sendNewReviewEmail = useCallback(async (ownerData, reviewerData, reviewData, advertData) => {
        try {
            const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-new-review-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerData, reviewerData, reviewData, advertData }),
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ New review email sent to ${ownerData.email}`);
            } else {
                console.error('❌ Failed to send new review email:', result.error);
            }
        } catch (err) {
            console.error('❌ Failed to send new review email:', err);
        }
    }, []);

    // Toggle favorite function
    const toggleFavorite = useCallback(async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please log in to add favorites");
            return;
        }

        try {
            const favRef = doc(db, "users", currentUser.uid, "favourites", advert.id);
            const countRef = doc(db, "favoritesCounts", advert.id);

            if (isFavorite) {
                await deleteDoc(favRef);
                setIsFavorite(false);

                try {
                    const countDoc = await getDoc(countRef);
                    if (countDoc.exists()) {
                        const currentCount = countDoc.data().count || 0;
                        if (currentCount > 1) {
                            await updateDoc(countRef, {
                                count: increment(-1)
                            });
                        } else {
                            await deleteDoc(countRef);
                        }
                    }
                } catch (error) {
                    console.log("Could not update favorite count:", error);
                }
            } else {
                await setDoc(favRef, {
                    advertId: advert.id,
                    addedAt: serverTimestamp()
                });
                setIsFavorite(true);

                try {
                    const countDoc = await getDoc(countRef);
                    if (countDoc.exists()) {
                        await updateDoc(countRef, {
                            count: increment(1)
                        });
                    } else {
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
    }, [currentUser, advert?.id, isFavorite]);

    const getIpAddress = useCallback(async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return "Unknown";
        }
    }, []);

    const aspectOptions = [
        "Handler Professionalism",
        "Communication",
        "On Time (If Mobile)",
        "Aftercare Advice",
        "Pet as Described"
    ];

    // Function to open gallery modal
    const openGalleryModal = (index) => {
        console.log('Opening gallery modal at index:', index);
        console.log('Available images:', advert?.images?.length);

        if (!advert?.images || advert.images.length === 0) {
            console.error('No images available for gallery');
            return;
        }

        if (index < 0 || index >= advert.images.length) {
            console.error('Invalid image index:', index);
            return;
        }

        setModalImageIndex(index);
        setShowGalleryModal(true);
        document.body.classList.add('gallery-modal-open');

        // Log for debugging
        console.log('Gallery modal opened:', {
            index,
            totalImages: advert.images.length,
            imageUrl: advert.images[index]
        });
    };

// Function to close gallery modal
    const closeGalleryModal = () => {
        console.log('Closing gallery modal');
        setShowGalleryModal(false);
        document.body.classList.remove('gallery-modal-open');
    };

// Update your main image click handler
    const handleMainImageClick = () => {
        console.log('Main image clicked, opening gallery at index:', currentIndex);
        openGalleryModal(currentIndex);
    };

// Update your thumbnail click handlers
    const handleThumbnailClick = (img, idx) => {
        console.log('Thumbnail clicked:', idx);
        setSelectedImage(img);
        setCurrentIndex(idx);
        openGalleryModal(idx);
    };

// Navigation functions for modal
    const modalPrevImage = (e) => {
        if (e) e.stopPropagation();
        if (modalImageIndex > 0) {
            setModalImageIndex(modalImageIndex - 1);
        }
    };
    const modalNextImage = (e) => {
        if (e) e.stopPropagation();
        if (modalImageIndex < advert.images.length - 1) {
            setModalImageIndex(modalImageIndex + 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showGalleryModal) return;

            if (e.key === 'Escape') {
                closeGalleryModal();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (modalImageIndex > 0) {
                    setModalImageIndex(modalImageIndex - 1);
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (modalImageIndex < advert.images.length - 1) {
                    setModalImageIndex(modalImageIndex + 1);
                }
            }
        };

        if (showGalleryModal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showGalleryModal, modalImageIndex, advert?.images?.length]);


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
                            licenceNumber,
                            localAuthority,
                            organizationName
                        } = userSnap.data();

                        // Update the name logic to check for rescue organizations
                        if (breederType === 'rescue' && organizationName) {
                            setOwnerName(organizationName);
                        } else {
                            setOwnerName(`${firstName} ${lastName?.charAt(0) || ""}.`);
                        }

                        const location = `${city || ""}${city && postcode ? ", " : ""}${postcode || ""}`;
                        setOwnerLocation(location);

                        setOwnerMemberSince(createdAt);
                        setOwnerLastActive(lastSeen);
                        setOwnerBreederType(breederType || "");
                        setOwnerAvatar(avatar || "");

                        if (breederType === "licensed") {
                            setOwnerLicenceNumber(licenceNumber || "");
                            setOwnerLocalAuthority(localAuthority || "");
                        }

                        if (auth.currentUser && showPhoneOnAdverts === true) {
                            setOwnerPhone(phone || "");
                        } else {
                            setOwnerPhone("");
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
                    setAdvert(null);
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

    useEffect(() => {
        if (!advert?.id) return;

        const viewedKey = `viewed_${advert.id}`;
        if (sessionStorage.getItem(viewedKey)) return;

        const incrementViews = async () => {
            try {
                // Track daily views first
                await trackDailyView(advert.id);

                // Then update total views on the main advert document
                const adRef = doc(db, "allListings", advert.id);
                await updateDoc(adRef, {
                    views: increment(1),
                    lastViewedAt: new Date()
                });

                sessionStorage.setItem(viewedKey, "true");
                console.log(`👁️ View tracked for advert ${advert.id}`);
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

    useEffect(() => {
        async function fetchSimilarAds() {
            if (!advert?.breedOrType || !advert?.intent || !advert?.id) return;

            try {
                setLoadingSimilar(true);
                const q = query(
                    collection(db, "allListings"),
                    where("breedOrType", "==", advert.breedOrType),
                    where("intent", "==", advert.intent),
                    where("approved", "==", true)
                );
                const snap = await getDocs(q);

                const ads = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(ad => ad.id !== advert.id);

                const shuffled = ads.sort(() => 0.5 - Math.random());
                const limitedAds = shuffled.slice(0, 8);
                setSimilarAds(limitedAds);

                const ownerIds = Array.from(new Set(limitedAds.map(ad => ad.ownerId).filter(Boolean)));
                const map = {};
                await Promise.all(
                    ownerIds.map(async uid => {
                        if (uid) {
                            const udoc = await getDoc(doc(db, "users", uid));
                            if (udoc.exists()) map[uid] = udoc.data();
                        }
                    })
                );
                setSimilarUsersMap(map);

                const ratingsMap = {};
                await Promise.all(
                    limitedAds.map(async ad => {
                        const reviewsQ = query(
                            collection(db, "reviews"),
                            where("advertId", "==", ad.id),
                            where("approved", "==", true)
                        );
                        const reviewsSnap = await getDocs(reviewsQ);
                        const reviews = reviewsSnap.docs.map(d => d.data());

                        if (reviews.length > 0) {
                            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                            ratingsMap[ad.id] = {
                                avgRating: totalRating / reviews.length,
                                reviewCount: reviews.length
                            };
                        } else {
                            ratingsMap[ad.id] = { avgRating: 0, reviewCount: 0 };
                        }
                    })
                );
                setSimilarRatingsMap(ratingsMap);

            } catch (error) {
                console.error("Error fetching similar ads:", error);
            } finally {
                setLoadingSimilar(false);
            }
        }

        fetchSimilarAds();
    }, [advert?.breedOrType, advert?.intent, advert?.id]);

    const submitReview = useCallback(async () => {
        try {
            if (!advert) {
                alert("Advert data not available!");
                return;
            }
            if (!currentUser) {
                alert("Please log in before leaving a review.");
                return;
            }

            // Get reviewer data
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

            // Submit review to Firestore
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

            // Send email notification to advert owner
            try {
                // Get owner data
                const ownerRef = doc(db, "users", advert.ownerId);
                const ownerSnap = await getDoc(ownerRef);

                if (ownerSnap.exists()) {
                    const ownerData = ownerSnap.data();

                    // Prepare email data
                    // Prepare email data
                    const emailOwnerData = {
                        uid: advert.ownerId,  // 👈 Add this line
                        email: ownerData.email,
                        firstName: ownerData.firstName || 'Pet Owner'
                    };

                    const emailReviewerData = {
                        name: reviewerName,
                        avatar: reviewerAvatar
                    };

                    const emailReviewData = {
                        rating: rating,
                        text: reviewText.trim()
                    };

                    const emailAdvertData = {
                        id: advert.id,
                        petName: advert.name || advert.title || 'your pet'
                    };

                    // Send email using SendGrid template
                    await sendNewReviewEmail(emailOwnerData, emailReviewerData, emailReviewData, emailAdvertData);
                }
            } catch (emailError) {
                console.error('Failed to send review notification email:', emailError);
                // Don't show error to user since review was saved successfully
            }

            alert("Review submitted!");
            setShowReviewModal(false);
            setRating(0);
            setReviewText("");
            setReviewAspects([]);
        } catch (err) {
            console.error("Review failed:", err);
            alert("Something went wrong. Please try again.");
        }
    }, [advert, currentUser, rating, reviewText, reviewAspects, getIpAddress, sendNewReviewEmail]);

    const handleTouch = useCallback(() => {
        // Placeholder function for touch events
    }, []);

    // Early returns for loading and not found states
    if (loading) return (
        <>
            <SEO title="Loading Pet Advert" description="Loading pet advert details..." />
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading advert...</p>
            </div>
        </>
    );

    if (!advert) return (
        <>
            <SEO title="Pet Advert Not Found" description="The requested pet advert could not be found." />
            <div className="not-found-container">
                <div className="not-found-icon">🐾</div>
                <p>Advert not found.</p>
                <button className="back-button" onClick={() => navigate("/browse")}>
                    Return to Browse
                </button>
            </div>
        </>
    );

    // Get SEO data now that advert is loaded
    const { title: seoTitle, description: seoDescription } = getSEOData();

    // Rest of your component logic...
    const handleSwipe = () => {
        if (isArrowTapped) {
            setIsArrowTapped(false);
            return;
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
        setIsArrowTapped(true);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedImage(advert.images[currentIndex - 1]);
        }
    };

    const handleNextImage = () => {
        setIsArrowTapped(true);
        if (currentIndex < advert.images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedImage(advert.images[currentIndex + 1]);
        }
    };

    const breedLabel = advert.breedOrType || advert.breed || "—";
    const colorValue = advert.dogColor || advert.catColor || advert.otherColor || null;
    const feeValue = advert.intent === 'rescue'
        ? (advert.adoptionFee ?? "N/A")
        : (advert.fee ?? advert.price ?? "N/A");

    // Age calculation logic...
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

    const hasHealthTests = Array.isArray(advert.healthTests) && advert.healthTests.length > 0;

    return (
        <>
            <SEO title={seoTitle} description={seoDescription} />
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

                        {/* Updated Gallery Section with Litter with Mother indicators */}
                        <div className="gallery-section">
                            <div
                                className="main-image-container"
                                onTouchStart={(e) => { setTouchStartX(e.touches[0].clientX); handleTouch(); }}
                                onTouchMove={(e) => { setTouchEndX(e.touches[0].clientX); handleTouch(); }}
                                onTouchEnd={() => { handleSwipe(); handleTouch(); }}
                                onClick={() => openGalleryModal(currentIndex)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={selectedImage} alt={`${advert.name}`} className="main-image" />

                                {/* Click to enlarge overlay */}
                                <div className="click-to-enlarge-overlay">
                                    <FontAwesomeIcon icon={faSearch} />
                                    <span>Click to enlarge</span>
                                </div>

                                {/* Litter with Mother indicator on main image */}
                                {advert.litterWithMotherIndex === currentIndex && (
                                    <div className="litter-with-mother-badge">
                                        <span className="badge-text">Litter with Mother</span>
                                    </div>
                                )}

                                {advert.images && advert.images.length > 1 && (
                                    <>
                                        <button
                                            className={`nav-arrow prev ${currentIndex === 0 ? 'disabled' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent opening modal
                                                handlePrevImage();
                                            }}
                                            disabled={currentIndex === 0}
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                        <button
                                            className={`nav-arrow next ${currentIndex === advert.images.length - 1 ? 'disabled' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent opening modal
                                                handleNextImage();
                                            }}
                                            disabled={currentIndex === advert.images.length - 1}
                                        >
                                            <FontAwesomeIcon icon={faChevronRight} />
                                        </button>
                                    </>
                                )}

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
                                        className={`thumbnail ${img === selectedImage ? "active" : ""} ${advert.litterWithMotherIndex === idx ? "litter-with-mother" : ""}`}
                                        onClick={() => {
                                            setSelectedImage(img);
                                            setCurrentIndex(idx);
                                            openGalleryModal(idx);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={img} alt={`${advert.name} - view ${idx + 1}`} />

                                        {/* Litter with Mother indicator on thumbnail */}
                                        {advert.litterWithMotherIndex === idx && (
                                            <div className="thumbnail-litter-badge">
                                                <span>M</span>
                                            </div>
                                        )}
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

                                    {ownerBreederType && (
                                        <div className="owner-badge-section">
                                            <div className={`breeder-badge ${ownerBreederType === 'licensed' ? 'licensed' : ownerBreederType === 'rescue' ? 'rescue' : 'hobby'}`}>
                                                <FontAwesomeIcon icon={ownerBreederType === 'rescue' ? faHandshake : faCertificate} className="badge-icon" />
                                                <span>
                                                    {ownerBreederType === "licensed" ? "Licensed Breeder" :
                                                        ownerBreederType === "rescue" ? "Rescue Organization" :
                                                            "Hobby Breeder"}
                                                </span>
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

                                <div className="owner-actions">
                                    <Link to={`/profile/${advert.ownerId}`} className="profile-link">
                                        <div className="button-content">
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>View Profile</span>
                                        </div>
                                    </Link>

                                    {currentUser && currentUserFullData && currentUser.uid !== advert.ownerId && (
                                        <FollowButton
                                            targetUserId={advert.ownerId}
                                            currentUserId={currentUser.uid}
                                            targetUserName={ownerBreederType === 'rescue' ? ownerName : ownerName.split(' ')[0]}
                                            currentUserName={currentUserFullData.firstName}
                                        />
                                    )}

                                    {advert.intent === 'stud' && (
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
                                            Review
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

                                            {/* Rescue-specific fields */}
                                            {advert.intent === 'rescue' && (
                                                <>
                                                    {advert.goodWithCats && (
                                                        <li className="pet-detail-row">
                                                            <div className="pet-detail-label">
                                                                <FontAwesomeIcon icon={faCat} />
                                                                <span>Good with Cats:</span>
                                                            </div>
                                                            <div className="pet-detail-value">
                                                                {advert.goodWithCats === 'yes' ? 'Yes' :
                                                                    advert.goodWithCats === 'no' ? 'No' : 'Unknown'}
                                                            </div>
                                                        </li>
                                                    )}

                                                    {advert.goodWithDogs && (
                                                        <li className="pet-detail-row">
                                                            <div className="pet-detail-label">
                                                                <FontAwesomeIcon icon={faDog} />
                                                                <span>Good with Dogs:</span>
                                                            </div>
                                                            <div className="pet-detail-value">
                                                                {advert.goodWithDogs === 'yes' ? 'Yes' :
                                                                    advert.goodWithDogs === 'no' ? 'No' : 'Unknown'}
                                                            </div>
                                                        </li>
                                                    )}

                                                    {advert.goodWithChildren && (
                                                        <li className="pet-detail-row">
                                                            <div className="pet-detail-label">
                                                                <FontAwesomeIcon icon={faUser} />
                                                                <span>Good with Children:</span>
                                                            </div>
                                                            <div className="pet-detail-value">
                                                                {advert.goodWithChildren === 'yes' ? 'Yes - All Ages' :
                                                                    advert.goodWithChildren === 'older' ? 'Older Children Only (12+)' :
                                                                        advert.goodWithChildren === 'no' ? 'No Children' : 'Unknown'}
                                                            </div>
                                                        </li>
                                                    )}

                                                    {advert.energyLevel && (
                                                        <li className="pet-detail-row">
                                                            <div className="pet-detail-label">
                                                                <FontAwesomeIcon icon={solidStar} />
                                                                <span>Energy Level:</span>
                                                            </div>
                                                            <div className="pet-detail-value">
                                                                {advert.energyLevel === 'low' ? 'Low - Couch Potato' :
                                                                    advert.energyLevel === 'moderate' ? 'Moderate - Daily Walks' :
                                                                        advert.energyLevel === 'high' ? 'High - Very Active' : advert.energyLevel}
                                                            </div>
                                                        </li>
                                                    )}

                                                    {advert.fosteringAvailable && (
                                                        <li className="pet-detail-row">
                                                            <div className="pet-detail-label">
                                                                <FontAwesomeIcon icon={faHandshake} />
                                                                <span>Fostering Available:</span>
                                                            </div>
                                                            <div className="pet-detail-value">Yes - Trial Period Available</div>
                                                        </li>
                                                    )}
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>

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
            </div>

            {/* Similar Studs Section - Outside main container */}
            {similarAds.length > 0 && (
                <section className="similar-studs-section">
                    <div className="similar-studs-container">
                        <h2 className="similar-studs-title">
                            Similar {advert.intent === 'sale' ? 'Pets for Sale' : 'Studs'}
                        </h2>

                        {loadingSimilar ? (
                            <div className="similar-studs-loading">
                                Loading similar {advert.intent === 'sale' ? 'pets' : 'studs'}...
                            </div>
                        ) : (
                            <div className="similar-studs-grid">
                                {similarAds.map(ad => {
                                    const breedLabel = ad.breedOrType || ad.breed || "Unknown Breed";
                                    const title = ad.title || ad.name || "Unnamed";
                                    const user = similarUsersMap[ad.ownerId] || {};
                                    const { city, county } = user;
                                    const areaLabel = city || county
                                        ? [city, county].filter(Boolean).join(", ")
                                        : ad.city || ad.location?.city || "Location N/A";
                                    const rating = similarRatingsMap[ad.id] || { avgRating: 0, reviewCount: 0 };
                                    const mainImage = ad.mainImageIndex !== undefined && ad.images?.[ad.mainImageIndex]
                                        ? ad.images[ad.mainImageIndex]
                                        : ad.images?.[0] || "https://placehold.co/400x300";

                                    return (
                                        <div className="similar-studs-card" key={ad.id}>
                                            <div className="similar-studs-card-header">
                                                <div className="similar-studs-price">
                                                    <FontAwesomeIcon icon={faPoundSign} />
                                                    <span>{ad.price || ad.fee || "POA"}</span>
                                                </div>
                                            </div>

                                            <Link to={`/advert-details/${ad.id}`} className="similar-studs-image-container">
                                                <img
                                                    src={mainImage}
                                                    alt={title}
                                                    className="similar-studs-image"
                                                />
                                                <div className="similar-studs-overlay">
                                                    <span>View Details</span>
                                                </div>
                                            </Link>

                                            <div className="similar-studs-content">
                                                <h3 className="similar-studs-card-title">
                                                    {title.length > 58 ? title.slice(0, 58) + "..." : title}
                                                </h3>

                                                <div className="similar-studs-spacer"></div>
                                                <div className="similar-studs-details-divider"></div>

                                                <div className="similar-studs-details">
                                                    <div className="similar-studs-detail-item">
                                                        <FontAwesomeIcon icon={faDog} />
                                                        <span>{breedLabel}</span>
                                                    </div>
                                                    <div className="similar-studs-detail-item">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                        <span>{areaLabel}</span>
                                                    </div>
                                                </div>

                                                <div className="similar-studs-card-footer">
                                                    <div className="similar-studs-rating">
                                                        <FontAwesomeIcon icon={solidStar} className="similar-studs-star-icon" />
                                                        <span className="similar-studs-rating-value">
                                                            {rating.avgRating ? rating.avgRating.toFixed(1) : "0.0"}
                                                        </span>
                                                    </div>

                                                    <div className="similar-studs-views">
                                                        <FontAwesomeIcon icon={faEye} />
                                                        <span>{ad.views ?? 0}</span>
                                                    </div>

                                                    <div className="similar-studs-reviews">
                                                        <span>{rating.reviewCount}</span>
                                                        <span> {rating.reviewCount === 1 ? 'Review' : 'Reviews'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Modals */}
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

            {showGalleryModal && advert?.images && (
                <div className="gallery-modal-overlay" onClick={closeGalleryModal}>
                    <div className="gallery-modal-container" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            className="gallery-modal-close"
                            onClick={closeGalleryModal}
                            aria-label="Close gallery"
                        >
                            ×
                        </button>

                        {/* Modal image container */}
                        <div className="gallery-modal-image-container">
                            {advert.images[modalImageIndex] && (
                                <img
                                    src={advert.images[modalImageIndex]}
                                    alt={`${advert.name || 'Pet'} - Full size view ${modalImageIndex + 1}`}
                                    className="gallery-modal-image"
                                    onLoad={() => console.log('Modal image loaded')}
                                    onError={(e) => {
                                        console.error('Modal image failed to load:', e);
                                        e.target.src = 'https://placehold.co/800x600/f0f0f0/999999?text=Image+Not+Available';
                                    }}
                                />
                            )}

                            {/* Litter with Mother indicator in modal */}
                            {advert.litterWithMotherIndex === modalImageIndex && (
                                <div className="gallery-modal-litter-badge">
                                    <span>Litter with Mother</span>
                                </div>
                            )}

                            {/* Navigation arrows */}
                            {advert.images.length > 1 && (
                                <>
                                    <button
                                        className={`gallery-modal-nav-arrow prev ${modalImageIndex === 0 ? 'disabled' : ''}`}
                                        onClick={modalPrevImage}
                                        disabled={modalImageIndex === 0}
                                        aria-label="Previous image"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <button
                                        className={`gallery-modal-nav-arrow next ${modalImageIndex === advert.images.length - 1 ? 'disabled' : ''}`}
                                        onClick={modalNextImage}
                                        disabled={modalImageIndex === advert.images.length - 1}
                                        aria-label="Next image"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </>
                            )}

                            {/* Image counter */}
                            <div className="gallery-modal-counter">
                                {modalImageIndex + 1} / {advert.images.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>


    );
}

export default AdvertDetails;