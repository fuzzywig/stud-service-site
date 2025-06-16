import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./PopularBreeds.css";

const popularBreedsData = [
    {
        name: "Labrador Retriever",
        adverts: 1247,
        imageName: "labrador-retriever.png",
        link: "/blog/labrador-retriever-breed-guide-health-temperament-tips"
    },
    {
        name: "French Bulldog",
        adverts: 923,
        imageName: "french-bulldog.png",
        link: "/blog/french-bulldog-breed-guide-temperament-health"
    },
    {
        name: "Golden Retriever",
        adverts: 856,
        imageName: "golden-retriever.png",
        link: "/blog/golden-retriever-breed-guide-temperament-history"
    },
    {
        name: "German Shepherd",
        adverts: 734,
        imageName: "german-shepherd.png",
        link: "/blog/german-shepherd-breed-guide-loyalty-intelligence"
    },
    {
        name: "Cocker Spaniel",
        adverts: 12,
        imageName: "cocker-spaniel.png",
        link: "/blog/cocker-spaniel-breed-guide-appearance-health-personality"
    },
    {
        name: "Bulldog",
        adverts: 8,
        imageName: "bulldog.png",
        link: "/blog/english-bulldog-breed-guide-health-temperament-daily-care"
    },
    {
        name: "Poodle",
        adverts: 5,
        imageName: "toy-poodle.png",
        link: "/blog/toy-poodle-breed-guide-intelligence-grooming-care-tips"
    },
    {
        name: "Border Collie",
        adverts: 15,
        imageName: "border-collie.png",
        link: "/blog/border-collie-breed-guide-energy-intelligence-care-in-the-uk"
    }
];

function PopularBreeds() {
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadImages = async () => {
            const storage = getStorage();
            const breedsWithImages = await Promise.all(
                popularBreedsData.map(async (breed) => {
                    try {
                        const imageRef = ref(storage, `images/PopularBreedsImages/${breed.imageName}`);
                        const imageUrl = await getDownloadURL(imageRef);
                        return { ...breed, image: imageUrl };
                    } catch (error) {
                        console.error(`Failed to load image for ${breed.name}:`, error);
                        return {
                            ...breed,
                            image: "https://via.placeholder.com/300x300?text=Dog+Image"
                        };
                    }
                })
            );
            setBreeds(breedsWithImages);
            setLoading(false);
        };

        loadImages();
    }, []);

    if (loading) {
        return (
            <section className="popular-breeds-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Popular Breeds</h2>
                        <p>Loading...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="popular-breeds-section">
            <div className="container">
                <div className="section-header">
                    <h2>Popular Breeds</h2>
                    <p>Discover the most sought-after dog breeds</p>
                </div>
                <div className="breed-grid-horizontal">
                    {breeds.map((breed, index) => (
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
                                        loading="lazy"
                                    />
                                </div>
                                <div className="breed-info">
                                    <h3>{breed.name}</h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PopularBreeds;