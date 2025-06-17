// src/components/SimilarStuds.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import "./SimilarStuds.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faDog, faPoundSign, faStar, faEye } from "@fortawesome/free-solid-svg-icons";

// Dynamic Alt Text Generator Function
const generateDynamicAltText = (advert, imageIndex = 0, imageType = 'similar', location = '') => {
    if (!advert) return 'Pet image';

    const petName = advert.name || advert.title || '';
    const breed = advert.breedOrType || advert.breed || '';
    const category = advert.category || '';
    const intent = advert.intent || '';
    const color = advert.dogColor || advert.catColor || advert.otherColor || '';

    const descriptiveWords = {
        beautiful: ['beautiful', 'gorgeous', 'stunning', 'magnificent', 'striking'],
        adorable: ['adorable', 'cute', 'charming', 'lovely', 'sweet'],
        healthy: ['healthy', 'robust', 'thriving', 'vibrant', 'strong']
    };

    const intentDescriptors = {
        sale: ['for sale', 'available', 'seeking new home', 'ready for adoption'],
        stud: ['stud dog', 'breeding male', 'stud service'],
        rescue: ['rescue pet', 'needs home', 'available for adoption', 'seeking family']
    };

    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

    // Calculate age category
    let ageCategory = '';
    if (advert.dob) {
        const birth = new Date(advert.dob);
        const now = new Date();
        const diffDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));

        if (diffDays < 365) {
            ageCategory = category === 'dog' ? 'puppy' : category === 'cat' ? 'kitten' : 'young';
        }
    }

    const components = [];

    // Add descriptive adjective
    if (color) {
        components.push(color);
    } else {
        components.push(getRandomItem(descriptiveWords.beautiful));
    }

    // Add breed
    if (breed) {
        components.push(breed);
    }

    // Add age category
    if (ageCategory) {
        components.push(ageCategory);
    } else if (category) {
        components.push(category);
    }

    // Add name if short enough
    if (petName && petName.length < 15) {
        components.push(`named ${petName}`);
    }

    // Add intent
    if (intent && intentDescriptors[intent]) {
        components.push(getRandomItem(intentDescriptors[intent]));
    }

    // Add location
    if (location && location.length < 20) {
        components.push(`in ${location}`);
    }

    // Add image context
    components.push('- listing photo');

    let altText = components.join(' ').trim();

    // Truncate if too long
    if (altText.length > 125) {
        const truncated = altText.substring(0, 122);
        const lastSpace = truncated.lastIndexOf(' ');
        altText = truncated.substring(0, lastSpace) + '...';
    }

    return altText.charAt(0).toUpperCase() + altText.slice(1);
};

function SimilarStuds({ breedOrType, intent, currentAdvertId }) {
    const [similarAds, setSimilarAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usersMap, setUsersMap] = useState({});
    const [ratingsMap, setRatingsMap] = useState({});

    useEffect(() => {
        async function fetchSimilarAds() {
            if (!breedOrType || !intent) return;

            try {
                // Fetch similar ads by breedOrType and intent from allListings
                const q = query(
                    collection(db, "allListings"),
                    where("breedOrType", "==", breedOrType),
                    where("intent", "==", intent),
                    where("approved", "==", true)
                );
                const snap = await getDocs(q);

                const ads = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(ad => ad.id !== currentAdvertId); // Exclude current advert

                const shuffled = ads.sort(() => 0.5 - Math.random());
                const limitedAds = shuffled.slice(0, 8); // 8 ads max
                setSimilarAds(limitedAds);

                // Fetch user data for these ads
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
                setUsersMap(map);

                // Fetch ratings for these ads
                const ratingsMap = {};
                await Promise.all(
                    limitedAds.map(async ad => {
                        // Query for reviews
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
                setRatingsMap(ratingsMap);

            } catch (error) {
                console.error("Error fetching similar ads:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSimilarAds();
    }, [breedOrType, intent, currentAdvertId]);

    // Helper function to capitalize
    const capitalize = (str) => {
        if (typeof str !== "string" || str.length === 0) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Helper function to humanize
    const humanize = (str) => {
        if (!str) return "";
        return str
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    if (loading) {
        return (
            <section className="similar-studs-section">
                <div className="similar-studs-container">
                    <h2 className="similar-studs-title">
                        Similar {intent === 'sale' ? 'Pets for Sale' : 'Studs'}
                    </h2>
                    <div className="similar-studs-loading">
                        Loading similar {intent === 'sale' ? 'pets' : 'studs'}...
                    </div>
                </div>
            </section>
        );
    }

    if (!similarAds.length) return null;

    // Debug - this should show up if component is rendering
    console.log('🎯 SimilarStuds component rendering with', similarAds.length, 'ads, intent:', intent);

    return (
        <section className="similar-studs-section">
            <div className="similar-studs-container">
                <h2 className="similar-studs-title">
                    Similar {intent === 'sale' ? 'Pets for Sale' : 'Studs'}
                </h2>
                <div className="similar-studs-grid">
                    {similarAds.map(ad => {
                        const breedLabel = ad.breedOrType || ad.breed || "Unknown Breed";
                        const title = ad.title || ad.name || "Unnamed";

                        // Check if intent is sale to hide rating
                        const isSaleIntent = (ad.intent === "sale") || (intent === "sale");

                        // Debug for this specific ad
                        console.log('🔍 F1B Toy Cavapoo - ad.intent:', ad.intent, 'component intent:', intent, 'isSaleIntent:', isSaleIntent);

                        // Location info
                        const user = usersMap[ad.ownerId] || {};
                        const { city, county } = user;
                        const areaLabel = city || county
                            ? [city, county].filter(Boolean).join(", ")
                            : ad.city || ad.location?.city || "Location N/A";

                        // Rating info
                        const rating = ratingsMap[ad.id] || { avgRating: 0, reviewCount: 0 };

                        // Get main image based on mainImageIndex
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
                                        alt={generateDynamicAltText(ad, 0, 'similar', areaLabel)}
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

                                    {/* Spacer div to push details to bottom */}
                                    <div className="similar-studs-spacer"></div>

                                    {/* Divider above details section */}
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
                                        {/* Only show rating if intent is not sale */}
                                        {!isSaleIntent && (
                                            <div className="similar-studs-rating">
                                                <FontAwesomeIcon icon={faStar} className="similar-studs-star-icon" />
                                                <span className="similar-studs-rating-value">
                                                    {rating.avgRating ? rating.avgRating.toFixed(1) : "0.0"}
                                                </span>
                                            </div>
                                        )}

                                        <div className="similar-studs-views">
                                            <FontAwesomeIcon icon={faEye} />
                                            <span>{ad.views ?? 0}</span>
                                        </div>

                                        {/* Only show reviews if intent is not sale */}
                                        {!isSaleIntent && (
                                            <div className="similar-studs-reviews">
                                                <span>{rating.reviewCount}</span>
                                                <span> {rating.reviewCount === 1 ? 'Review' : 'Reviews'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default SimilarStuds;