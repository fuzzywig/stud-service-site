import React, { useEffect, useState } from "react";
import "./StudDetails.css";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { auth } from "../firebase/firebase";

function StudDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [ownerName, setOwnerName] = useState("");
    const [ownerLocation, setOwnerLocation] = useState("");

    useEffect(() => {
        const fetchAdvert = async () => {
            try {
                const docRef = doc(db, "studAds", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAdvert(data);
                    setSelectedImage(data.images?.[0]);

                    const userRef = doc(db, "users", data.ownerId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const { firstName, lastName, city, postcode } = userSnap.data();
                        setOwnerName(`${firstName} ${lastName?.charAt(0) || ""}.`);
                        setOwnerLocation(`${city || ""}${city && postcode ? ", " : ""}${postcode || ""}`);
                    }

                    // ✅ Only fetch approved reviews
                    const reviewsRef = collection(db, "users", data.ownerId, "reviews");
                    const approvedReviewsQuery = query(reviewsRef, where("approved", "==", true));
                    const reviewSnapshot = await getDocs(approvedReviewsQuery);
                    const reviewList = reviewSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                        .slice(0, 2);
                    setReviews(reviewList);
                }
            } catch (err) {
                console.error("Error fetching advert:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdvert();
    }, [id]);

    if (loading) return <p>Loading advert...</p>;
    if (!advert) return <p>Advert not found.</p>;

    const handleMessageClick = () => {
        navigate(`/messages?recipient=${advert.ownerId}`);
    };

    return (
        <>
            <div className="stud-details-header">
                <button
                    className="back-button"
                    onClick={() => {
                        navigate("/browse");
                        setTimeout(() => {
                            if (location.state?.scrollY) {
                                window.scrollTo(0, location.state.scrollY);
                            }
                        }, 100);
                    }}
                >
                    ← Back to Browse
                </button>
            </div>

            <div className="stud-details-grid">
                {/* Left: Image Slideshow */}
                <div className="slideshow-box">
                    <div className="main-image">
                        <img src={selectedImage} alt="Main Dog" />
                    </div>
                    <div className="thumbnails">
                        {advert.images?.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`Dog ${index + 1}`}
                                className={img === selectedImage ? "thumbnail-active" : ""}
                                onClick={() => setSelectedImage(img)}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: Owner & Description */}
                <div className="owner-info-box">
                    <h2>Meet {advert.name}</h2>
                    <p>{advert.description}</p>
                </div>

                <div className="description-box">
                    <h2>Owner Information</h2>
                    <p><strong>Owner:</strong> {ownerName || "N/A"}</p>
                    <p><strong>Location:</strong> {ownerLocation || "N/A"}</p>
                    <p><strong>Price:</strong> £{advert.fee}</p>

                    {auth.currentUser?.uid !== advert.ownerId && (
                        <button onClick={handleMessageClick} className="message-breeder-btn">
                            Message Breeder
                        </button>
                    )}

                    {/* ✅ Use Link and correct path */}
                    <Link to={`/profile/${advert.ownerId}`} className="view-all-link">
                        View All Adverts
                    </Link>

                    {reviews.length > 0 && (
                        <>
                            <h3 style={{ marginTop: "20px" }}>Latest Reviews</h3>
                            {reviews.map((r) => (
                                <div key={r.id} className="review-snippet">
                                    <div className="review-rating">⭐ {r.rating}</div>
                                    <p className="review-comment">
                                        "{r.comment.length > 100
                                        ? `${r.comment.slice(0, 100)}...`
                                        : r.comment}"
                                    </p>
                                    <p className="review-meta">– {r.reviewerName}</p>
                                </div>
                            ))}
                            <Link to={`/profile/${advert.ownerId}`} className="view-all-link">
                                Read more reviews
                            </Link>
                        </>
                    )}
                </div>

                {/* Details Table */}
                <div className="details-box">
                    <h2>Details</h2>
                    <table className="details-table">
                        <tbody>
                        <tr><td className="label">Advert ID:</td><td>{id}</td></tr>
                        <tr><td className="label">Breed:</td><td>{advert.breed}</td></tr>
                        <tr><td className="label">Age:</td><td>{advert.age} years</td></tr>
                        <tr><td className="label">KC Registered:</td><td>{advert.kcRegistered ? "Yes" : "No"}</td></tr>
                        <tr>
                            <td className="label">Health Checks:</td>
                            <td>
                                {Array.isArray(advert.healthChecks) && advert.healthChecks.length > 0 ? (
                                    <ul className="health-check-list">
                                        {advert.healthChecks.map((check, index) => (
                                            <li key={index}>
                                                <FontAwesomeIcon icon={faCheckCircle} className="health-icon" />
                                                <span>{check}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : typeof advert.healthChecks === "string" && advert.healthChecks.trim() !== "" ? (
                                    <ul className="health-check-list">
                                        <li>
                                            <FontAwesomeIcon icon={faCheckCircle} className="health-icon" />
                                            <span>{advert.healthChecks}</span>
                                        </li>
                                    </ul>
                                ) : (
                                    "N/A"
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default StudDetails;
