import React from "react";
import "./Hero.css";

function Hero() {
    return (
        <section className="hero">
            <div className="hero-container">
                {/* LEFT: Form Section */}
                <div className="hero-form-container">
                    <form className="hero-form">
                        <select name="breed" className="form-input">
                            <option value="">Select Breed</option>
                            <option value="poodle">Poodle</option>
                            <option value="labrador">Labrador</option>
                            <option value="bulldog">Bulldog</option>
                            {/* Add more as needed */}
                        </select>

                        <input
                            type="text"
                            placeholder="Enter postcode"
                            className="form-input"
                        />

                        <button type="submit" className="form-button">
                            Search
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
                {/* Back wave - larger smooth wave */}
                <svg className="wave-back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path
                        fill="#3a7552"

                        d="M0,240L60,218.7C120,197,240,155,360,160C480,165,600,219,720,240C840,261,960,251,1080,218.7C1200,187,1320,133,1380,106.7L1440,80L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                    />
                </svg>

                {/* Front wave - more "bubbly" wave */}
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
