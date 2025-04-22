// ... all imports remain unchanged
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    addDoc,
    serverTimestamp,
    deleteDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase/firebaseAuth";
import "./UserProfile.css";
import { db } from "../firebase/firebase"; // adjust path if needed

function UserProfile() {
    const { uid } = useParams();
    const [userData, setUserData] = useState(null);
    const [userAds, setUserAds] = useState([]);
    const [favourites, setFavourites] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(5);
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [replyText, setReplyText] = useState({});
    const [submittingReply, setSubmittingReply] = useState(null);
    const [uploading, setUploading] = useState(false);

    const currentUserId = auth.currentUser?.uid;
    const isOwnProfile = currentUserId === uid;

    useEffect(() => {
        const fetchData = async () => {
            if (!uid) return;

            // Fetch user data
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) setUserData(userSnap.data());

            // Fetch adverts
            const adsRef = collection(db, "studAds");
            const adsQuery = isOwnProfile
                ? query(adsRef, where("ownerId", "==", uid))
                : query(adsRef, where("ownerId", "==", uid), where("approved", "==", true));
            const adsSnap = await getDocs(adsQuery);
            setUserAds(adsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch favourites
            if (isOwnProfile) {
                const favsRef = collection(db, "users", uid, "favourites");
                const favSnap = await getDocs(favsRef);
                const favs = await Promise.all(favSnap.docs.map(async docSnap => {
                    const advertRef = doc(db, "studAds", docSnap.id);
                    const advertSnap = await getDoc(advertRef);
                    return advertSnap.exists() ? { id: advertSnap.id, ...advertSnap.data() } : null;
                }));
                setFavourites(favs.filter(Boolean));
            }

            // Fetch reviews
            const reviewsRef = collection(db, "users", uid, "reviews");
            const reviewsQuery = isOwnProfile
                ? reviewsRef
                : query(reviewsRef, where("approved", "==", true));
            const reviewSnap = await getDocs(reviewsQuery);
            const reviewList = reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(reviewList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));

        };

        fetchData();
    }, [uid, isOwnProfile]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setUploading(true);
            const storage = getStorage();
            const avatarRef = ref(storage, `avatars/${uid}`);
            await uploadBytes(avatarRef, file);
            const url = await getDownloadURL(avatarRef);
            await updateDoc(doc(db, "users", uid), { avatar: url });
            setUserData(prev => ({ ...prev, avatar: url }));
        } catch (error) {
            console.error("❌ Avatar upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        if (/https?:\/\/|www\.|<a\s|<\/?[a-z][\s\S]*>/i.test(reviewText)) {
            alert("Please remove links or HTML from your review.");
            return;
        }

        try {
            const reviewerSnap = await getDoc(doc(db, "users", currentUserId));
            const { firstName = "Anonymous", lastName = "" } = reviewerSnap.data() || {};
            const reviewRef = collection(db, "users", uid, "reviews");
            await addDoc(reviewRef, {
                reviewerId: currentUserId,
                reviewerName: `${firstName} ${lastName.charAt(0) || ""}`,
                comment: reviewText,
                rating: parseInt(rating),
                createdAt: serverTimestamp(),
                approved: false
            });

            setReviewText("");
            setRating(5);
            setReviewSuccess("✅ Review submitted!");
        } catch (err) {
            console.error("Error submitting review:", err);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            await deleteDoc(doc(db, "users", uid, "reviews", reviewId));
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error("Failed to delete review:", err);
        }
    };

    const handleReplySubmit = async (reviewId) => {
        const text = replyText[reviewId];
        if (!text) return;
        try {
            setSubmittingReply(reviewId);
            const reviewDocRef = doc(db, "users", uid, "reviews", reviewId);
            await updateDoc(reviewDocRef, { reply: text });
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r));
            setReplyText(prev => ({ ...prev, [reviewId]: "" }));
        } catch (err) {
            console.error("Failed to submit reply:", err);
        } finally {
            setSubmittingReply(null);
        }
    };

    const handleDeleteAdvert = async (adId) => {
        if (!window.confirm("Are you sure you want to delete this advert?")) return;
        try {
            await deleteDoc(doc(db, "studAds", adId));
            setUserAds(prev => prev.filter(ad => ad.id !== adId));
        } catch (error) {
            console.error("Error deleting advert:", error);
            alert("Failed to delete advert.");
        }
    };

    return (
        <div className="user-profile-page">
            <div className="user-banner">
                <div className="avatar-container">
                    <img
                        src={userData?.avatar || "https://placehold.co/100"}
                        alt="Avatar"
                        className="profile-avatar"
                    />
                    {isOwnProfile && (
                        <label className="upload-btn">
                            {uploading ? "Uploading..." : "Upload Photo"}
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                        </label>
                    )}
                </div>
                <div>
                    <h2>{userData?.firstName || "User"} {userData?.lastName || ""}</h2>
                    <p className="uid-display">UID: {uid}</p>
                </div>
            </div>

            <div className="user-grid">
                <div className="user-info-box">
                    <h3>Contact Details</h3>
                    <table className="user-details-table">
                        <tbody>
                        <tr><th>First Name</th><td>{userData?.firstName || "-"}</td></tr>
                        <tr><th>Last Name</th><td>{userData?.lastName || "-"}</td></tr>
                        <tr><th>Email</th><td>{userData?.email || "-"}</td></tr>
                        <tr><th>Phone</th><td>{userData?.phone || "-"}</td></tr>
                        <tr><th>Postcode</th><td>{userData?.postcode || "-"}</td></tr>
                        <tr><th>Member Since</th><td>{userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="user-ads-box">
                    <h3>Adverts by {userData?.firstName || "this user"}</h3>
                    {userAds.length === 0 && <p>No adverts posted yet.</p>}
                    <div className="ad-list">
                        {userAds.map(ad => (
                            <div key={ad.id} className="user-ad-card">
                                <Link to={`/stud-details/${ad.id}`}>
                                    <img src={ad.images?.[0] || "https://placehold.co/150"} alt="Ad" />
                                    <div>
                                        <h4>{ad.name}</h4>
                                        <p>Breed: {ad.breed}</p>
                                        <p>Age: {ad.age} years</p>
                                    </div>
                                </Link>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => handleDeleteAdvert(ad.id)}
                                        className="delete-ad-btn"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {favourites.length > 0 && (
                <div className="user-ads-box favourites-section">
                    <h3>Favourites</h3>
                    <div className="favourites-grid">
                        {favourites.map(ad => (
                            <Link to={`/stud-details/${ad.id}`} key={ad.id} className="user-ad-card">
                                <img src={ad.images?.[0] || "https://placehold.co/150"} alt="Ad" />
                                <div>
                                    <h4>{ad.name}</h4>
                                    <p>Breed: {ad.breed}</p>
                                    <p>Age: {ad.age} years</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="user-ads-box reviews-section">
                <h3>Reviews</h3>
                {reviews.length === 0 && <p>No reviews yet.</p>}
                <div className="reviews-grid">
                    {reviews.map(review => (
                        <div key={review.id} className="review-box">
                            <strong>{review.reviewerName}</strong> - ⭐ {review.rating}
                            <p>{review.comment}</p>

                            {currentUserId === review.reviewerId && (
                                <button onClick={() => handleDeleteReview(review.id)} className="delete-review-btn">Delete</button>
                            )}

                            {review.reply && <p className="reply">Reply: {review.reply}</p>}

                            {isOwnProfile && !review.reply && (
                                <div className="reply-form">
                                    <input
                                        type="text"
                                        value={replyText[review.id] || ""}
                                        onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                                        placeholder="Write a reply..."
                                    />
                                    <button
                                        onClick={() => handleReplySubmit(review.id)}
                                        disabled={submittingReply === review.id}
                                    >
                                        {submittingReply === review.id ? "Replying..." : "Reply"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {!isOwnProfile && currentUserId && (
                    <form onSubmit={handleSubmitReview} className="review-box">
                        <h4>Leave a Review</h4>
                        <label>Comment</label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            maxLength={300}
                            required
                        />
                        <p className="char-count">{reviewText.length}/300 characters</p>

                        <label>Rating</label>
                        <select value={rating} onChange={(e) => setRating(e.target.value)}>
                            {[5, 4, 3, 2, 1].map(r => (
                                <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
                            ))}
                        </select>
                        <button type="submit">Submit Review</button>
                        {reviewSuccess && <p className="success-message">{reviewSuccess}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
