import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase"; // Adjust path as needed
import "./CTASection.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDog, faStar, faSearch } from "@fortawesome/free-solid-svg-icons";

function CTASection({ onLoginClick }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const navigate = useNavigate();

    // Monitor auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setUserLoaded(true);
        });

        return () => unsubscribe();
    }, []);

    // Fetch user profile when user changes
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserProfile(userSnap.data());
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    const handlePostListingClick = async (e) => {
        e.preventDefault();

        if (!userLoaded) return;

        if (!currentUser) {
            alert("To publish a new advert, please sign in or register first.");
            onLoginClick(); // Open login modal
        } else {
            // Check user's breeder type
            try {
                let breederType = userProfile?.breederType;

                // If userProfile isn't loaded yet, fetch it
                if (!breederType && currentUser) {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        breederType = userSnap.data().breederType;
                    }
                }

                // Route based on breeder type
                if (breederType === 'rescue') {
                    navigate("/adwizard-rescue");
                } else {
                    navigate("/new-advert");
                }
            } catch (error) {
                console.error("Error checking breeder type:", error);
                // Default to regular advert if there's an error
                navigate("/new-advert");
            }
        }
    };

    return (
        <section className="cta-section">
            <div className="cta-container">
                <div className="cta-badge">
                    <FontAwesomeIcon icon={faStar} /> Trusted by Dog Lovers Nationwide
                </div>

                <h2 className="cta-title">
                    Discover, Connect & Advertise — All in One Place
                </h2>

                <p className="cta-description">
                    Whether you're a verified breeder, a proud pet owner, or someone searching for their next companion — we make it simple to connect with the right people.
                </p>

                <div className="cta-buttons">
                    <button
                        className="cta-button cta-button-primary"
                        onClick={handlePostListingClick}
                    >
                        <FontAwesomeIcon icon={faDog} /> Post Your Listing
                    </button>
                    <a href="/browse" className="cta-button cta-button-secondary">
                        <FontAwesomeIcon icon={faSearch} /> Browse Available Pets
                    </a>
                </div>
            </div>
        </section>
    );
}

export default CTASection;