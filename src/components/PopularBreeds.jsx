import React from "react";
import { Link } from "react-router-dom";
import "./PopularBreeds.css";

const popularBreeds = [
    {
        name: "Labrador Retriever",
        adverts: 1247,
        image: "/images/PopularBreedsImages/labrador-retriever.png",
        link: "/blog/labrador-retriever-breed-guide-health-temperament-tips"
    },
    {
        name: "French Bulldog",
        adverts: 923,
        image: "/images/PopularBreedsImages/french-bulldog.png",
        link: "/blog/french-bulldog-breed-guide-temperament-health"
    },
    {
        name: "Golden Retriever",
        adverts: 856,
        image: "/images/PopularBreedsImages/golden-retriever.png",
        link: "/blog/golden-retriever-breed-guide-temperament-history"
    },
    {
        name: "German Shepherd",
        adverts: 734,
        image: "/images/PopularBreedsImages/german-shepherd.png",
        link: "/blog/german-shepherd-breed-guide-loyalty-intelligence"
    },
    {
        name: "Cocker Spaniel",
        adverts: 12,
        image: "/images/PopularBreedsImages/cocker-spaniel.png",
        link: "/blog/cocker-spaniel-breed-guide-appearance-health-personality"
    },
    {
        name: "Bulldog",
        adverts: 8,
        image: "/images/PopularBreedsImages/bulldog.png",
        link: "/blog/english-bulldog-breed-guide-health-temperament-daily-care"
    },
    {
        name: "Poodle",
        adverts: 5,
        image: "/images/PopularBreedsImages/toy-poodle.png",
        link: "/blog/toy-poodle-breed-guide-intelligence-grooming-care-tips"
    },
    {
        name: "Border Collie",
        adverts: 15,
        image: "/images/PopularBreedsImages/border-collie.png",
        link: "/blog/border-collie-breed-guide-energy-intelligence-care-in-the-uk"
    }
];

function PopularBreeds() {
    return (
        <section className="popular-breeds-section">
            <div className="container">
                <div className="section-header">
                    <h2>Popular Breeds</h2>
                    <p>Discover the most sought-after dog breeds</p>
                </div>
                <div className="breed-grid-horizontal">
                    {popularBreeds.map((breed, index) => {
                        console.log(`Rendering: ${breed.name}, Image Path: ${breed.image}`);
                        return (
                            <Link
                                to={breed.link}
                                className="breed-card-link"
                                key={index}
                            >
                                <div className="breed-card">
                                    <div className="breed-image-container">
                                        <img
                                            src={breed.image}
                                            alt={breed.name}
                                            className="breed-img"
                                            onError={() =>
                                                console.error(`Image failed to load: ${breed.image}`)
                                            }
                                        />
                                    </div>
                                    <div className="breed-info">
                                        <h3>{breed.name}</h3>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default PopularBreeds;
