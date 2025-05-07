import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import MobileFilterPanel from "../components/MobileFilterPanel";
import { breedOptions } from "../components/breedOptions";
import "./BrowseStuds.css";

export default function BrowseStuds() {
    const [ads, setAds]                 = useState([]);
    const [filteredAds, setFilteredAds] = useState([]);
    const [breedCounts, setBreedCounts] = useState({});
    const [selectedBreed, setSelectedBreed] = useState("");
    const [sortOrder, setSortOrder]     = useState("newest");
    const [maxFee, setMaxFee]           = useState("");
    const [selectedColour, setSelectedColour] = useState("");
    const [selectedAgeRange, setSelectedAgeRange] = useState("");
    const [filters, setFilters]         = useState({ kc: false, healthTested: false, proven: false });
    const [user, setUser]               = useState(null);

    const auth   = getAuth();
    const navigate = useNavigate();

    // Read geo params from URL
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const queryBreed = params.get("breed");
    const queryPostcode = params.get("postcode");
    const queryRadius = parseFloat(params.get("radius")) || 10;
    const originLat = parseFloat(params.get("lat"));
    const originLng = parseFloat(params.get("lng"));


    // helper: human-readable age
    function getAdAge(seconds) {
        const diffMs = Date.now() - seconds * 1000;
        const days   = Math.floor(diffMs / 86400000);
        if (days > 0) return `${days} day${days>1?"s":""} ago`;
        const hours = Math.floor(diffMs / 3600000);
        if (hours > 0) return `${hours} hour${hours>1?"s":""} ago`;
        const mins  = Math.floor(diffMs / 60000);
        return `${mins} minute${mins!==1?"s":""} ago`;
    }

    // helper: distance in km
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const toRad = x => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    // reset all filters
    function resetFilters() {
        setSelectedBreed("");
        setSortOrder("newest");
        setMaxFee("");
        setSelectedColour("");
        setSelectedAgeRange("");
        setFilters({ kc: false, healthTested: false, proven: false });
    }

    // track auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => setUser(u));
        return () => unsub();
    }, [auth]);

    // fetch & enrich adverts
    useEffect(() => {
        (async () => {
            const q = query(collection(db, "studAds"), where("approved", "==", true));
            const snap = await getDocs(q);
            const raw = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.seconds || 0
            }));

            let favs = [];
            if (auth.currentUser) {
                const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                favs = uSnap.exists() ? uSnap.data().favourites || [] : [];
            }

            const enriched = await Promise.all(
                raw.map(async ad => {
                    const uSnap = await getDoc(doc(db, "users", ad.ownerId));
                    const owner = uSnap.exists() ? uSnap.data() : {};
                    return {
                        ...ad,
                        ownerDisplay:  owner.firstName
                            ? `${owner.firstName} ${owner.lastName?.charAt(0)}.`
                            : "Unknown",
                        ownerAvatar:   owner.avatar || "",
                        ownerLocation: owner.city
                            ? `${owner.city}${owner.postcode ? `, ${owner.postcode}` : ""}`
                            : "",
                        isFavourited:  favs.includes(ad.id)
                    };
                })
            );

            setAds(enriched);
            if (queryBreed) setSelectedBreed(queryBreed);
            const counts = {};
            enriched.forEach(ad => {
                const b = ad.breed || "Unknown";
                counts[b] = (counts[b]||0) + 1;
            });
            setBreedCounts(counts);
        })();
    }, [user]);

    // combined filter: breed + radius + sort
    useEffect(() => {
        const list = ads
            .filter(ad => {
                if (selectedBreed && ad.breed !== selectedBreed) {
                    console.log(`NO MATCH: ad.breed="${ad.breed}" !== selectedBreed="${selectedBreed}"`);
                    console.log("Raw ad.breed:", JSON.stringify(ad.breed));
                    console.log("Raw selectedBreed:", JSON.stringify(selectedBreed));
                    return false;
                }

                if (
                    queryRadius > 0 &&
                    originLat && originLng &&
                    ad.location?.latitude != null
                ) {
                    const d = haversineDistance(
                        originLat, originLng,
                        ad.location.latitude, ad.location.longitude
                    );
                    if (d > queryRadius) return false;
                }

                return true;
            })
            .sort((a, b) =>
                sortOrder === "newest"
                    ? b.createdAt - a.createdAt
                    : a.createdAt - b.createdAt
            );

        console.log("Filtered", list.length, "of", ads.length, "ads");

        setFilteredAds(list);
    }, [
        ads,
        selectedBreed,
        sortOrder,
        originLat,
        originLng,
        queryRadius
    ]);



    const topBreeds = Object.entries(breedCounts)
        .sort(([,a],[,b]) => b-a)
        .slice(0,20);

    // favourite/unfavourite handlers
    async function handleFavourite(id) {
        if (!user) return alert("Please log in");
        const uRef = doc(db,"users",user.uid);
        await updateDoc(uRef, { favourites: arrayUnion(id) });
        setAds(ads.map(ad => ad.id===id ? {...ad, isFavourited:true} : ad));
    }
    async function handleUnfavourite(id) {
        if (!user) return alert("Please log in");
        const uRef = doc(db,"users",user.uid);
        await updateDoc(uRef, { favourites: arrayRemove(id) });
        setAds(ads.map(ad => ad.id===id ? {...ad, isFavourited:false} : ad));
    }

    return (
        <div className="browse-studs-page">
            {/* Mobile filter */}
            <div className="mobile-only">
                <MobileFilterPanel
                    selectedBreed={selectedBreed}
                    setSelectedBreed={setSelectedBreed}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    maxFee={maxFee}
                    setMaxFee={setMaxFee}
                    selectedColour={selectedColour}
                    setSelectedColour={setSelectedColour}
                    selectedAgeRange={selectedAgeRange}
                    setSelectedAgeRange={setSelectedAgeRange}
                    filters={filters}
                    setFilters={setFilters}
                    topBreeds={topBreeds}
                />
            </div>

            {/* Desktop sidebar */}
            <aside className="browse-studs-sidebar desktop-only">
                <div className="browse-studs-filter-block">
                    <h3>Filter by Breed</h3>
                    <select
                        className="panel-select"
                        value={selectedBreed}
                        onChange={e => setSelectedBreed(e.target.value)}
                    >
                        <option value="">All Breeds</option>
                        {breedOptions.map(({value,label})=>(
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="browse-studs-filter-block">
                    <h3>Sort By</h3>
                    <select
                        className="panel-select"
                        value={sortOrder}
                        onChange={e=>setSortOrder(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="fee-asc">Lowest Stud Fee</option>
                        <option value="fee-desc">Highest Stud Fee</option>
                        <option value="age-asc">Youngest Age</option>
                        <option value="age-desc">Oldest Age</option>
                    </select>
                </div>

                <div className="browse-studs-filter-block">
                    <label>Max Stud Fee: £{maxFee||1000}</label>
                    <input
                        type="range"
                        className="panel-slider"
                        min="0" max="1000" step="25"
                        value={maxFee||0}
                        onChange={e=>setMaxFee(e.target.value)}
                    />
                </div>

                <div className="browse-studs-filter-block">
                    <label>Colour</label>
                    <select
                        className="panel-select"
                        value={selectedColour}
                        onChange={e=>setSelectedColour(e.target.value)}
                    >
                        <option value="">All Colours</option>
                        {["Red","Chocolate","Black","Cream","Apricot","Merle","Silver","White"]
                            .map(c=> <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="browse-studs-filter-block">
                    <label>Age Range</label>
                    <select
                        className="panel-select"
                        value={selectedAgeRange}
                        onChange={e=>setSelectedAgeRange(e.target.value)}
                    >
                        <option value="">Any Age</option>
                        {["Under 1 year","1 - 2 years","2 - 4 years","4+ years"]
                            .map(r=> <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div className="browse-studs-filter-block checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.kc}
                            onChange={()=>setFilters(f=>({...f,kc:!f.kc}))}
                        /> KC Registered
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.healthTested}
                            onChange={()=>setFilters(f=>({...f,healthTested:!f.healthTested}))}
                        /> Health Tested
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.proven}
                            onChange={()=>setFilters(f=>({...f,proven:!f.proven}))}
                        /> Proven
                    </label>
                </div>

                <div className="browse-studs-filter-block">
                    <h3>Popular Breeds</h3>
                    <div className="popular-breeds">
                        {topBreeds.map(([breed])=>(
                            <span
                                key={breed}
                                className="popular-breed"
                                onClick={()=>setSelectedBreed(breed)}
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

            {/* Stud cards */}
            <main className="browse-studs-content">
                {filteredAds.map(ad => (
                    <div
                        key={ad.id}
                        className="browse-studs-card"
                        onClick={()=>navigate(`/stud-details/${ad.id}`)}
                        style={{cursor:"pointer"}}
                    >
                        <div className="browse-studs-card-fee-pill">£{ad.fee}</div>
                        <div className="browse-studs-card-image">
                            <img
                                src={ad.images?.[0]||"https://placehold.co/400x300"}
                                alt={ad.title}
                                className="browse-studs-card-img"
                            />
                        </div>
                        <div className="browse-studs-card-details">
                            <p className="browse-studs-card-post-age">
                                {getAdAge(ad.createdAt)}
                            </p>
                            <h4 className="browse-studs-card-name">{ad.title}</h4>
                            <div className="browse-studs-card-pills">
                                <span className="browse-studs-pill">{ad.name}</span>
                                <span className="browse-studs-pill">{ad.breed}</span>
                                <span className="browse-studs-pill">
                  {ad.age} {ad.age===1?"year":"years"}
                </span>
                            </div>
                            {ad.location && originLat && originLng && (
                                <p className="browse-studs-card-distance">
                                    {haversineDistance(
                                        originLat,
                                        originLng,
                                        ad.location.latitude,
                                        ad.location.longitude
                                    ).toFixed(1)} km away
                                </p>
                            )}
                            <p className="browse-studs-card-description">
                                {ad.description?.length>200
                                    ? ad.description.slice(0,200)+"…"
                                    : ad.description}
                            </p>
                            <hr className="browse-studs-card-divider"/>
                            <div className="browse-studs-card-footer">
                                <div className="browse-studs-card-owner-info">
                                    <img
                                        src={ad.ownerAvatar||"https://placehold.co/40x40?text=Avatar"}
                                        alt={ad.ownerDisplay}
                                        className="browse-studs-owner-avatar"
                                    />
                                    <div className="browse-studs-owner-text">
                    <span className="browse-studs-owner-name">
                      {ad.ownerDisplay}
                    </span>
                                        <span className="browse-studs-owner-location">
                      {ad.ownerLocation}
                    </span>
                                    </div>
                                </div>
                                <button
                                    className="browse-studs-card-fav-btn"
                                    onClick={e=>{
                                        e.stopPropagation();
                                        ad.isFavourited
                                            ? handleUnfavourite(ad.id)
                                            : handleFavourite(ad.id);
                                    }}
                                    aria-label="Toggle Favourite"
                                >
                                    {ad.isFavourited
                                        ? <FaHeart color="red"/>
                                        : <FaRegHeart color="grey"/>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}
