import React, {useState, useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    setDoc,
    deleteDoc,
    increment,          // Add this
    serverTimestamp     // Add this
} from "firebase/firestore";
// at the top of BrowseStuds.jsx
import { updatedFieldConfigurations } from "./data/breedOptions.js";

import {db} from "../firebase/firebase";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as fasHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as farHeart } from "@fortawesome/free-regular-svg-icons";

import MobileFilterPanel from "../components/MobileFilterPanel";
import "./BrowseStuds.css";

export default function BrowseStuds() {
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [ads, setAds] = useState([]);
    const [filteredAds, setFilteredAds] = useState([]);
    const [breedCounts, setBreedCounts] = useState({});
    const [selectedBreed, setSelectedBreed] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [maxFee, setMaxFee] = useState("");
    const [selectedColour, setSelectedColour] = useState("");
    const [selectedAgeRange, setSelectedAgeRange] = useState("");
    const [filters, setFilters] = useState({kc: false, healthTested: false, proven: false});
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const adsPerPage = 15;
    const [favourites, setFavourites] = useState({});
    const [selectedIntent, setSelectedIntent] = useState("");
    const [searchRadius, setSearchRadius] = useState(50);

    const auth = getAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Read all params from URL - ONLY ONCE
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get("category");
    const breedParam = queryParams.get("breed");
    const postcodeParam = queryParams.get("postcode");
    const radiusParam = parseFloat(queryParams.get("radius")) || 50;
    const originLat = parseFloat(queryParams.get("lat"));
    const originLng = parseFloat(queryParams.get("lng"));
    const intentParam = queryParams.get("intent");

    // Initialize state from URL params
    useEffect(() => {
        if (categoryParam) {
            setSelectedCategory(categoryParam.toLowerCase());
        }
        if (breedParam) {
            setSelectedBreed(breedParam);
        }
        if (intentParam) {
            setSelectedIntent(intentParam);
        }
        if (radiusParam) {
            setSearchRadius(radiusParam);
        }
    }, [categoryParam, breedParam, intentParam, radiusParam]);

    // helper: human-readable age
    function getAdAge(seconds) {
        const diffMs = Date.now() - seconds * 1000;
        const days = Math.floor(diffMs / 86400000);
        if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
        const hours = Math.floor(diffMs / 3600000);
        if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        const mins = Math.floor(diffMs / 60000);
        return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    }

    // helper: distance in miles
    function distanceMiles(lat1, lon1, lat2, lon2) {
        const nums = [lat1, lon1, lat2, lon2].map(Number);
        if (nums.some(n => !Number.isFinite(n))) return null;

        const [φ1, λ1, φ2, λ2] = nums.map(x => (x * Math.PI) / 180);
        const R = 6371; // km
        const dφ = φ2 - φ1;
        const dλ = λ2 - λ1;
        const a =
            Math.sin(dφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;

        const km = 2 * R * Math.asin(Math.sqrt(a));
        return km * 0.621371; // miles
    }

    // helper: distance in km for display
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const toRad = x => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    // reset all filters
    function resetFilters() {
        setSelectedBreed("");
        setSortOrder("newest");
        setMaxFee("");
        setSelectedColour("");
        setSelectedAgeRange("");
        setSelectedCategory("all");
        setFilters({ kc: false, healthTested: false, proven: false });
        setSearchRadius(50);
        setSelectedIntent("");

        // Clear URL params
        navigate("/browse", { replace: true });
    }

    useEffect(() => {
        // when currentPage changes, scroll to top of window
        window.scrollTo(0, 0);
    }, [currentPage]);

    // track auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => setUser(u));
        return () => unsub();
    }, [auth]);

    useEffect(() => {
        if (!user) return;

        async function fetchFavourites() {
            const favSnap = await getDocs(collection(db, "users", user.uid, "favourites"));
            const favMap = {};
            favSnap.docs.forEach(doc => {
                favMap[doc.id] = true;
            });
            setFavourites(favMap);
        }

        fetchFavourites().catch(console.error);
    }, [user]);

    // fetch & enrich adverts from the allListings collection
    useEffect(() => {
        async function loadAllListings() {
            // 1️⃣ grab all approved docs from your single collection:
            const q = query(
                collection(db, "allListings"),
                where("approved", "==", true),
                where("sold", "==", false)
            );
            const snap = await getDocs(q);
            const raw = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    // if createdAt is a Firestore Timestamp, pull out seconds; else default to 0
                    createdAt: data.createdAt?.seconds ?? 0
                };
            });

            // 2️⃣ enrich each record (calculate age, health flags, owner info…)
            const enriched = await Promise.all(
                raw.map(async ad => {
                    // owner lookup
                    const uSnap = await getDoc(doc(db, "users", ad.ownerId));
                    const owner = uSnap.exists() ? uSnap.data() : {};

                    // Age calc from dob
                    let age = 0;
                    let ageLabel = "";
                    if (ad.dob) {
                        const birth = new Date(ad.dob);
                        const now = new Date();
                        const diffMs = now - birth;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffDays < 7) {
                            age = 0;
                            ageLabel = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                        } else if (diffDays < 60) {
                            age = 0;
                            const weeks = Math.floor(diffDays / 7);
                            ageLabel = `${weeks} week${weeks !== 1 ? "s" : ""}`;
                        } else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30.44);
                            age = 0;
                            ageLabel = `${months} month${months !== 1 ? "s" : ""}`;
                        } else {
                            age = now.getFullYear() - birth.getFullYear();
                            const m = now.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                                age--;
                            }
                            ageLabel = `${age} year${age !== 1 ? "s" : ""}`;
                        }
                    }

                    return {
                        ...ad,
                        fee: ad.fee || ad.price || 0,
                        breed: ad.breed || ad.breedOrType || "Unknown",
                        colour: ad.colour || ad.color || ad.dogColor || "",
                        images: Array.isArray(ad.images) ? ad.images : [],
                        ageLabel,
                        age,
                        healthTests: Array.isArray(ad.healthTests) ? ad.healthTests : [],
                        healthTested:
                            Array.isArray(ad.healthTests) && ad.healthTests.length > 0,
                        ownerDisplay: owner.firstName
                            ? `${owner.firstName} ${owner.lastName?.charAt(0)}.`
                            : "Unknown",
                        ownerAvatar: owner.avatar || "",
                        ownerLocation: owner.city
                            ? `${owner.city}${owner.postcode ? `, ${owner.postcode}` : ""}`
                            : "",
                        sourceCollection: "allListings",
                    };
                })
            );

            console.log("✅ Enriched ads:", enriched.map(ad => ad.breed));

            setAds(enriched);

            // recompute breed counts
            const counts = {};
            enriched.forEach(a => {
                const b = a.breed || "Unknown";
                counts[b] = (counts[b] || 0) + 1;
            });
            setBreedCounts(counts);
        }

        loadAllListings().catch(console.error);
    }, [user]);

    // combined filter: breed + radius + sort + category
    useEffect(() => {
        const list = ads
            .filter(ad => {
                if (ad.paused || ad.sold) return false;

                // Filter by intent - only if explicitly set
                if (selectedIntent && ad.intent !== selectedIntent) {
                    return false;
                }

                // Filter by category
                if (selectedCategory !== "all" && ad.category !== selectedCategory) {
                    return false;
                }

                // Filter by breed
                if (selectedBreed &&
                    ad.breed?.toLowerCase().trim() !== selectedBreed.toLowerCase().trim()) {
                    return false;
                }

                // Filter by radius - only if location data exists
                if (searchRadius > 0 &&
                    Number.isFinite(originLat) &&
                    Number.isFinite(originLng)) {

                    // Skip location filtering if ad has no location data
                    if (!ad.location ||
                        !Number.isFinite(ad.location.latitude) ||
                        !Number.isFinite(ad.location.longitude)) {
                        // Don't filter out - just skip distance check
                        return true;
                    }

                    const miles = distanceMiles(
                        originLat,
                        originLng,
                        ad.location.latitude,
                        ad.location.longitude
                    );

                    if (miles == null || miles > searchRadius) return false;
                }

                // Other filters
                if (maxFee && ad.fee > parseInt(maxFee)) return false;
                if (selectedColour && (ad.colour !== selectedColour && ad.color !== selectedColour)) return false;

                if (selectedAgeRange) {
                    const age = ad.age;
                    if (selectedAgeRange === "Under 1 year" && age >= 1) return false;
                    if (selectedAgeRange === "1 - 2 years" && (age < 1 || age > 2)) return false;
                    if (selectedAgeRange === "2 - 4 years" && (age < 2 || age > 4)) return false;
                    if (selectedAgeRange === "4+ years" && age < 4) return false;
                }

                if (filters.kc && !ad.kcRegistered) return false;
                if (filters.healthTested && !ad.healthTested) return false;
                if (filters.proven && !ad.proven) return false;

                return true;
            })
            .sort((a, b) => {
                switch (sortOrder) {
                    case "newest":
                        return b.createdAt - a.createdAt;
                    case "oldest":
                        return a.createdAt - b.createdAt;
                    case "fee-asc":
                        return (a.fee || 0) - (b.fee || 0);
                    case "fee-desc":
                        return (b.fee || 0) - (a.fee || 0);
                    case "age-asc":
                        return (a.age || 0) - (b.age || 0);
                    case "age-desc":
                        return (b.age || 0) - (a.age || 0);
                    default:
                        return b.createdAt - a.createdAt;
                }
            });
        setFilteredAds(list);
    }, [
        ads,
        selectedIntent,
        selectedBreed,
        sortOrder,
        originLat,
        originLng,
        searchRadius,
        maxFee,
        selectedColour,
        selectedAgeRange,
        selectedCategory,
        filters.kc,
        filters.healthTested,
        filters.proven
    ]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set("radius", searchRadius);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
    }, [searchRadius]);

    const topBreeds = Object.entries(breedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20);

    // favourite/unfavourite handlers
    // favourite/unfavourite handlers
    async function handleUnfavourite(id) {
        if (!user) return alert("Please log in");

        const favRef = doc(db, "users", user.uid, "favourites", id);
        const countRef = doc(db, "favoritesCounts", id);

        try {
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

            setFavourites(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } catch (err) {
            console.error("Error removing favorite:", err);
        }
    }



    async function handleFavourite(id) {
        if (!user) return alert("Please log in");

        const favRef = doc(db, "users", user.uid, "favourites", id);
        const countRef = doc(db, "favoritesCounts", id);

        try {
            // Add favorite
            await setDoc(favRef, {
                advertId: id,
                addedAt: serverTimestamp()
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
                        createdAt: serverTimestamp()
                    });
                }
            } catch (error) {
                console.log("Could not update favorite count:", error);
            }

            setFavourites(prev => ({
                ...prev,
                [id]: true
            }));
        } catch (err) {
            console.error("Error adding favorite:", err);
        }
    }

    const totalPages = Math.ceil(filteredAds.length / adsPerPage);
    const paginatedAds = filteredAds.slice(
        (currentPage - 1) * adsPerPage,
        currentPage * adsPerPage
    );

    // Get available breeds based on category
    const availableBreedsOrTypes = React.useMemo(() => {
        return Array.from(new Set(
            ads
                .filter(ad => selectedCategory === "all" || ad.category === selectedCategory)
                .map(ad => ad.breed)
                .filter(Boolean)
        )).sort();
    }, [ads, selectedCategory]);

    // Reset breed when category changes
    useEffect(() => {
        // Only reset if we're changing categories (not on initial load)
        if (selectedCategory && !categoryParam) {
            setSelectedBreed("");
        }
    }, [selectedCategory]);

    const colourOptions = React.useMemo(() => {
        if (selectedCategory === "dogs") {
            return updatedFieldConfigurations.dogColor.options;
        }
        if (selectedCategory === "cats") {
            return updatedFieldConfigurations.catColor.options;
        }
        // fallback
        return [{ value: "", label: "Any colour" }];
    }, [selectedCategory]);



    return (
        <>
            <div className="browse-studs-wrapper">
                <div className="browse-studs-page">
                    {/* Mobile filter */}
                    <div className="mobile-only">
                        <MobileFilterPanel
                            isOpen={isMobileFilterOpen}
                            onClose={() => setIsMobileFilterOpen(false)}
                            selectedBreed={selectedBreed}
                            colourOptions={colourOptions}
                            setSelectedBreed={setSelectedBreed}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            maxFee={maxFee}
                            setMaxFee={setMaxFee}
                            selectedColour={selectedColour}
                            setSelectedColour={setSelectedColour}
                            selectedAgeRange={selectedAgeRange}
                            setSelectedAgeRange={setSelectedAgeRange}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            selectedIntent={selectedIntent}
                            setSelectedIntent={setSelectedIntent}
                            filters={filters}
                            setFilters={setFilters}
                            topBreeds={topBreeds}
                            availableBreedsOrTypes={availableBreedsOrTypes}
                            resetFilters={resetFilters}
                            searchRadius={searchRadius}
                            setSearchRadius={setSearchRadius}
                        />
                    </div>

                    {/* Desktop sidebar */}
                    <aside className="browse-studs-sidebar desktop-only">
                        <div className="browse-studs-filter-block">
                            <div className="browse-studs-filter-block">
                                <h3>Advert Type</h3>
                                <select
                                    className="panel-select"
                                    value={selectedIntent}
                                    onChange={e => setSelectedIntent(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    <option value="sale">For Sale</option>
                                    <option value="stud">For Stud</option>
                                </select>
                            </div>
                            <div className="browse-studs-filter-block">
                                <label>Distance: {searchRadius} mi</label>
                                <input
                                    type="range"
                                    className="panel-slider"
                                    min="50"
                                    max="1000"
                                    step="1"
                                    value={searchRadius}
                                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                                />
                            </div>

                            <h3>Pet Category</h3>
                            <select
                                className="panel-select"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="dogs">Dogs</option>
                                <option value="cats">Cats</option>
                                <option value="rabbits">Rabbits</option>
                                <option value="rodents">Rodents</option>
                                <option value="horses">Horses & Ponies</option>
                                <option value="livestock">Livestock</option>
                                <option value="birds">Birds</option>
                                <option value="reptiles">Reptiles</option>
                                <option value="fish">Fish</option>
                                <option value="inverts">Invertebrates</option>
                            </select>
                        </div>

                        <div className="browse-studs-filter-block">
                            <h3>
                                Filter by {selectedCategory === "livestock" ? "Type" : "Breed"}
                            </h3>
                            <select
                                className="panel-select"
                                value={selectedBreed}
                                onChange={e => setSelectedBreed(e.target.value)}
                            >
                                <option value="">
                                    All {selectedCategory === "livestock" ? "Types" : "Breeds"}
                                </option>
                                {availableBreedsOrTypes.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="browse-studs-filter-block">
                            <h3>Sort By</h3>
                            <select
                                className="panel-select"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="fee-asc">Lowest Price</option>
                                <option value="fee-desc">Highest Price</option>
                                <option value="age-asc">Youngest Age</option>
                                <option value="age-desc">Oldest Age</option>
                            </select>
                        </div>

                        <div className="browse-studs-filter-block">
                            <label>Max Price: £{maxFee || 1000}</label>
                            <input
                                type="range"
                                className="panel-slider"
                                min="0" max="10000" step="25"
                                value={maxFee || 0}
                                onChange={e => setMaxFee(Number(e.target.value))}
                            />
                        </div>

                        <div className="browse-studs-filter-block">
                            <label>Colour</label>
                            <select
                                className="panel-select"
                                value={selectedColour}
                                onChange={e => setSelectedColour(e.target.value)}
                            >
                                <option value="">All Colours</option>
                                {colourOptions.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="browse-studs-filter-block checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.kc}
                                    onChange={() => setFilters(f => ({...f, kc: !f.kc}))}
                                /> KC Registered
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.healthTested}
                                    onChange={() => setFilters(f => ({...f, healthTested: !f.healthTested}))}
                                /> Health Tested
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.proven}
                                    onChange={() => setFilters(f => ({...f, proven: !f.proven}))}
                                /> Proven
                            </label>
                        </div>

                        <div className="browse-studs-filter-block">
                            <h3>Popular Breeds</h3>
                            <div className="popular-breeds">
                                {topBreeds.map(([breed]) => (
                                    <span
                                        key={breed}
                                        className="popular-breed"
                                        onClick={() => setSelectedBreed(breed)}
                                    >
                                        {breed}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="browse-studs-filter-block">
                            <button className="reset-btn" onClick={resetFilters}>
                                Reset Filters
                            </button>
                        </div>
                    </aside>

                    <main className="browse-studs-content">
                        <div className="browse-studs-mobile-toolbar mobile-only">
                            <button
                                type="button"
                                className="filter-btn"
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsMobileFilterOpen(true);
                                }}
                            >
                                <svg viewBox="0 0 512 512" height="1em" width="1em">
                                    <path
                                        d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"
                                    />
                                </svg>
                                &nbsp;Filter
                            </button>
                        </div>

                        {(filteredAds.length > 0 || selectedBreed || selectedColour || selectedAgeRange || selectedCategory !== "all" || maxFee || filters.kc || filters.healthTested || filters.proven) && (
                            <div className="browse-studs-summary-section">
                                {filteredAds.length > 0 && (
                                    <div className="browse-studs-summary">
                                        Showing {filteredAds.length.toLocaleString()} of {ads.length.toLocaleString()}
                                        {selectedBreed && ` ${selectedBreed}`}
                                        {selectedCategory !== "all" && ` ${selectedCategory}`} adverts
                                    </div>
                                )}

                                {(selectedBreed || selectedColour || selectedAgeRange || selectedCategory !== "all" || maxFee || filters.kc || filters.healthTested || filters.proven) && (
                                    <>
                                        <div className="browse-studs-divider" />
                                        <div className="browse-studs-active-filters-text">
                                            <strong>Active filters:</strong>&nbsp;

                                            {selectedCategory !== "all" && (
                                                <span>
                                                    Category: {selectedCategory}
                                                    <button onClick={() => setSelectedCategory("all")} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {selectedBreed && (
                                                <span>
                                                    Breed: {selectedBreed}
                                                    <button onClick={() => setSelectedBreed("")} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {selectedColour && (
                                                <span>
                                                    Colour: {selectedColour}
                                                    <button onClick={() => setSelectedColour("")} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {selectedAgeRange && (
                                                <span>
                                                    Age: {selectedAgeRange}
                                                    <button onClick={() => setSelectedAgeRange("")} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {maxFee && (
                                                <span>
                                                    Max Price: £{maxFee}
                                                    <button onClick={() => setMaxFee("")} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {filters.kc && (
                                                <span>
                                                    KC Registered
                                                    <button onClick={() => setFilters(f => ({ ...f, kc: false }))} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {filters.healthTested && (
                                                <span>
                                                    Health Tested
                                                    <button onClick={() => setFilters(f => ({ ...f, healthTested: false }))} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}

                                            {filters.proven && (
                                                <span>
                                                    Proven
                                                    <button onClick={() => setFilters(f => ({ ...f, proven: false }))} className="browse-studs-remove-btn">×</button>&nbsp;
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {paginatedAds.map(ad => (
                            <div
                                key={ad.id}
                                className="browse-studs-card"
                                onClick={() => navigate(`/advert-details/${ad.id}`)
                                }
                                style={{cursor: "pointer"}}
                            >
                                <div className="browse-studs-card-fee-pill">£{ad.fee || ad.price || 0}</div>
                                <div className="browse-studs-card-image">
                                    <img
                                        src={ad.images?.[0] || "https://placehold.co/400x300"}
                                        alt={ad.title}
                                        className="browse-studs-card-img"
                                    />
                                </div>
                                <div className="browse-studs-card-details">
                                    <p className="browse-studs-card-post-age">{getAdAge(ad.createdAt)}</p>
                                    <h4 className="browse-studs-card-name">{ad.title}</h4>
                                    <div className="browse-studs-card-pills">
                                        {ad.ageLabel && (
                                            <span className="browse-studs-pill">{ad.ageLabel}</span>
                                        )}
                                        {ad.breed && <span className="browse-studs-pill">{ad.breed}</span>}
                                        {ad.colour && <span className="browse-studs-pill">{ad.colour}</span>}
                                        {ad.intent && (
                                            <span className="browse-studs-pill">
                                                {ad.intent.charAt(0).toUpperCase() + ad.intent.slice(1)}
                                            </span>
                                        )}
                                    </div>

                                    {ad.location && originLat != null && originLng != null && ad.location.latitude != null && ad.location.longitude != null && (() => {
                                        const miles = (
                                            haversineDistance(
                                                originLat,
                                                originLng,
                                                ad.location.latitude,
                                                ad.location.longitude
                                            ) * 0.621371
                                        );
                                        if (isNaN(miles)) return null;

                                        return (
                                            <div className="browse-studs-card-distance-wrapper">
                                                <span className="browse-studs-pill browse-studs-distance-pill">
                                                    <i className="fa-solid fa-location-dot" style={{ marginRight: "6px" }}></i>
                                                    {miles.toFixed(1)} Miles
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    <p className="browse-studs-card-description">
                                        {(ad.description || "")
                                            .replace(/[\r\n]+/g, " ")
                                            .replace(/\s\s+/g, " ")
                                            .trim()
                                            .slice(0, 400) + (ad.description?.length > 200 ? "…" : "")}
                                    </p>


                                    <hr className="browse-studs-card-divider"/>
                                    <div className="browse-studs-card-footer">
                                        <div className="browse-studs-card-owner-info">
                                            <img
                                                src={ad.ownerAvatar || "https://placehold.co/40x40?text=Avatar"}
                                                alt={ad.ownerDisplay}
                                                className="browse-studs-owner-avatar"
                                            />
                                            <div className="browse-studs-owner-text">
                                                <span className="browse-studs-owner-name">{ad.ownerDisplay}</span>
                                                <span className="browse-studs-owner-location">{ad.ownerLocation}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`browse-studs-favorite ${favourites[ad.id] ? "active" : ""}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                favourites[ad.id]
                                                    ? handleUnfavourite(ad.id)
                                                    : handleFavourite(ad.id);
                                            }}
                                            aria-label="Toggle Favourite"
                                        >
                                            <FontAwesomeIcon icon={favourites[ad.id] ? fasHeart : farHeart} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <FaChevronLeft/>
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    className="page-btn"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    <FaChevronRight/>
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}