// src/pages/UserProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    documentId
} from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseAuth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStar as solidStar,
    faMedal,
    faHandshake,
    faComments,
    faClock,
    faMoneyBillWave,
    faPrescriptionBottleAlt,
    faDog,
    faCamera,
    faPlus,
    faPencilAlt,
    faTrashAlt,
    faChevronDown,
    faChevronUp,
    faEnvelope,
    faPhone,
    faMapMarkerAlt
} from "@fortawesome/free-solid-svg-icons";

import "./UserProfile.css";

const TRUNCATE_LENGTH = 127;

function ReviewCard({ review }) {
    const [showModal, setShowModal] = useState(false);
    const isLong = review.text.length >= TRUNCATE_LENGTH;
    const truncated = isLong
        ? review.text.slice(0, TRUNCATE_LENGTH) + "…"
        : review.text;

    return (
        <>
            <div className="up-review-card">
                <div className="up-review-header">
                    <h4 className="up-review-dog-name">{review.dogName}</h4>
                    <div className="up-review-stars">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <FontAwesomeIcon
                                key={i}
                                icon={solidStar}
                                className={i <= review.rating ? "up-star up-active" : "up-star"}
                            />
                        ))}
                    </div>
                </div>
                <p className="up-review-text">"{truncated}"</p>
                {isLong && (
                    <button
                        className="up-read-more-btn"
                        onClick={() => setShowModal(true)}
                    >
                        Read full review
                    </button>
                )}
                <p className="up-review-author">— {review.reviewerName}</p>
            </div>

            {showModal && (
                <div
                    className="up-modal-backdrop"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="up-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="up-modal-close-btn"
                            onClick={() => setShowModal(false)}
                        >
                            ×
                        </button>
                        <h4 className="up-modal-dog-name">{review.dogName}</h4>
                        <div className="up-modal-stars">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <FontAwesomeIcon
                                    key={i}
                                    icon={solidStar}
                                    className={i <= review.rating ? "up-star up-active" : "up-star"}
                                />
                            ))}
                        </div>
                        <p className="up-modal-text">"{review.text}"</p>
                        <p className="up-modal-author">— {review.reviewerName}</p>
                    </div>
                </div>
            )}
        </>
    );
}

export default function UserProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [userData, setUserData] = useState(null);
    const [userAds, setUserAds] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [activeTab, setActiveTab] = useState("adverts");

    const isOwnProfile = currentUserId === uid;

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserId(user.uid);
                const me = await getDoc(doc(db, "users", user.uid));
                setIsAdmin(me.exists() && me.data().isAdmin === true);
            } else {
                setCurrentUserId(null);
                setIsAdmin(false);
            }
        });
        return unsub;
    }, []);

    // fetch user info, ads, reviews
    useEffect(() => {
        const fetchData = async () => {
            // 1) Load basic user info
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) {
                setUserData(uSnap.data());
            }

            // 2) Load adverts (only include unapproved if not owner/admin)
            const adFilters = [where("ownerId", "==", uid)];
            if (currentUserId !== uid && !isAdmin) {
                adFilters.push(where("approved", "==", true));
            }
            const adsSnap = await getDocs(
                query(collection(db, "studAds"), ...adFilters)
            );
            setUserAds(adsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // 3) Load approved reviews only, and safely fetch each dog's name
            const revSnap = await getDocs(
                query(
                    collection(db, "reviews"),
                    where("ownerId", "==", uid),
                    where("approved", "==", true)
                )
            );
            const enriched = await Promise.all(
                revSnap.docs.map(async ds => {
                    const d = ds.data();
                    let name = "Unknown Dog";

                    // Query for approved studAd by ID
                    const adSnap = await getDocs(
                        query(
                            collection(db, "studAds"),
                            where(documentId(), "==", d.advertId),
                            where("approved", "==", true)
                        )
                    );
                    if (adSnap.docs.length > 0) {
                        name = adSnap.docs[0].data().name;
                    }

                    return { id: ds.id, ...d, dogName: name };
                })
            );
            setReviews(enriched);
        };

        fetchData();
    }, [uid, currentUserId, isAdmin]);

    const openFileInput = () => fileInputRef.current.click();
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return alert("No file selected!");
        const sRef = ref(storage, `avatars/${currentUserId}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        await updateDoc(doc(db, "users", currentUserId), { avatar: url });
        setUserData((p) => ({ ...p, avatar: url }));
    };

    const handleDeleteAd = async (id) => {
        if (!window.confirm("Delete this advert?")) return;
        await deleteDoc(doc(db, "studAds", id));
        setUserAds((prev) => prev.filter((a) => a.id !== id));
    };

    if (!userData)
        return <div className="up-loading-container">
            <div className="up-loading-spinner"></div>
            <p>Loading profile...</p>
        </div>;

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
    const averageRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

    // Grab all the aspects from every review, dedupe them
    const aspectBadges = Array.from(
        new Set(
            reviews.flatMap(r => Array.isArray(r.aspects) ? r.aspects : [])
        )
    );

    // count how often each aspect was checked
    const aspectCounts = reviews.reduce((acc, r) => {
        if (Array.isArray(r.aspects)) {
            r.aspects.forEach(a => {
                acc[a] = (acc[a] || 0) + 1;
            });
        }
        return acc;
    }, {});

    // we still need our icon lookup
    const aspectIconMap = {
        "Handler Professionalism": faHandshake,
        "Communication & Responsiveness": faComments,
        "Appointment Punctuality": faClock,
        "Value for Money": faMoneyBillWave,
        "Aftercare Advice": faPrescriptionBottleAlt,
        "Dog as Described": faDog
    };

    function formatBreed(breed) {
        if (!breed) return "";
        return breed
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }


    return (
        <div className="up-profile-container">
            <div className="up-profile-header">
                <div className="up-avatar-container">
                    <img
                        src={userData.avatar || "https://placehold.co/100"}
                        alt="Avatar"
                        className="up-profile-avatar"
                    />
                    {isOwnProfile && (
                        <button
                            className="up-avatar-change-btn"
                            onClick={openFileInput}
                            title="Change Avatar"
                        >
                            <FontAwesomeIcon icon={faCamera} />
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                    />
                </div>

                <div className="up-profile-info">
                    <h1 className="up-profile-name">
                        {userData.firstName} {userData.lastName}
                    </h1>

                    {reviews.length > 0 && (
                        <div className="up-profile-rating">
                            <span className="up-rating-score">{averageRating}</span>
                            <div className="up-rating-stars">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <FontAwesomeIcon
                                        key={i}
                                        icon={solidStar}
                                        className={i <= Math.round(averageRating) ? "up-star up-active" : "up-star"}
                                    />
                                ))}
                            </div>
                            <span className="up-rating-count">({reviews.length} reviews)</span>
                        </div>
                    )}
                </div>
            </div>

            {reviews.length > 0 && (
                <div className="up-aspect-badges-section">
                    <h3 className="up-aspect-badges-title">What people appreciate</h3>
                    <div className="up-aspect-badges-container">
                        {Object.entries(aspectCounts)
                            .sort((a, b) => b[1] - a[1]) // Sort by count, highest first
                            .map(([aspect, count]) => (
                                <div key={aspect} className="up-aspect-badge">
                                    <div className="up-aspect-badge-icon">
                                        <FontAwesomeIcon icon={aspectIconMap[aspect]} />
                                    </div>
                                    <div className="up-aspect-badge-content">
                                        <span className="up-aspect-badge-name">{aspect}</span>
                                        <div className="up-aspect-badge-count">
                                            <span>{count}</span>
                                            <span> {count === 1 ? 'review' : 'reviews'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <div className="up-tab-navigation">
                <button
                    className={`up-tab-button ${activeTab === 'adverts' ? 'up-active' : ''}`}
                    onClick={() => setActiveTab('adverts')}
                >
                    Adverts
                </button>
                <button
                    className={`up-tab-button ${activeTab === 'reviews' ? 'up-active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
                <button
                    className={`up-tab-button ${activeTab === 'contact' ? 'up-active' : ''}`}
                    onClick={() => setActiveTab('contact')}
                >
                    Contact
                </button>
            </div>

            <div className="up-tab-content">
                {activeTab === 'adverts' && (
                    <div className="up-adverts-section">
                        <div className="up-section-header">
                            <h2>Adverts by {userData.firstName}</h2>
                            {isOwnProfile && (
                                <button
                                    className="up-add-advert-btn"
                                    onClick={() => navigate("/new-advert")}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add New
                                </button>
                            )}
                        </div>

                        {userAds.length === 0 ? (
                            <div className="up-no-content">
                                <p>No adverts posted yet.</p>
                            </div>
                        ) : (
                            <div className="up-adverts-grid">
                                {userAds.map((ad) => (
                                    <div key={ad.id} className="up-advert-card">
                                        <Link
                                            to={`/stud-details/${ad.id}`}
                                            className="up-advert-link"
                                        >
                                            <div className="up-ad-image">
                                                <img
                                                    src={ad.images?.[0] || "https://placehold.co/300x200"}
                                                    alt={ad.name}
                                                />
                                            </div>
                                            <div className="up-advert-info">
                                                <h3 className="up-advert-name">{ad.name}</h3>
                                                <div className="up-advert-details">
                                                    <span className="up-advert-breed">{formatBreed(ad.breed)}</span>
                                                    <span className="up-advert-age">{ad.age} years</span>
                                                </div>
                                            </div>
                                        </Link>
                                        {isOwnProfile && (
                                            <div className="up-advert-actions">
                                                <button
                                                    className="up-edit-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(`/edit-stud/${ad.id}`);
                                                    }}
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faPencilAlt} />
                                                </button>
                                                <button
                                                    className="up-delete-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleDeleteAd(ad.id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="up-reviews-section">
                        <h2>Reviews</h2>

                        {displayedReviews.length === 0 ? (
                            <div className="up-no-content">
                                <p>No reviews yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="up-reviews-grid">
                                    {displayedReviews.map((r) => (
                                        <ReviewCard key={r.id} review={r} />
                                    ))}
                                </div>

                                {reviews.length > 6 && (
                                    <button
                                        className="up-show-more-btn"
                                        onClick={() => setShowAllReviews(s => !s)}
                                    >
                                        {showAllReviews ? (
                                            <>
                                                <span>Show fewer reviews</span>
                                                <FontAwesomeIcon icon={faChevronUp} />
                                            </>
                                        ) : (
                                            <>
                                                <span>Show more reviews ({reviews.length - 6} more)</span>
                                                <FontAwesomeIcon icon={faChevronDown} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="up-contact-section">
                        <h2>Contact Details</h2>
                        <div className="up-contact-card">
                            <div className="up-contact-item">
                                <FontAwesomeIcon icon={faEnvelope} className="up-contact-icon" />
                                <div>
                                    <span className="up-contact-label">Email</span>
                                    <span className="up-contact-value">{userData.email}</span>
                                </div>
                            </div>

                            <div className="up-contact-item">
                                <FontAwesomeIcon icon={faPhone} className="up-contact-icon" />
                                <div>
                                    <span className="up-contact-label">Phone</span>
                                    <span className="up-contact-value">{userData.phone || "Not provided"}</span>
                                </div>
                            </div>

                            <div className="up-contact-item">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="up-contact-icon" />
                                <div>
                                    <span className="up-contact-label">Postcode</span>
                                    <span className="up-contact-value">{userData.postcode || "Not provided"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}