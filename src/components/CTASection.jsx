import React from "react";
import "./CTASection.css";

function CTASection() {
    return (
        <section className="cta-section">
            <div className="cta-container">
                <h2>Quality studs and serious handlers—all in one place</h2>
                <p>Post your stud advert or browse proven studs across the UK—find your perfect match now.</p>
                <div className="cta-buttons">
                    <a href="/new-advert" className="cta-button primary">Post Your Advert</a>
                    <a href="/browse" className="cta-button secondary">Browse Studs</a>
                </div>
                <div className="social-proof">
                    <div className="user-avatars">
                        <img src="https://placehold.co/400" alt="User testimonial" />
                        <img src="https://placehold.co/400" alt="User testimonial" />
                        <img src="https://placehold.co/400" alt="User testimonial" />
                    </div>
                    <div className="social-text">
                        <p>Joined by <span>1,200+</span> dog owners</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTASection;