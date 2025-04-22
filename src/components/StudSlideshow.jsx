import React, { useState } from "react";
import "./StudSlideshow.css";

const placeholderImages = Array.from({ length: 10 }, (_, i) =>
    `https://placehold.co/600x400?text=Dog+${i + 1}`
);

function StudSlideshow() {
    const [currentImage, setCurrentImage] = useState(0);

    const nextSlide = () => {
        setCurrentImage((prev) =>
            prev === placeholderImages.length - 1 ? 0 : prev + 1
        );
    };

    const prevSlide = () => {
        setCurrentImage((prev) =>
            prev === 0 ? placeholderImages.length - 1 : prev - 1
        );
    };

    return (
        <div className="stud-slideshow-wrapper">
            <div className="main-image-container">
                <img
                    src={placeholderImages[currentImage]}
                    alt={`Dog ${currentImage + 1}`}
                    className="main-image"
                />
                <button className="nav left" onClick={prevSlide}>
                    &#10094;
                </button>
                <button className="nav right" onClick={nextSlide}>
                    &#10095;
                </button>
            </div>

            <div className="thumbnail-container">
                {placeholderImages.map((img, index) => (
                    <img
                        key={index}
                        src={img}
                        alt={`Thumb ${index + 1}`}
                        className={`thumbnail ${index === currentImage ? "active" : ""}`}
                        onClick={() => setCurrentImage(index)}
                    />
                ))}
            </div>
        </div>
    );
}

export default StudSlideshow;
