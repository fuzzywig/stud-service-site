import React, { useState } from "react";
import Select from "react-select";
import { breedOptions } from "./breedOptions"; // Contains all 224 breeds
import "./Hero.css";
import { useNavigate } from "react-router-dom";


function Hero() {
    // Set "stud" as the default selected category
    const [breed, setBreed] = useState(null);
    const [postcode, setPostcode] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("stud");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedCategory !== "stud") return;

        if (!breed || !postcode) {
            alert("Please select a breed and enter a postcode.");
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

            const query = new URLSearchParams({
                breed: breed.value,
                postcode,
                radius: "10",
                lat: data.latitude,
                lng: data.longitude
            }).toString();


            navigate(`/browse?${query}`);
        } catch (error) {
            console.error("Postcode lookup failed", error);
            alert("Something went wrong fetching location. Please try again.");
        }
    };



    return (
        <section className="hero">
            <div className="hero-container">
                {/* LEFT: Form Section */}
                <div className="hero-form-container">
                    <form className="hero-form" onSubmit={handleSubmit}>
                        <div className="category-toggle">
                            {["stud", "for-sale", "accessories"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`category-button ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "stud" && (
                                        <>
                                            <span className="category-icon">
                                                {/* FontAwesome dog icon */}
                                                <svg viewBox="0 0 576 512" className="cat-icon">
                                                    <path fill="currentColor" d="M309.6 158.5L332.7 19.8C334.6 8.4 344.5 0 356.1 0c7.5 0 14.5 3.5 19 9.5L392 32h52.1c12.7 0 24.9 5.1 33.9 14.1L496 64h56c13.3 0 24 10.7 24 24v24c0 44.2-35.8 80-80 80H464 448 426.7l-5.1 30.5-112-64zM416 256.1L416 480c0 17.7-14.3 32-32 32H352c-17.7 0-32-14.3-32-32V364.8c-24 12.3-51.2 19.2-80 19.2s-56-6.9-80-19.2V480c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V249.8c-28.8-10.9-51.4-35.3-59.2-66.5L1 167.8c-4.3-17.1 6.1-34.5 23.3-38.8s34.5 6.1 38.8 23.3l3.9 15.5C70.5 182 83.3 192 98 192h30 16H303.8L416 256.1zM464 80a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/>
                                                </svg>
                                            </span>
                                            <span className="category-text">Stud</span>
                                        </>
                                    )}
                                    {cat === "for-sale" && (
                                        <>
                                            <span className="category-icon">
                                                <svg viewBox="0 0 24 24" className="cat-icon">
                                                    <path fill="currentColor" d="M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58M5.5,7C4.67,7 4,6.33 4,5.5C4,4.67 4.67,4 5.5,4C6.33,4 7,4.67 7,5.5C7,6.33 6.33,7 5.5,7Z" />
                                                </svg>
                                            </span>
                                            <span className="category-text">For Sale</span>
                                        </>
                                    )}
                                    {cat === "accessories" && (
                                        <>
                                            <span className="category-icon">
                                                <svg viewBox="0 0 24 24" className="cat-icon">
                                                    <path fill="currentColor" d="M12,3C10.73,3 9.6,3.8 9.18,5H3V7H4.95L2,14C1.53,16 3,17 5.5,17C8,17 9.56,16 9,14L6.05,7H9.17C9.5,7.85 10.15,8.5 11,8.83V20H2V22H22V20H13V8.82C13.85,8.5 14.5,7.85 14.82,7H17.95L15,14C14.53,16 16,17 18.5,17C21,17 22.56,16 22,14L19.05,7H21V5H14.83C14.4,3.8 13.27,3 12,3M12,5A1,1 0 0,1 13,6A1,1 0 0,1 12,7A1,1 0 0,1 11,6A1,1 0 0,1 12,5M5.5,10.25L7,14H4L5.5,10.25M18.5,10.25L20,14H17L18.5,10.25Z" />
                                                </svg>
                                            </span>
                                            <span className="category-text">Accessories</span>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="form-field">
                            <Select
                                className="form-select"
                                classNamePrefix="react-select"
                                options={breedOptions}
                                placeholder="Select Breed"
                                isClearable
                                value={breed}
                                onChange={(selected) => setBreed(selected)}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.07)",
                                        padding: "12px 16px",
                                        cursor: "pointer"
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? "#a03248" : // Changed to match toggle color
                                            state.isFocused ? "#f8e7ea" : "#fff", // Lighter shade of the same color
                                        color: state.isSelected ? "#fff" : "#333",
                                        cursor: "pointer",
                                        borderRadius: "4px",
                                        margin: "2px 5px",
                                        padding: "10px",
                                        whiteSpace: "normal", // Allow text to wrap
                                        wordWrap: "break-word" // Break long words
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                                        overflow: "hidden",
                                        backgroundColor: "#ffffff",
                                        zIndex: 100,
                                        width: "100%" // Ensure menu doesn't exceed container width
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        padding: "8px",
                                        backgroundColor: "#ffffff",
                                        overflowX: "hidden" // Hide horizontal scrollbar
                                    }),
                                    indicatorSeparator: () => ({
                                        display: "none"
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        color: "#a03248", // Changed to match toggle color
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: "#888",
                                        fontSize: "15px",
                                        fontWeight: "500"
                                    }),
                                }}
                            />
                        </div>

                        <div className="form-field">
                            <div className="input-icon">
                                <svg viewBox="0 0 24 24" className="field-icon">
                                    <path fill="currentColor" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Postcode"
                                className="form-input"
                                value={postcode}
                                onChange={(e) => setPostcode(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="form-button">
                            <span className="button-text">Find Dogs</span>
                            <span className="button-icon">
                                <svg viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                                </svg>
                            </span>
                        </button>
                    </form>
                </div>

                {/* RIGHT: Headline Text */}
                <div className="hero-text">
                    <h1>Find the Perfect Stud Dog</h1>
                    <p>
                        Quickly discover top stud dogs near you, tailored to your breed and location.
                    </p>
                </div>
            </div>

            {/* Enhanced Layered Waves at the bottom */}
            <div className="hero-waves">
                <svg className="wave-back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path
                        fill="#3a7552"
                        d="M0,240L60,218.7C120,197,240,155,360,160C480,165,600,219,720,240C840,261,960,251,1080,218.7C1200,187,1320,133,1380,106.7L1440,80L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                    />
                </svg>

                <svg className="wave-front" viewBox="0 0 1440 320" preserveAspectRatio="none">
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