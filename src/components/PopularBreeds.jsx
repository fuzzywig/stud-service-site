import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import "./PopularBreeds.css";

const breedImages = {
    "Labrador Retriever": "https://images.dog.ceo/breeds/labrador/n02099712_6857.jpg",
    "French Bulldog": "https://images.dog.ceo/breeds/bulldog-french/n02108915_10111.jpg",
    "Cocker Spaniel": "https://images.dog.ceo/breeds/spaniel-cocker/n02102318_3255.jpg",
    "Toy Poodle": "https://images.dog.ceo/breeds/poodle-toy/n02113624_9545.jpg",
    "Staffordshire Bull Terrier": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Staffordshire_Bull_Terrier.jpg",
    // Add more as needed
    default: "https://placehold.co/300x200?text=Breed",
};

function PopularBreeds() {
    const [popularBreeds, setPopularBreeds] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        const fetchPopularBreeds = async () => {
            try {
                const q = query(collection(db, "studAds"), where("approved", "==", true));
                const snapshot = await getDocs(q);

                const breedCounts = {};
                snapshot.forEach((doc) => {
                    const breed = doc.data().breed || "Unknown";
                    breedCounts[breed] = (breedCounts[breed] || 0) + 1;
                });

                const sortedBreeds = Object.entries(breedCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([name, count]) => ({
                        name,
                        searches: count,
                        image: breedImages[name] || breedImages.default,
                    }));

                setPopularBreeds(sortedBreeds);
            } catch (error) {
                console.error("Error fetching popular breeds:", error);
            }
        };

        fetchPopularBreeds();
    }, []);

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
                                <p>{breed.searches.toLocaleString()} active adverts</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PopularBreeds;
