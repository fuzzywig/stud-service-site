// StudDetails.jsx
import React, { useEffect, useState } from "react";
import "./StudDetails.css";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheckCircle,
    faPenToSquare,
    faEnvelopeOpenText,
    faStar as solidStar,
    faChevronLeft,
    faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookSquare } from "@fortawesome/free-brands-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";

import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import { auth } from "../firebase/firebaseAuth";
import AdvertUpdates from "../components/AdvertUpdates";
import "../components/AdvertUpdates.css";
import SimilarStuds from "../components/SimilarStuds";


function StudDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [ownerName, setOwnerName] = useState("");
    const [ownerLocation, setOwnerLocation] = useState("");
    const [averageRating, setAverageRating] = useState(null);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviewAspects, setReviewAspects] = useState([]);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [arrowsVisible, setArrowsVisible] = useState(true);

    // ← define the six checkbox options
       const aspectOptions = [
                "Handler Professionalism",
               "Communication & Responsiveness",
               "Appointment Punctuality",
               "Value for Money",
               "Aftercare Advice",
               "Dog as Described"
           ];



    useEffect(() => {
        const fetchAdvert = async () => {
            try {




                const docRef = doc(db, "studAds", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAdvert({ id: docSnap.id, ...data });
                    setSelectedImage(data.images?.[data.mainImageIndex || 0]);
                    setCurrentIndex(data.mainImageIndex || 0); // Also set correct index for swipe arrows

                    // Owner info
                    const userRef = doc(db, "users", data.ownerId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const { firstName, lastName, city, postcode } = userSnap.data();
                        setOwnerName(`${firstName} ${lastName?.charAt(0) || ""}.`);
                        setOwnerLocation(
                            `${city || ""}${city && postcode ? ", " : ""}${postcode || ""}`
                        );
                    }

                    // Average rating
                    const reviewsRef = collection(db, "reviews");
                    const ratingQuery = query(
                        reviewsRef,
                        where("advertId", "==", id),
                        where("approved", "==", true)
                    );
                    const snapshot = await getDocs(ratingQuery);
                    const ratings = snapshot.docs.map((d) => d.data().rating);
                    if (ratings.length) {
                        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                        setAverageRating(avg);
                    } else {
                        setAverageRating(null);
                    }
                }
            } catch (err) {
                console.error("Error fetching advert:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdvert();
    }, [id]);

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

            await addDoc(collection(db, "reviews"), {
                advertId: advert.id,
                reviewerId: currentUser.uid,
                reviewerName,
                reviewerAvatar,
                rating,
                text: reviewText.trim(),
                aspects: reviewAspects,       // ← include your selected checkboxes here
                approved: false,
                createdAt: serverTimestamp(),
                ownerId: advert.ownerId,
            });

            alert("Review submitted!");
            setShowReviewModal(false);
            setRating(0);
            setReviewText("");
            setReviewAspects([]);          // ← reset the checkboxes
        } catch (err) {
            console.error("Review failed:", err);
            alert("Something went wrong. Please try again.");
        }
    };


    if (loading) return <p>Loading advert...</p>;
    if (!advert) return <p>Advert not found.</p>;


    const handleSwipe = () => {
        if (!advert?.images?.length) return;

        const threshold = 50;
        const swipeDistance = touchStartX - touchEndX;

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
    const handleTouch = () => {
        setArrowsVisible(true); // Show arrows immediately
        if (window.arrowTimeout) clearTimeout(window.arrowTimeout); // Clear any old timer
        window.arrowTimeout = setTimeout(() => setArrowsVisible(false), 1500); // Hide after 1.5 seconds
    };



    return (
        <>
            <div className="stud-details-header">
                <button
                    className="back-button"
                    onClick={() => {
                        navigate("/browse");
                        setTimeout(() => {
                            if (location.state?.scrollY)
                                window.scrollTo(0, location.state.scrollY);
                        }, 100);
                    }}
                >
                    ← Back to Browse
                </button>
            </div>

            <div className="stud-details-layout">
                {/* LEFT COLUMN */}
                <div className="left-column">
                    <div className="slideshow-box">
                        <div
                            className="main-image"
                            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                            onTouchMove={(e) => setTouchEndX(e.touches[0].clientX)}
                            onTouchEnd={handleSwipe}
                            onTouchStart={(e) => { setTouchStartX(e.touches[0].clientX); handleTouch(); }}
                            onTouchMove={(e) => { setTouchEndX(e.touches[0].clientX); handleTouch(); }}
                            onTouchEnd={() => { handleSwipe(); handleTouch(); }}
                        >
                            <img src={selectedImage} alt="Main Dog" />

                            {/* Arrows (visible on mobile) */}
                            {arrowsVisible && (
                                <div className="swipe-arrows">
                                    <FontAwesomeIcon icon={faChevronLeft} className="swipe-arrow left" />
                                    <FontAwesomeIcon icon={faChevronRight} className="swipe-arrow right" />
                                </div>
                            )}

                        </div>


                        <div className="thumbnails">
                            {advert.images?.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Dog ${idx + 1}`}
                                    className={img === selectedImage ? "thumbnail-active" : ""}
                                    onClick={() => {
                                        setSelectedImage(img);
                                        setCurrentIndex(idx); // 🔥 Add this
                                    }}
                                />
                            ))}

                        </div>
                    </div>

                    <div className="description-box">
                        <h2>Meet {advert.name}</h2>
                        <p>{advert.description}</p>
                    </div>


                </div>

                {/* RIGHT COLUMN */}
                <div className="right-column">
                    <div className="stud-action-buttons">
                        <button
                            className="review-button"
                            onClick={() => setShowReviewModal(true)}
                        >
                            <FontAwesomeIcon
                                icon={faPenToSquare}
                                style={{ marginRight: "8px" }}
                            />
                            Review Stud
                        </button>
                        <button className="message-user-btn">
                            <FontAwesomeIcon
                                icon={faEnvelopeOpenText}
                                style={{ marginRight: "8px" }}
                            />
                            Message User
                        </button>
                    </div>

                    <div className="owner-info-box">
                        <h2>Owner Info</h2>
                        <p>
                            <strong>Owner:</strong> {ownerName || "N/A"}
                        </p>
                        <p>
                            <strong>Location:</strong> {ownerLocation || "N/A"}
                        </p>
                        <Link
                            to={`/profile/${advert.ownerId}`}
                            className="view-all-link"
                        >
                            View All Adverts & Reviews
                        </Link>
                    </div>

                    <div className="stud-fee-box">
                        <p>£{advert.fee}</p>
                    </div>

                    {averageRating !== null && (
                        <div className="rating-info-box">
                            <h2>Studs Average Rating</h2>
                            <div className="average-star-display">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <FontAwesomeIcon
                                        key={i}
                                        icon={
                                            i <= Math.round(averageRating) ? solidStar : regularStar
                                        }
                                        style={{
                                            fontSize: "18px",
                                            marginRight: "4px",
                                            color: "#FFD700",
                                        }}
                                    />
                                ))}
                                <span
                                    style={{
                                        marginLeft: "6px",
                                        fontWeight: "bold",
                                        color: "#444",
                                    }}
                                >
                  {averageRating.toFixed(1)} / 5
                </span>
                            </div>
                        </div>
                    )}

                    <div className="details-box">
                        <h2>Dog Details</h2>
                        <table className="details-table">
                            <tbody>
                            <tr>
                                <td className="label">Breed:</td>
                                <td>{advert.breed}</td>
                            </tr>
                            <tr>
                                <td className="label">Age:</td>
                                <td>{advert.age} Years</td>
                            </tr>

                            <tr>
                                <td className="label">Colour:</td>
                                <td>{advert.colour}</td>
                            </tr>
                            <tr>
                                <td className="label">Height:</td>
                                <td>{advert.height ? advert.height : "Not specified"}</td>
                            </tr>
                            <tr>
                                <td className="label">Weight:</td>
                                <td>{advert.weight ? advert.weight : "Not specified"}</td>
                            </tr>
                            <tr>
                                <td className="label">KC Registered:</td>
                                <td>{advert.kcRegistered ? "Yes" : "No"}</td>
                            </tr>
                            <tr>
                                <td className="label">Vaccinated:</td>
                                <td>{advert.vacsUpToDate ? "Yes" : "No"}</td>
                            </tr>

                            {advert.matings !== undefined && (
                                <tr>
                                    <td className="label">Number of Matings:</td>
                                    <td>{advert.matings} {advert.matings === 1 ? "Mating" : "Matings"}</td>
                                </tr>
                            )}


                            {(advert.facebookUrl || advert.instagramUrl) && (
                                <tr>
                                    <td className="label">Social:</td>
                                    <td style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        {advert.facebookUrl && (
                                            <a
                                                href={advert.facebookUrl.startsWith("http") ? advert.facebookUrl : `https://${advert.facebookUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faFacebookSquare}
                                                    style={{ fontSize: "30px", color: "#4267B2" }}
                                                />
                                            </a>
                                        )}
                                        {advert.instagramUrl && (
                                            <a
                                                href={advert.instagramUrl.startsWith("http") ? advert.instagramUrl : `https://${advert.instagramUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faInstagram}
                                                    style={{ fontSize: "30px", color: "#E1306C" }}
                                                />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            )}








                            </tbody>
                        </table>

                        {Array.isArray(advert.healthChecks) &&
                            advert.healthChecks.length > 0 && (
                                <div className="health-checks-section">
                                    <h3 className="health-heading">Health Tests</h3>
                                    <ul className="health-check-list">
                                        {advert.healthChecks.map((check, idx) => (
                                            <li key={idx}>
                                                <FontAwesomeIcon
                                                    icon={faCheckCircle}
                                                    className="health-icon"
                                                />
                                                <span>{check}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {advert && (
                <SimilarStuds breed={advert.breed} currentAdvertId={advert.id} />
            )}


            {/* Review Modal */}
            {showReviewModal && (
                <div
                    className="review-modal-backdrop"
                    onClick={() => setShowReviewModal(false)}
                >
                    <div
                        className="review-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Leave a Review</h3>
                        <div className="star-select">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={star <= rating ? "star selected" : "star"}
                                    onClick={() => setRating(star)}
                                >
                        ★
                    </span>
                            ))}
                        </div>

                        {/* Instructional text */}
                        <p className="review-instructions">
                            Review should represent the stud dog as well as the stud handler; please check any boxes that you think are relevant to the service that was provided.
                        </p>

                        {/* Aspect checkboxes */}
                        <fieldset className="aspect-checkboxes">
                            <legend>Service aspects:</legend>
                            {aspectOptions.map(option => (
                                <label key={option} className="checkbox-label">
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
                                    {option}
                                </label>
                            ))}
                        </fieldset>

                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Write your review (min 100 characters)…"
                            minLength={100}
                            maxLength={500}
                        />
                        <button
                            className="submit-review-button"
                            disabled={rating === 0 || reviewText.length < 100}
                            onClick={submitReview}
                        >
                            Submit Review
                        </button>
                    </div>
                </div>
            )}

        </>
    );
}

export default StudDetails;
