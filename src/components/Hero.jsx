import React, { useState, useEffect } from "react";
import Select from "react-select";
import { petBreedOptions, updatedPetCategories } from "../pages/data/breedOptions.js";
import "./Hero.css";
import { useNavigate } from "react-router-dom";

function Hero() {
    const [breed, setBreed] = useState(null);
    const [postcode, setPostcode] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("dogs");
    const [showStudDropdown, setShowStudDropdown] = useState(false);
    const [searchRadius, setSearchRadius] = useState(10); // default 10 miles

    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const navigate = useNavigate();
    const intent = selectedCategory.startsWith("stud-") ? "stud" : "sale";
    const rawKey = selectedCategory.replace("stud-", "");
    const displayName = updatedPetCategories[rawKey]?.name
        || rawKey.charAt(0).toUpperCase() + rawKey.slice(1);

    const moreCategories = [
        "rabbits",
        "rodents",
        "horses",
        "livestock",
        "birds",
        "reptiles",
        "fish",
        "invertebrates"
    ];

    const studCategories = ["dogs", "cats"];

    // Function to get dynamic Stud button text
    const getStudButtonText = () => {
        if (selectedCategory === "stud-dogs") {
            return "Stud Dogs";
        } else if (selectedCategory === "stud-cats") {
            return "Stud Cats";
        } else if (selectedCategory.startsWith("stud-")) {
            // Fallback for any other stud categories
            const animal = selectedCategory.replace("stud-", "");
            return `${animal.charAt(0).toUpperCase() + animal.slice(1)} Stud`;
        }
        return "Stud";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!postcode) {
            alert("Please enter a postcode.");
            return;
        }


        try {
            const apiKey = "pP8O9JNud0upxRnM9Fbs3w45793";
            const response = await fetch(`https://api.getAddress.io/find/${postcode}?api-key=${apiKey}`);

            const data = await response.json();

            if (!data || !data.latitude || !data.longitude) {
                alert("Could not retrieve coordinates for that postcode.");
                return;
            }

            // Determine the actual category to pass
            let categoryParam = selectedCategory;

            // If it's a stud category, extract the base category
            if (selectedCategory.startsWith('stud-')) {
                categoryParam = selectedCategory.replace('stud-', '');
            }

            // Make sure dogs and cats are plural to match what BrowseStuds expects
            if (categoryParam === 'dog') {
                categoryParam = 'dogs';
            } else if (categoryParam === 'cat') {
                categoryParam = 'cats';
            }

            const queryParams = {
                category: categoryParam,
                postcode,
                radius: searchRadius.toString(),
                lat: data.latitude,
                lng: data.longitude,
                intent: intent
            };

            if (breed?.value) {
                queryParams.breed = breed.value;
            }

            const query = new URLSearchParams(queryParams).toString();


            navigate(`/browse?${query}`);
        } catch (error) {
            console.error("Postcode lookup failed", error);
            alert("Something went wrong fetching location. Please try again.");
        }
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = (e) => {
        if (!e.target.closest(".hero-stud-dropdown-container") && showStudDropdown) {
            setShowStudDropdown(false);
        }
        if (!e.target.closest(".hero-more-dropdown-container") && showMoreDropdown) {
            setShowMoreDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showStudDropdown, showMoreDropdown]);

    return (
        <section className="hero-section">
            <div className="hero-container">
                {/* LEFT: Form Section */}
                <div className="hero-form-container">
                    <form className="hero-form" onSubmit={handleSubmit}>
                        {/* ——— Tabs: Dogs, Cats, Stud, More ——— */}
                        <div className="hero-category-toggle">
                            {/* Main tab buttons in equal containers */}
                            <div className="hero-tab-container">
                                <button
                                    type="button"
                                    className={`hero-category-button ${selectedCategory === "dogs" ? "hero-active" : ""}`}
                                    onClick={() => setSelectedCategory("dogs")}
                                >
                                    <i className="fa-solid fa-dog" style={{ marginRight: '6px' }}></i>
                                    Dogs
                                </button>
                            </div>

                            <div className="hero-tab-container">
                                <button
                                    type="button"
                                    className={`hero-category-button ${selectedCategory === "cats" ? "hero-active" : ""}`}
                                    onClick={() => setSelectedCategory("cats")}
                                >
                                    <i className="fa-solid fa-cat" style={{ marginRight: '6px' }}></i>
                                    Cats
                                </button>
                            </div>

                            {/* Stud Button with Dropdown */}
                            <div className="hero-tab-container hero-stud-dropdown-container hero-dropdown-container">
                                <button
                                    type="button"
                                    className={`hero-category-button hero-stud-btn 
    ${selectedCategory.startsWith("stud-") ? "hero-active" : ""} 
    ${showStudDropdown ? "hero-open" : ""}`
                                    }
                                    onClick={() => setShowStudDropdown(open => !open)}
                                >
                                    <i className="fa-solid fa-shield-dog" style={{ marginRight: '6px' }}></i>
                                    {getStudButtonText()}
                                </button>

                                {showStudDropdown && (
                                    <div className="hero-stud-dropdown">
                                        {studCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className={`hero-dropdown-item ${selectedCategory === `stud-${cat}` ? "hero-active" : ""}`}
                                                onClick={() => {
                                                    setSelectedCategory(`stud-${cat}`);
                                                    setBreed(null);
                                                    setShowStudDropdown(false);
                                                }}
                                            >
                                                Stud {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* More Button with Dropdown */}
                            <div className="hero-tab-container hero-more-dropdown-container hero-dropdown-container">
                                <button
                                    type="button"
                                    className={`hero-category-button hero-more-btn ${moreCategories.includes(selectedCategory) ? "hero-active" : ""} ${showMoreDropdown ? "hero-open" : ""}`}
                                    onClick={() => {
                                        setShowMoreDropdown(!showMoreDropdown);
                                        setShowStudDropdown(false);
                                    }}
                                >
                                    <span className="hero-category-icon">
                                        <svg className="hero-cat-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,8,12,8z M12,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,10,12,10z M12,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,16,12,16z" />
                                        </svg>
                                    </span>
                                    More
                                </button>
                                {showMoreDropdown && (
                                    <div className="hero-more-dropdown">
                                        {moreCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className={`hero-dropdown-item ${selectedCategory === cat ? "hero-active" : ""}`}
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setBreed(null);
                                                    setShowMoreDropdown(false);
                                                }}
                                            >
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ——— Breed / Type Selector ——— */}
                        {petBreedOptions[selectedCategory.replace('stud-', '')] && (
                            <div className="hero-form-field hero-form-field-select">
                                <div className="hero-input-icon">
                                    <svg className="hero-field-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,19h-2v-2h2V19z M15.07,11.25l-0.9,0.92 C13.45,12.9,13,13.5,13,15h-2v-0.5c0-1.1,0.45-2.1,1.17-2.83l1.24-1.26c0.37-0.36,0.59-0.86,0.59-1.41c0-1.1-0.9-2-2-2 c-1.1,0-2,0.9-2,2H8c0-2.21,1.79-4,4-4s4,1.79,4,4C16,9.92,15.66,10.67,15.07,11.25z" />
                                    </svg>
                                </div>
                                <Select
                                    className="hero-form-select"
                                    classNamePrefix="hero-select"
                                    options={petBreedOptions[selectedCategory.replace('stud-', '')].map(b => ({ value: b, label: b }))}
                                    placeholder={`Select ${updatedPetCategories[selectedCategory.replace('stud-', '')] ? updatedPetCategories[selectedCategory.replace('stud-', '')].name : 'Breed'}`}
                                    isClearable
                                    value={breed}
                                    onChange={setBreed}
                                    styles={{
                                        control: base => ({ ...base, borderRadius: 12, padding: "8px" }),
                                        menu: base => ({ ...base, zIndex: 999 }),
                                    }}
                                />
                            </div>
                        )}

                        {/* Fallback text input for categories without a breed list */}
                        {!petBreedOptions[selectedCategory.replace('stud-', '')] && (
                            <div className="hero-form-field">
                                <div className="hero-input-icon">
                                    <svg className="hero-field-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,19h-2v-2h2V19z M15.07,11.25l-0.9,0.92 C13.45,12.9,13,13.5,13,15h-2v-0.5c0-1.1,0.45-2.1,1.17-2.83l1.24-1.26c0.37-0.36,0.59-0.86,0.59-1.41c0-1.1-0.9-2-2-2 c-1.1,0-2,0.9-2,2H8c0-2.21,1.79-4,4-4s4,1.79,4,4C16,9.92,15.66,10.67,15.07,11.25z" />
                                    </svg>
                                </div>
                                <input
                                    className="hero-form-input"
                                    type="text"
                                    placeholder={`Enter ${updatedPetCategories[selectedCategory.replace('stud-', '')] ? updatedPetCategories[selectedCategory.replace('stud-', '')].name : 'Type'}`}
                                    value={breed?.value || ""}
                                    onChange={e => setBreed({ value: e.target.value, label: e.target.value })}
                                />
                            </div>
                        )}

                        {/* ——— Postcode ——— */}
                        <div className="hero-form-field">
                            <div className="hero-input-icon">
                                <svg className="hero-field-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5 s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z" />
                                </svg>
                            </div>
                            <input
                                className="hero-form-input"
                                type="text"
                                placeholder="Enter Postcode"
                                value={postcode}
                                onChange={e => setPostcode(e.target.value)}
                            />
                        </div>

                        {/* ——— Submit Button ——— */}
                        <button type="submit" className="hero-form-button">
                            <span className="hero-button-text">
                                Find {selectedCategory.includes('stud-')
                                ? `${getStudButtonText()}`
                                : (updatedPetCategories[selectedCategory]?.name || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1))}
                            </span>
                            <span className="hero-button-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                                </svg>
                            </span>
                        </button>
                    </form>
                </div>

                {/* RIGHT: Headline Text */}
                <div className="hero-text">
                    <h1>Puppies and Kittens for Sale the UK's Trusted Pet Marketplace</h1>
                    <p>
                        Join the UK’s trusted pet marketplace for puppies and kittens. Connect with local breeders nationwide on our secure platform. Find your new furry family member with ease.
                    </p>
                    <div className="hero-highlights">
                        <div className="hero-highlight-pill">
                            <i className="fas fa-dog"></i>
                            Puppies
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-cat"></i>
                            Kittens
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-shield-dog"></i>
                            Stud Services
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-tags"></i>
                            Pets for Sale
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-dog"></i>
                            French Bulldogs
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-dog"></i>
                            Labradors
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-cat"></i>
                            Maine Coons
                        </div>
                        <div className="hero-highlight-pill">
                            <i className="fas fa-cat"></i>
                            British Shorthairs
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Layered Waves at the bottom */}
            <div className="hero-waves">
                <svg className="hero-wave-back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path
                        fill="#3a7552"
                        d="M0,240L60,218.7C120,197,240,155,360,160C480,165,600,219,720,240C840,261,960,251,1080,218.7C1200,187,1320,133,1380,106.7L1440,80L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                    />
                </svg>

                <svg className="hero-wave-front" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path
                        fill="#66bb6a"
                        d="M0,256L48,240C96,224,192,192,288,176C384,160,480,160,576,170.7C672,181,768,203,864,213.3C960,224,1056,224,1152,208C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                </svg>
            </div>
        </section>
    );
}

export default Hero;