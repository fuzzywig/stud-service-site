import React, { useEffect, useState } from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter, FaChevronUp } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { getPopularBreeds } from "../utils/getPopularBreeds";

const Footer = ({ onResetCookieConsent }) => {
    const [popularBreeds, setPopularBreeds] = useState({ dog: [], cat: [] });

    useEffect(() => {
        const load = async () => {
            const data = await getPopularBreeds();
            console.log("🔥 Popular breeds loaded:", data);
            setPopularBreeds(data);
        };
        load().catch(console.error);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="mpc-footer">
            <div className="mpc-footer-content">
                <div className="mpc-footer-col">
                    <img src="https://placehold.co/120x70" alt="Stud Service Hub" className="mpc-footer-logo" />
                    <p>We connect responsible dog breeders with loving homes. Whether you're searching for a stud dog or planning your next litter, our platform offers verified profiles, real-time messaging, and trusted breeder reviews, all in one place.</p>
                    <div className="mpc-footer-social-icons">
                        <FaFacebookF />
                        <FaInstagram />
                        <FaTwitter />
                    </div>
                </div>

                <div className="mpc-footer-col">
                    <h4>Popular Dog Breeds</h4>
                    <ul>
                        {popularBreeds.dog.map((breed, i) => (
                            <li key={i}>
                                <Link to={`/browse?category=dogs&breed=${encodeURIComponent(breed)}`}>
                                    {breed}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mpc-footer-col">
                    <h4>Popular Cat Breeds</h4>
                    <ul>
                        {popularBreeds.cat.map((breed, i) => (
                            <li key={i}>
                                <Link to={`/browse?category=cats&breed=${encodeURIComponent(breed)}`}>
                                    {breed}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mpc-footer-col">
                    <h4>Company & Support</h4>
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/terms-of-service">Terms of Service</Link></li>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/cookie-policy">Cookie Policy</Link></li>
                        <li><Link to="/help">FAQ</Link></li>
                        <li><Link to="/breeding-guide">Breeding Guide</Link></li>
                        <li><Link to="/help?tab=ticket">Contact Us</Link></li>
                    </ul>
                </div>
            </div>

            <div className="mpc-footer-bottom">
                <div className="mpc-footer-container mpc-footer-bottom-flex">
                    <div className="mpc-footer-cookie-info">
                        © 2025 My Pet Connect. This site uses cookies to personalise content and analyse traffic.
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            onResetCookieConsent();
                        }}> Manage Cookie Preferences</a>
                    </div>

                    <div className="mpc-footer-scroll-top" onClick={scrollToTop}>
                        <FaChevronUp />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;