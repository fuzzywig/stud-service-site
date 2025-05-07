import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import "./SimilarStuds.css";

function SimilarStuds({ breed, currentAdvertId }) {
    const [similarAds, setSimilarAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const q = query(
        collection(db, "studAds"),
        where("breed", "==", breed),
        where("approved", "==", true)
    );


    useEffect(() => {
        async function fetchSimilarAds() {
            if (!breed) return;

            try {
                const q = query(
                    collection(db, "studAds"),
                    where("breed", "==", breed)
                );
                const snap = await getDocs(q);

                const ads = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(ad => ad.approved && ad.id !== currentAdvertId);

                const shuffled = ads.sort(() => 0.5 - Math.random());
                setSimilarAds(shuffled.slice(0, 8)); // 8 ads max
            } catch (error) {
                console.error("Error fetching similar ads:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSimilarAds();
    }, [breed, currentAdvertId]);

    if (loading) {
        return (
            <div className="similar-studs-wrapper">
                <h2>Similar Studs</h2>
                <p>Loading similar studs...</p>
            </div>
        );
    }

    if (!similarAds.length) return null;

    return (
        <div className="similar-studs-wrapper">
            <h2>Similar Studs</h2>
            <div className="similar-studs-grid">
                {similarAds.map((ad) => (
                    <Link to={`/stud/${ad.id}`} key={ad.id} className="similar-stud-card">
                        <div className="similar-stud-fee">£{ad.fee}</div>

                        <img
                            src={ad.images?.[0] || "https://placehold.co/400x300?text=No+Image"}
                            alt={ad.name}
                            className="similar-stud-image"
                        />

                        <div className="similar-stud-info">
                            <h4 className="similar-stud-name">{ad.name}</h4>
                            <p className="similar-stud-breed">{ad.breed}</p>
                            <p className="similar-stud-location">{ad.city || "Location unknown"}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default SimilarStuds;
