// src/components/RecentAdverts.jsx
import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import "./PopularBreeds.css"; // Reuse same styles

function RecentAdverts() {
    const [recentAds, setRecentAds] = useState([]);

    useEffect(() => {
        const fetchRecentAds = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, "studAds"), orderBy("createdAt", "desc"), limit(6));
                const querySnapshot = await getDocs(q);
                const ads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecentAds(ads);
            } catch (error) {
                console.error("Failed to fetch recent adverts:", error);
            }
        };

        fetchRecentAds();
    }, []);

    return (
        <section className="popular-breeds-section">
            <div className="container">
                <h2>Recent Adverts</h2>
                <div className="breed-grid">
                    {recentAds.map((ad) => (
                        <Link to={`/stud-details/${ad.id}`} className="breed-card" key={ad.id}>
                            <img
                                src={ad.images?.[0] || "https://placehold.co/300x200"}
                                alt={ad.name}
                                className="breed-img"
                            />
                            <div className="breed-info">
                                <h3>{ad.name || "Unnamed Stud"}</h3>
                                <p>{ad.breed || "Unknown Breed"}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RecentAdverts;
