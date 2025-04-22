// src/components/PopularBreeds.jsx
import React from "react";
import "./PopularBreeds.css";

const popularBreeds = [
    {
        name: "Labrador Retriever",
        searches: 1250,
        image: "https://placehold.co/300x200",
    },
    {
        name: "French Bulldog",
        searches: 980,
        image: "https://placehold.co/300x200",
    },
    {
        name: "Cocker Spaniel",
        searches: 860,
        image: "https://placehold.co/300x200",
    },
    {
        name: "Toy Poodle",
        searches: 790,
        image: "https://placehold.co/300x200",
    },
    {
        name: "Staffordshire Bull Terrier",
        searches: 710,
        image: "https://placehold.co/300x200",
    },
    {
        name: "Staffordshire Bull Terrier",
        searches: 710,
        image: "https://placehold.co/300x200",
    },
];

function PopularBreeds() {
    return (
        <section className="popular-breeds-section">
            <div className="container">
                <h2>Popular Breeds</h2>
                <div className="breed-grid">
                    {popularBreeds.map((breed, index) => (
                        <div className="breed-card" key={index}>
                            <img src={breed.image} alt={breed.name} className="breed-img" />
                            <div className="breed-info">
                                <h3>{breed.name}</h3>
                                <p>{breed.searches.toLocaleString()} searches</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PopularBreeds;
