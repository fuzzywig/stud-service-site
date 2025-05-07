import React from 'react';
import './Footer.css'; // Create this file for styling
import { FaFacebookF, FaInstagram, FaTwitter, FaChevronUp } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer">

            <div className="footer-content">
                <div className="footer-col">
                    <img
                        src="https://placehold.co/100x60"
                        alt="Placeholder Logo"
                        className="footer-logo"
                    />                    <p>Find the perfect stud dog for your next litter. Trusted breeders, verified adverts.</p>
                    <div className="social-icons">
                        <FaFacebookF />
                        <FaInstagram />
                        <FaTwitter />
                    </div>
                </div>
                <div className="footer-col">
                    <h4>Popular Breeds</h4>
                    <ul>
                        <li>Labrador</li>
                        <li>French Bulldog</li>
                        <li>Cocker Spaniel</li>
                        <li>Poodle</li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li>Sitemap</li>
                        <li>Terms of Service</li>
                        <li>Privacy Policy</li>
                        <li>Cookie Policy</li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Help</h4>
                    <ul>
                        <li>Live Chat</li>
                        <li>FAQ</li>
                        <li>Terms & Conditions</li>
                        <li>Contact Us</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-container">
                    <span>© 2025 Stud Service Hub. All rights reserved.</span>
                    <div className="footer-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        <FaChevronUp />
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
