import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // at the top
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { getPopularBreeds } from "../utils/getPopularBreeds";
import {
    FaBars,
    FaUser,
    FaCat,
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
    FaTrophy,
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


function Navbar({ onLoginClick }) {    const [menuOpen, setMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const location = useLocation(); // Get current location from react-router
    const [activeItem, setActiveItem] = useState('/');
    const [userProfile, setUserProfile] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [userLoaded, setUserLoaded] = useState(false);
    // NEW: sidebar “chips” state
    const [topBreeds, setTopBreeds]     = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    const listingsRef = collection(db, "allListings");

    // Update active item whenever the URL changes

    // after: const [topBreeds, setTopBreeds] = useState([]);
    useEffect(() => {
        async function loadTopBreeds() {
            const snap = await getDocs(
                query(collection(db, "allListings"), where("approved", "==", true))
            );
            const breedsByCategory = {};

            snap.forEach(doc => {
                const data = doc.data();
                const breed = data.breed || data.breedOrType;
                const category = data.category; // Get the category too

                if (breed && category) {
                    const key = `${category}:${breed}`;
                    breedsByCategory[key] = (breedsByCategory[key] || 0) + 1;
                }
            });

            // Get top 4 breeds with their categories
            const top4 = Object.entries(breedsByCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([key]) => {
                    const [category, breed] = key.split(':');
                    return { breed, category };
                });

            setTopBreeds(top4);
        }
        loadTopBreeds().catch(console.error);
    }, []);



    useEffect(() => {
        setActiveItem(location.pathname);
    }, [location]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);





    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setUserLoaded(true); // ✅ this enables logic to run
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "conversations"),
            where("users", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, snapshot => {
            let hasUnread = false;

            snapshot.forEach(doc => {
                const data = doc.data();
                const msg = data.lastMessage;

                if (
                    msg &&
                    msg.senderId !== currentUser.uid &&
                    (!msg.readBy || !msg.readBy.includes(currentUser.uid))
                ) {
                    hasUnread = true;
                }
            });

            setHasUnreadMessages(hasUnread);
        });

        return () => unsubscribe();
    }, [currentUser]);




    // NEW: load sidebar chips data




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
                        <button
                            type="button"
                            className="navbar-new-advert-btn"
                            onClick={() => {
                                if (!userLoaded) return;

                                if (!currentUser) {
                                    alert("To publish a new advert, please sign in or register first.");
                                    handleMenuItemClick(); // close sidebar
                                    onLoginClick(); // ✅ open modal instead of navigating to /login
                                } else {
                                    handleMenuItemClick("/new-advert");
                                    navigate("/new-advert");
                                }
                            }}

                        >
                            <FaPlus className="navbar-new-advert-icon" />
                            <span className="navbar-new-advert-text">New Advert</span>
                        </button>

                        {currentUser && (
                            <Link to="/messages" className={`icon-link ${hasUnreadMessages ? "has-notification" : ""}`}>
                                <FaComments />
                            </Link>

                        )}



                        <div className="dropdown-wrapper" ref={dropdownRef}>
                            <button className="icon-link" onClick={toggleDropdown} aria-label="User menu">
                                <FaUser />
                            </button>

                            {showDropdown && (
                                <div className="user-dropdown">
                                    {currentUser ? (
                                        <>
                                            <Link
                                                to={`/profile/${currentUser.uid}`}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    setActiveItem(`/profile/${currentUser.uid}`);
                                                }}
                                            >
                                                <FaUser className="dropdown-icon" />
                                                <span>My Profile</span>
                                            </Link>

                                            <Link
                                                to="/favourites"
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    setActiveItem('/favourites');
                                                }}
                                            >
                                                <FaHeart className="dropdown-icon" />
                                                <span>Favourites</span>
                                            </Link>

                                            <Link
                                                to="/my-adverts"
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    setActiveItem('/my-adverts');
                                                }}
                                            >
                                                <FaListAlt className="dropdown-icon" />
                                                <span>My Adverts</span>
                                            </Link>

                                            <button
                                                className="dropdown-item"
                                                onClick={async () => {
                                                    setShowDropdown(false);
                                                    await auth.signOut();
                                                    navigate("/");
                                                }}
                                            >
                                                <FaSignOutAlt className="dropdown-icon" />
                                                <span>Logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    onLoginClick();
                                                }}
                                            >
                                                <FaSignInAlt className="dropdown-icon" />
                                                <span>Login</span>
                                            </button>

                                            <Link
                                                to="/register"
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    setActiveItem('/register');
                                                }}
                                            >
                                                <FaUserPlus className="dropdown-icon" />
                                                <span>Register</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>


                </div>
            </nav>

            {/* Backdrop overlay for mobile */}
            <div className={`backdrop ${menuOpen ? "show" : ""}`} onClick={closeMenu}></div>

            {/* Redesigned Sidebar Menu */}
            <div className={`menu-overlay ${menuOpen ? "open" : ""}`}>
                <div className="menu-header">
                    <h2>Sidebar</h2>
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
                                {/* LOGIN: keep as <Link> for styling but prevent navigation */}
                                <Link
                                    to="/login"
                                    className="guest-button login-btn"
                                    onClick={e => {
                                        e.preventDefault();   // stop the route change
                                        handleMenuItemClick(); // close sidebar
                                        onLoginClick();        // open modal
                                    }}
                                >
                                    <FaSignInAlt /> <span>Login</span>
                                </Link>

                                {/* REGISTER: normal navigation */}
                                <Link
                                    to="/register"
                                    className="guest-button register-btn"
                                    onClick={() => handleMenuItemClick('/register')}
                                >
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

                        {/* Top 3 Breeds */}
                        {topBreeds.map(({ breed, category }) => (
                            <Link
                                key={`${category}-${breed}`}
                                to={`/browse?category=${category}&breed=${encodeURIComponent(breed)}`}
                                className="category-chip"
                                onClick={() => handleMenuItemClick(`/browse?category=${category}&breed=${breed}`)}
                            >
                                <FaPaw /> {breed}
                            </Link>
                        ))}
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
                                <span>All Listings</span>
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link
                                to="/browse?category=dogs&intent=sale&maxAge=6"
                                onClick={() => handleMenuItemClick('/browse?category=dogs&intent=sale&maxAge=6')}
                            >
                                <FaDog className="menu-icon" />
                                <span>Puppies for Sale</span>
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link
                                to="/browse?category=cats&intent=sale&maxAge=6"
                                onClick={() => handleMenuItemClick('/browse?category=cats&intent=sale&maxAge=6')}
                            >
                                <FaCat className="menu-icon" />
                                <span>Kittens for Sale</span>
                            </Link>
                        </li>
                        {/* Top Studs */}
                        <li className="menu-item">
                            <Link to="/top-studs" onClick={() => handleMenuItemClick("/top-studs")}>
                                <FaTrophy className="menu-icon" />
                                <span>Top Studs</span>
                            </Link>
                        </li>
                        <li className="menu-item">
                            <button
                                type="button"
                                className="navbar-sidebar-new-advert-btn"
                                onClick={() => {
                                    if (!userLoaded) return;

                                    if (!currentUser) {
                                        alert("To publish a new advert, please sign in or register first.");
                                        handleMenuItemClick(); // close sidebar
                                        onLoginClick(); // ✅ open modal instead of navigating to /login
                                    } else {
                                        handleMenuItemClick("/new-advert");
                                        navigate("/new-advert");
                                    }
                                }}

                            >
                                <FaPlus className="menu-icon" />
                                <span>New Advert</span>
                            </button>
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
                                    <Link
                                        to="/my-adverts"
                                        onClick={() => handleMenuItemClick('/my-adverts')}
                                        className={isActive('/my-adverts') ? 'active' : ''}
                                    >
                                        <FaListAlt className="menu-icon" />
                                        <span>My Adverts</span>
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
                                    <Link
                                        to="/login"                       // leave this for styling
                                        className="menu-button menu-login-button"
                                        onClick={e => {
                                            e.preventDefault();            // stop the navigation
                                            handleMenuItemClick();         // close sidebar/dropdowns
                                            onLoginClick();                // open your modal
                                        }}
                                    >
                                        <FaSignInAlt className="menu-icon" />
                                        <span>Login</span>
                                    </Link>
                                </li>
                                <li className="menu-item">
                                    <Link
                                        to="/register"
                                        onClick={() => handleMenuItemClick('/register')}
                                        className="menu-button menu-register-button"
                                    >
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
                        <Link
                            to="/"
                            className="logout-button"
                            onClick={async (e) => {
                                e.preventDefault(); // prevent default link navigation
                                try {
                                    await auth.signOut();         // sign out from Firebase
                                    handleMenuItemClick('/');     // close sidebar
                                    window.location.href = "/";   // hard redirect to homepage
                                } catch (err) {
                                    console.error("Logout failed", err);
                                }
                            }}
                        >
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
