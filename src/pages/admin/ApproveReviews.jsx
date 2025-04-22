import React, { useEffect, useState } from "react";
import {
    collectionGroup,
    query,
    where,
    getDocs,
    updateDoc,
    doc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import "./AdminDashboard.css";

export default function ApproveReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnapprovedReviews = async () => {
            try {
                const q = query(
                    collectionGroup(db, "reviews"),
                    where("approved", "==", false)
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    path: doc.ref.path // helpful for approving
                }));
                setReviews(list);
            } catch (err) {
                console.error("❌ Failed to fetch reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUnapprovedReviews();
    }, []);

    const approveReview = async (reviewPath) => {
        try {
            const reviewRef = doc(db, reviewPath);
            await updateDoc(reviewRef, { approved: true });
            setReviews(prev => prev.filter(r => r.path !== reviewPath));
        } catch (err) {
            console.error("❌ Failed to approve review:", err);
        }
    };

    return (
        <>
            <AdminSidebar />
            <div className="admin-dashboard">
                <h1>Approve Reviews</h1>
                {loading ? (
                    <p>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p>No reviews awaiting approval.</p>
                ) : (
                    <ul className="admin-review-list">
                        {reviews.map(review => (
                            <li key={review.id} className="review-box">
                                <strong>{review.reviewerName}</strong> – ⭐ {review.rating}
                                <p>{review.comment}</p>
                                <button onClick={() => approveReview(review.path)}>
                                    ✅ Approve
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
