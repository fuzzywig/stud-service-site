import React from "react";
import "./CTASection.css";

function CTASection() {
    return (
        <section className="cta-section">
            <div className="cta-container">
                <h2>Ready to find the perfect match for your dog?</h2>
                <p>Post your advert today and connect with top-rated studs across the UK.</p>
                <a href="/new-advert" className="cta-button">Post Your Advert</a>
            </div>
        </section>
    );
}

export default CTASection;
