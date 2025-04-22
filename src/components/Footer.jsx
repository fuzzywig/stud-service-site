import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                {/* Column 1: About Us */}
                <div className="footer-column">
                    <h4>About Us</h4>
                    <p>
                        Stud Service Hub connects dog breeders and owners across the UK.
                        Our mission is to make finding the perfect stud dog fast, safe, and easy.
                    </p>
                </div>

                {/* Column 2: Social */}
                <div className="footer-column">
                    <h4>Follow Us</h4>
                    <ul>
                        <li><a href="#">Facebook</a></li>
                        <li><a href="#">Instagram</a></li>
                        <li><a href="#">TikTok</a></li>
                        <li><a href="#">YouTube</a></li>
                    </ul>
                </div>

                {/* Column 3: Popular Breeds */}
                <div className="footer-column">
                    <h4>Popular Breeds</h4>
                    <ul>
                        <li><Link to="/breed/french-bulldog">French Bulldog</Link></li>
                        <li><Link to="/breed/cocker-spaniel">Cocker Spaniel</Link></li>
                        <li><Link to="/breed/toy-poodle">Toy Poodle</Link></li>
                        <li><Link to="/breed/staffy">Staffy</Link></li>
                        <li><Link to="/breed/golden-retriever">Golden Retriever</Link></li>
                    </ul>
                </div>

                {/* Column 4: Site Menu */}
                <div className="footer-column">
                    <h4>Menu</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/browse">Browse Studs</Link></li>
                        <li><Link to="/new-advert">New Advert</Link></li>
                        <li><Link to="/login">Login</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Stud Service Hub. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
