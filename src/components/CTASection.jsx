import React from "react";
import "./CTASection.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDog, faStar, faSearch } from "@fortawesome/free-solid-svg-icons";

function CTASection() {
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
                    <a href="/new-advert" className="cta-button cta-button-primary">
                        <FontAwesomeIcon icon={faDog} /> Post Your Listing
                    </a>
                    <a href="/browse" className="cta-button cta-button-secondary">
                        <FontAwesomeIcon icon={faSearch} /> Browse Available Pets
                    </a>
                </div>
            </div>
        </section>
    );
}

export default CTASection;
