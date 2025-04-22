import React from "react";
import "./Recommended.css";

const recommendedDogs = [
    {
        name: "Charlie",
        breed: "Toy Poodle",
        rating: 4.8,
        price: "£250",
        image: "https://placehold.co/150x150" // ✅ Placeholder image
    },
    {
        name: "Archie",
        breed: "Golden Retriever",
        rating: 4.7,
        price: "£300",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Waffle",
        breed: "Cockapoo",
        rating: 4.6,
        price: "£225",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Roger",
        breed: "Labrador",
        rating: 4.9,
        price: "£280",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Max",
        breed: "Cavapoo",
        rating: 4.5,
        price: "£240",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Teddy",
        breed: "Shih Tzu",
        rating: 4.4,
        price: "£200",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Oscar",
        breed: "Pug",
        rating: 4.2,
        price: "£190",
        image: "https://placehold.co/150x150"
    },
    {
        name: "Reggie",
        breed: "French Bulldog",
        rating: 4.3,
        price: "£260",
        image: "https://placehold.co/150x150"
    }
];

function Recommended() {
    return (
        <section className="recommended-section">
            <div className="container">
                <h2>Recommended Stud Dogs</h2>
                <div className="card-grid">
                    {recommendedDogs.map((dog, index) => (
                        <div className="dog-card" key={index}>
                            <img src={dog.image} alt={dog.name} className="dog-image" />
                            <h3>{dog.name}</h3>
                            <p>{dog.breed}</p>
                            <p>⭐ {dog.rating}</p>
                            <p className="price">{dog.price}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Recommended;
