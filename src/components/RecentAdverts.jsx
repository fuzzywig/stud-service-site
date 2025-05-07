// src/components/RecentAdverts.jsx
import React, { useEffect, useState } from "react";
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "./RecentAdverts.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";
import { breedOptions } from "./breedOptions";
import { faHeart as fasHeart } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../firebase/firebaseAuth";
import {
    setDoc,
    deleteDoc
} from "firebase/firestore";
// Capitalize helper
function capitalize(str) {
    if (typeof str !== "string" || str.length === 0) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Humanize helper
function humanize(str) {
    return str
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function RecentAdverts() {
    const [recentAds, setRecentAds] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [ratingsMap, setRatingsMap] = useState({});

    const { currentUser } = useAuth(); // 🔹 Add this line
    const [favourites, setFavourites] = useState({}); // 🔹 And this line

    // 1) Fetch ads + owner data
    useEffect(() => {
        async function fetchAdsAndUsers() {
            const db = getFirestore();
            const adsQ = query(
                collection(db, "studAds"),
                where("approved", "==", true),
                orderBy("createdAt", "desc"),
                limit(16)
            );
            const adsSnap = await getDocs(adsQ);
            const ads = adsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRecentAds(ads);

            const ownerIds = Array.from(new Set(ads.map(ad => ad.ownerId).filter(Boolean)));
            const map = {};
            await Promise.all(
                ownerIds.map(async uid => {
                    const udoc = await getDoc(doc(db, "users", uid));
                    if (udoc.exists()) map[uid] = udoc.data();
                })
            );
            setUsersMap(map);
        }
        fetchAdsAndUsers().catch(console.error);
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        async function fetchFavourites() {
            const db = getFirestore();
            const favSnap = await getDocs(collection(db, "users", currentUser.uid, "favourites"));
            const favMap = {};
            favSnap.docs.forEach(doc => {
                favMap[doc.id] = true;
            });
            setFavourites(favMap);
        }

        fetchFavourites().catch(console.error);
    }, [currentUser]);


    // 2) Fetch reviews & compute averages (only approved reviews)
    useEffect(() => {
        if (!recentAds.length) return;
        async function fetchRatings() {
            const db = getFirestore();
            const newMap = {};

            await Promise.all(
                recentAds.map(async ad => {
                    // string ID field + approved filter
                    const qById = query(
                        collection(db, "reviews"),
                        where("advertId", "==", ad.id),
                        where("approved", "==", true)
                    );

                    // DocumentReference field + approved filter
                    const adRef = doc(db, "studAds", ad.id);
                    const qByRef = query(
                        collection(db, "reviews"),
                        where("advert", "==", adRef),
                        where("approved", "==", true)
                    );

                    const [snapById, snapByRef] = await Promise.all([
                        getDocs(qById),
                        getDocs(qByRef)
                    ]);
                    // merge the two sets
                    const allDocs = [
                        ...snapById.docs,
                        ...snapByRef.docs.filter(d => !snapById.docs.find(x => x.id === d.id))
                    ];

                    console.log(`Ad ${ad.id} → ${allDocs.length} approved review(s)`);

                    const ratings = allDocs.map(d => d.data().rating || 0);
                    newMap[ad.id] =
                        ratings.length > 0
                            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                            : 0;
                })
            );

            setRatingsMap(newMap);
        }
        fetchRatings().catch(console.error);
    }, [recentAds]);

    const toggleFavourite = async (e, adId) => {
        e.preventDefault(); // Prevent link navigation

        if (!currentUser) {
            alert("Please log in to save favourites.");
            return;
        }

        const db = getFirestore();
        const favRef = doc(db, "users", currentUser.uid, "favourites", adId);
        const isFav = favourites[adId];

        try {
            if (isFav) {
                await deleteDoc(favRef);
            } else {
                await setDoc(favRef, {
                    advertId: adId,
                    addedAt: new Date()
                });
            }

            setFavourites(prev => ({
                ...prev,
                [adId]: !isFav
            }));
        } catch (err) {
            console.error("Failed to toggle favourite:", err);
        }
    };


    return (
        <div>

        <section className="recent-adverts-section">
            <div className="recent-adverts-container">
                <h2 className="section-title">Recent Adverts</h2>
                <div className="responsive-card-grid">
                    {recentAds.map(ad => {
                        const opt = breedOptions.find(o => o.value === ad.breed);
                        const breedLabel = opt
                            ? opt.label
                            : ad.breed
                                ? humanize(ad.breed)
                                : "";

                        const title =
                            ad.colour && breedLabel
                                ? `${capitalize(ad.colour)} ${breedLabel}`
                                : ad.name || "Unnamed Stud";

                        // pull city/county or coords
                        const user = usersMap[ad.ownerId] || {};
                        const { city, county } = user;
                        const areaLabel =
                            city || county
                                ? [city, county].filter(Boolean).join(", ")
                                : ad.location
                                    ? `${ad.location.latitude.toFixed(4)}, ${ad.location.longitude.toFixed(4)}`
                                    : "N/A";

                        const avgRating = ratingsMap[ad.id] || 0;

                        return (
                            <div className="card" key={ad.id}>
                                <Link to={`/stud-details/${ad.id}`} className="card-image">
                                    <div className="image-container">
                                        <img
                                            src={ad.images?.[0] || "https://placehold.co/400x300"}
                                            alt={title}
                                        />
                                    </div>
                                    <div className="price-tag">£{ad.price || "200"}</div>
                                    <button
                                        className={`fav-btn-overlay ${favourites[ad.id] ? "active" : ""}`}
                                        onClick={(e) => toggleFavourite(e, ad.id)}
                                        aria-label="Toggle Favourite"
                                    >
                                        <FontAwesomeIcon icon={favourites[ad.id] ? fasHeart : farHeart} />
                                    </button>

                                </Link>

                                <div className="card-content">
                                    <h3 className="card-title">{title}</h3>
                                </div>

                                <div className="card-footer">
                                    <div className="left-aligned-details">
                                        <div className="detail-row">
                                            <span className="detail-icon">🐕</span> {breedLabel || "N/A"}
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-icon">📍</span> {areaLabel}
                                        </div>
                                    </div>
                                    <div className="star-rating">
                                        <span className="star-icon">★</span>
                                        <span className="rating-number">{avgRating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="recent-adverts-footer">
                <p className="recent-adverts-more-text">Looking for more?</p>
                <Link to="/browse" className="recent-adverts-more-button">
                    Browse More Studs
                </Link>
            </div>
        </section>


        </div>
    );
}
