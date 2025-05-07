import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaEnvelope,
    FaTimes,
    FaSearch,
    FaDog,
    FaSignOutAlt,
    FaSignInAlt,
    FaUserPlus,
    FaPaw,
    FaPlus,
    FaHome,
    FaComments,
    FaHeart,
    FaBell,
    FaCog,
    FaQuestionCircle,
    FaListAlt,
    FaChevronRight
} from "react-icons/fa";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Navbar.css"; // Replace with the new CSS file
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";


function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const location = useLocation(); // Get current location from react-router
    const [activeItem, setActiveItem] = useState('/');
    const [userProfile, setUserProfile] = useState(null);

    // Update active item whenever the URL changes
    useEffect(() => {
        setActiveItem(location.pathname);
    }, [location]);

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

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserProfile(userSnap.data());
                        console.log("User profile data:", userSnap.data());

                    }

                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    const toggleMenu = () => {
        console.log("Menu toggled, was:", menuOpen);
        setMenuOpen(!menuOpen);
    };
    const toggleDropdown = () => {
        setShowDropdown(prev => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };
    const handleMenuItemClick = (path) => {
        setActiveItem(path);
        closeMenu();
    };

    // Determine if a path is active
    const isActive = (path) => activeItem === path;

    return (
        <>
            {/* Redesigned Top Navbar */}
            <nav className="navbar">
                <div className="navbar-inner">
                    <div className="navbar-left">
                        <button
                            className="hamburger-btn"
                            onClick={toggleMenu}
                            aria-label="Menu"
                            style={{
                                backgroundColor: "rgba(0, 0, 0, 0.2)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <FaBars size={20} />
                        </button>
                        <Link to="/" className="logo" onClick={() => setActiveItem('/')}>
                            <FaPaw className="logo-icon" />
                            <span></span>
                        </Link>
                    </div>

                    <div className="navbar-right">
                        <Link to="/new-advert" className="advert-btn" onClick={() => setActiveItem('/new-advert')}>
                            <FaPlus className="advert-btn-icon" />
                            <span className="desktop-only">New Advert</span>
                        </Link>

                        {currentUser ? (
                            <>
                                <Link to="/messages" className="icon-link has-notification" onClick={() => setActiveItem('/messages')}>
                                    <FaEnvelope />
                                </Link>
                                <Link to={`/profile/${currentUser.uid}`} className="icon-link" onClick={() => setActiveItem(`/profile/${currentUser.uid}`)}>
                                    <FaUser />
                                </Link>
                            </>
                        ) : (
                            <div className="dropdown-wrapper">
                                <button className="icon-link" onClick={toggleDropdown} aria-label="User menu">
                                    <FaUser />
                                </button>
                                {showDropdown && (
                                    <div className="user-dropdown">
                                        <Link to="/login" onClick={() => {
                                            setShowDropdown(false);
                                            setActiveItem('/login');
                                        }}>
                                            <FaSignInAlt className="dropdown-icon" />
                                            <span>Login</span>
                                        </Link>
                                        <Link to="/register" onClick={() => {
                                            setShowDropdown(false);
                                            setActiveItem('/register');
                                        }}>
                                            <FaUserPlus className="dropdown-icon" />
                                            <span>Register</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Backdrop overlay for mobile */}
            <div className={`backdrop ${menuOpen ? "show" : ""}`} onClick={closeMenu}></div>

            {/* Redesigned Sidebar Menu */}
            <div className={`menu-overlay ${menuOpen ? "open" : ""}`}>
                <div className="menu-header">
                    <h2><FaPaw /> Stud Service Hub</h2>
                    <button
                        className="close-btn"
                        onClick={closeMenu}
                        aria-label="Close menu"
                        style={{
                            backgroundColor: "#1c5235",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            border: "none"
                        }}
                    >
                        <span style={{ fontSize: "20px", fontWeight: "bold" }}>X</span>
                    </button>
                </div>

                {/* User profile section */}
                <div className="sidebar-user-section">
                    {currentUser ? (
                        <div className="sidebar-profile">
                            <div className="navbar-profile-avatar">
                                {userProfile?.avatar ? (
                                    <img
                                        src={userProfile.avatar}
                                        alt="User Avatar"
                                        className="navbar-avatar-img"
                                    />
                                ) : (
                                    <FaUser />
                                )}
                            </div>


                            <div className="profile-info">
                                <p className="profile-name">
                                    {userProfile?.firstName
                                        ? `${userProfile.firstName}${userProfile.lastName ? " " + userProfile.lastName.charAt(0) + "." : ""}`
                                        : "User"}
                                </p>


                                <p className="profile-status">
                                    <span className="status-dot"></span>
                                    Active Member
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="sidebar-guest">
                            <p>Welcome to Stud Service Hub</p>
                            <div className="guest-buttons">
                                <Link to="/login" className="guest-button login-btn" onClick={() => handleMenuItemClick('/login')}>
                                    <FaSignInAlt /> <span>Login</span>
                                </Link>
                                <Link to="/register" className="guest-button register-btn" onClick={() => handleMenuItemClick('/register')}>
                                    <FaUserPlus /> <span>Register</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories section */}
                <div className="sidebar-categories">
                    <h3>Popular Categories</h3>
                    <div className="category-chips">
                        <Link to="/category/dogs" className="category-chip" onClick={() => handleMenuItemClick('/category/dogs')}>
                            <FaDog /> Dogs
                        </Link>
                        <Link to="/category/cats" className="category-chip" onClick={() => handleMenuItemClick('/category/cats')}>
                            <FaPaw /> Cats
                        </Link>
                        <Link to="/category/popular" className="category-chip" onClick={() => handleMenuItemClick('/category/popular')}>
                            <FaHeart /> Popular
                        </Link>
                        <Link to="/category/new" className="category-chip" onClick={() => handleMenuItemClick('/category/new')}>
                            <FaBell /> New
                        </Link>
                    </div>
                </div>

                {/* Main navigation menu - FIXED VERSION */}
                <div className="sidebar-nav-frontend">
                    <ul className="menu-items">
                        {/* Basic navigation - always visible */}
                        <li className="menu-item">
                            <Link to="/" onClick={() => handleMenuItemClick('/')}>
                                <FaHome className="menu-icon" />
                                <span>Home</span>
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link to="/browse" onClick={() => handleMenuItemClick('/browse')}>
                                <FaSearch className="menu-icon" />
                                <span>Browse Studs</span>
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link to="/new-advert" onClick={() => handleMenuItemClick('/new-advert')}>
                                <FaPlus className="menu-icon" />
                                <span>New Advert</span>
                            </Link>
                        </li>

                        {/* User-specific links */}
                        {currentUser && (
                            <>
                                <li className="menu-item">
                                    <Link to={`/profile/${currentUser.uid}`} onClick={() => handleMenuItemClick(`/profile/${currentUser.uid}`)}>
                                        <FaUser className="menu-icon" />
                                        <span>My Profile</span>
                                    </Link>
                                </li>
                                <li className="menu-item">
                                    <Link to="/messages" onClick={() => handleMenuItemClick('/messages')}>
                                        <FaComments className="menu-icon" />
                                        <span>Messages</span>
                                    </Link>
                                </li>
                                <li className="menu-item">
                                    <Link to={`/profile/${currentUser?.uid}`} onClick={() => handleMenuItemClick(`/profile/${currentUser?.uid}`)}>
                                        <FaListAlt className="menu-icon" />
                                        <span>My Listings</span>
                                    </Link>
                                </li>

                                <li className="menu-item">
                                    <Link to="/Favourites" onClick={() => handleMenuItemClick('/Favourites')}>
                                        <FaHeart className="menu-icon" />
                                        <span>Favourites</span>
                                    </Link>
                                </li>

                            </>
                        )}

                        {/* Guest links */}
                        {!currentUser && (
                            <>
                                <li className="menu-item">
                                    <Link to="/login" onClick={() => handleMenuItemClick('/login')}>
                                        <FaSignInAlt className="menu-icon" />
                                        <span>Login</span>
                                    </Link>
                                </li>
                                <li className="menu-item">
                                    <Link to="/register" onClick={() => handleMenuItemClick('/register')}>
                                        <FaUserPlus className="menu-icon" />
                                        <span>Register</span>
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Help - always visible */}
                        <li className="menu-item">
                            <Link to="/help" onClick={() => handleMenuItemClick('/help')}>
                                <FaQuestionCircle className="menu-icon" />
                                <span>Help & Support</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Footer section with logout button for logged-in users */}
                {currentUser && (
                    <div className="sidebar-footer">
                        <p className="sidebar-footer-text">Logged in as {currentUser.email}</p>
                        <Link to="/logout" className="logout-button" onClick={() => handleMenuItemClick('/logout')}>
                            <FaSignOutAlt />
                            <span>Logout</span>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

export default Navbar;