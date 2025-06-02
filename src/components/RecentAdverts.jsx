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
    getDoc,
    setDoc,
    updateDoc,
    increment,
    deleteDoc
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "./RecentAdverts.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";
import {
    faHeart as fasHeart,
    faEye,
    faMapMarkerAlt,
    faDog,
    faPoundSign,
    faStar
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../firebase/firebaseAuth";

function humanize(str = "") {
    return str
        .split(/[-_ ]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function RecentAdverts({ category, intent, title = "Recent Adverts", limitCount = 8 }) {
    const [ads, setAds] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [ratingsMap, setRatingsMap] = useState({});
    const { currentUser } = useAuth();
    const [favs, setFavs] = useState({});

    // 1️⃣ load adverts filtered by category
    useEffect(() => {
        const db = getFirestore();
        async function load() {
            // Define filters only once
            const filters = [
                where("approved", "==", true),
                where("category", "==", category),
                where("sold", "==", false),  // exclude sold adverts
            ];

            if (intent) {
                filters.push(where("intent", "==", intent));
            }

            const q = query(
                collection(db, "allListings"),
                ...filters,
                orderBy("createdAt", "desc"),
                limit(limitCount)
            );

            const snap = await getDocs(q);
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAds(arr);

            // owners
            const uids = [...new Set(arr.map(a => a.ownerId).filter(Boolean))];
            const um = {};
            await Promise.all(
                uids.map(async uid => {
                    const ud = await getDoc(doc(db, "users", uid));
                    if (ud.exists()) um[uid] = ud.data();
                })
            );
            setUsersMap(um);
        }
        load().catch(console.error);
    }, [category, intent, limitCount]);



    // 2️⃣ favourites
    useEffect(() => {
        if (!currentUser) return;
        const db = getFirestore();
        async function loadFavs() {
            const snap = await getDocs(collection(db, "users", currentUser.uid, "favourites"));
            const map = {};
            snap.docs.forEach(d => (map[d.id] = true));
            setFavs(map);
        }
        loadFavs().catch(console.error);
    }, [currentUser]);

    // 3️⃣ ratings
    useEffect(() => {
        if (!ads.length) return;
        const db = getFirestore();

        async function loadRatings() {
            const rm = {};
            await Promise.all(
                ads.map(async (ad) => {
                    // Only look at the top-level reviews collection
                    const reviewsQ = query(
                        collection(db, "reviews"),
                        where("advertId", "==", ad.id),
                        where("approved", "==", true)
                    );
                    const snap = await getDocs(reviewsQ);
                    const vals = snap.docs.map((d) => d.data().rating || 0);
                    rm[ad.id] = vals.length
                        ? vals.reduce((sum, r) => sum + r, 0) / vals.length
                        : 0;
                })
            );
            setRatingsMap(rm);
        }

        loadRatings().catch(console.error);
    }, [ads]);


    // toggle fav
    // Replace the existing toggleFav function (around line 108-124) with this:
    const toggleFav = async (e, id) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Log in to favourite");
            return;
        }
        const db = getFirestore();
        const favRef = doc(db, "users", currentUser.uid, "favourites", id);
        const countRef = doc(db, "favoritesCounts", id);
        const isF = favs[id];

        try {
            if (isF) {
                // Remove favorite
                await deleteDoc(favRef);

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
                    advertId: id,
                    addedAt: new Date()
                });

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
                            advertId: id,
                            createdAt: new Date()
                        });
                    }
                } catch (error) {
                    console.log("Could not update favorite count:", error);
                }
            }

            setFavs(f => ({ ...f, [id]: !isF }));
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <section className="recent-studs-section">
            <div className="recent-studs-container">
                <h2 className="recent-studs-title">{title}</h2>
                <div className="recent-studs-grid">
                    {ads.map(ad => {
                        const breed = humanize(ad.breedOrType);
                        const cat = humanize(ad.category);
                        const price = ad.price ?? ad.fee ?? 0;
                        const user = usersMap[ad.ownerId] || {};
                        const area = user.city || user.county
                            ? [user.city, user.county].filter(Boolean).join(", ")
                            : "N/A";
                        const rate = (ratingsMap[ad.id] || 0).toFixed(1);
                        const favAct = favs[ad.id];
                        const link = `/advert-details/${ad.id}`;
                        const titleText = ad.title || (cat ? `${cat} ${breed}` : "Untitled");

                        return (
                            <div className="recent-studs-card" key={ad.id}>
                                <div className="recent-studs-card-header">
                                    <div className="recent-studs-price">
                                        <FontAwesomeIcon icon={faPoundSign} />
                                        <span>{price}</span>
                                    </div>
                                    <button
                                        className={`recent-studs-favorite ${favAct ? "active" : ""}`}
                                        onClick={e => toggleFav(e, ad.id)}
                                        aria-label="Toggle Favourite"
                                    >
                                        <FontAwesomeIcon icon={favAct ? fasHeart : farHeart} />
                                    </button>
                                </div>
                                <Link to={`/advert-details/${ad.id}`} className="recent-studs-image-container">
                                    <img
                                        src={ad.images?.[0] || "https://placehold.co/400x300"}
                                        alt={titleText}
                                        className="recent-studs-image"
                                    />
                                    <div className="recent-studs-overlay">
                                        <span>View Details</span>
                                    </div>
                                </Link>
                                <div className="recent-studs-content">
                                    <h3 className="recent-studs-card-title">
                                        {titleText.length > 58
                                            ? titleText.slice(0, 58) + "…"
                                            : titleText}
                                    </h3>

                                    <div className="recent-studs-spacer" />

                                    <div className="recent-studs-details-divider" />

                                    <div className="recent-studs-details">
                                        <div className="recent-studs-detail-item">
                                            <FontAwesomeIcon icon={faDog} />
                                            <span>
                                                {cat && `${cat}: `} {breed}
                                            </span>
                                        </div>
                                        <div className="recent-studs-detail-item">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                                            <span>{area}</span>
                                        </div>
                                    </div>
                                    <div className="recent-studs-card-footer">
                                        {ad.intent === "stud" && ratingsMap[ad.id] > 0 && (
                                        <div className="recent-studs-rating">
                                            <FontAwesomeIcon icon={faStar} />
                                            <span className="recent-studs-rating-value">{rate}</span>
                                        </div>
                                        )}
                                        {ad.intent && (() => {
                                            const normalisedIntent = ad.intent.trim().toLowerCase().replace(/\s+/g, '');
                                            const isStud = normalisedIntent === "stud";
                                            const isSale = normalisedIntent === "sale";
                                            return (
                                                <div
                                                    className={`recent-studs-intent ${
                                                        isStud ? "intent-stud" :
                                                            isSale ? "intent-sale" :
                                                                "intent-other"
                                                    }`}
                                                    data-intent={ad.intent}
                                                >
                                                    {isStud ? "For Stud" :
                                                        isSale ? "For Sale" :
                                                            humanize(ad.intent)}
                                                </div>
                                            );
                                        })()}

                                        <div className="recent-studs-views">
                                            <FontAwesomeIcon icon={faEye} />
                                            <span>{ad.views ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="recent-studs-more">
                    <Link to={`/browse?category=${category}`} className="recent-studs-more-button">
                        Browse All {humanize(category)}
                    </Link>
                </div>
            </div>
        </section>
    );
}