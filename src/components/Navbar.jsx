import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaUser, FaEnvelope, FaTimes } from "react-icons/fa";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Navbar.css";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                console.log("✅ Logged in as:", user.uid);
            } else {
                console.log("🚫 No user logged in");
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const toggleDropdown = () => {
        setShowDropdown(prev => !prev);
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <button className="hamburger-btn" onClick={toggleMenu}>
                        <FaBars />
                    </button>
                    <Link to="/" className="logo">Stud Service Hub</Link>
                </div>

                <div className="navbar-right">
                    <Link to="/new-advert" className="advert-btn">New Advert</Link>

                    {currentUser ? (
                        <Link to={`/profile/${currentUser.uid}`} className="icon-link"><FaUser /></Link>
                    ) : (
                        <div className="dropdown-wrapper">
                            <button className="icon-link" onClick={toggleDropdown}><FaUser /></button>
                            {showDropdown && (
                                <div className="user-dropdown">
                                    <Link to="/login" onClick={() => setShowDropdown(false)}>Login</Link>
                                    <Link to="/register" onClick={() => setShowDropdown(false)}>Register</Link>
                                </div>
                            )}
                        </div>
                    )}

                    <Link to="/messages" className="icon-link"><FaEnvelope /></Link>
                </div>
            </nav>

            <div className={`menu-overlay ${menuOpen ? "open" : ""}`}>
                <div className="menu-header">
                    <button className="close-btn" onClick={toggleMenu}><FaTimes /></button>
                    <h2>Menu</h2>
                </div>
                <ul className="menu-items">
                    <li><Link to="/browse" onClick={toggleMenu}>Browse Studs</Link></li>
                    {currentUser ? (
                        <>
                            <li><Link to={`/profile/${currentUser.uid}`} onClick={toggleMenu}>My Profile</Link></li>
                            <li><Link to="/logout" onClick={toggleMenu}>Logout</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/login" onClick={toggleMenu}>Login</Link></li>
                            <li><Link to="/register" onClick={toggleMenu}>Register</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </>
    );
}

export default Navbar;
