// src/components/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../firebase/firebaseAuth';
import {
    FaBars,
    FaTimes,
    FaTachometerAlt,
    FaClipboardCheck,
    FaUsers,
    FaStar,
    FaGlobe,
    FaSignOutAlt,
    FaUser
} from 'react-icons/fa';
import './AdminSidebar.css';

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { userData } = useAuth(); // Grab user context
    const location = useLocation();

    const openSidebar = () => setIsOpen(true);
    const closeSidebar = () => setIsOpen(false);

    // Detect current active route
    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') {
            return true;
        }
        return path !== '/admin' && location.pathname.startsWith(path);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeSidebar();
        };

        // Close sidebar on route change on mobile
        closeSidebar();

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [location]);

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(false); // Reset mobile open state when on desktop
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <button className="admin-sidebar-toggle" onClick={openSidebar} aria-label="Open menu">
                <FaBars />
            </button>

            {isOpen && (
                <div className="admin-sidebar-overlay" onClick={closeSidebar}></div>
            )}

            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-logo">
                        <img src="https://placehold.co/100x100?text=Logo" alt="Admin Logo" />
                    </div>
                    <button className="admin-sidebar-close" onClick={closeSidebar} aria-label="Close menu">
                        <FaTimes />
                    </button>
                </div>

                <div className="admin-sidebar-content">
                    <nav className="admin-sidebar-nav">
                        <Link
                            to="/admin"
                            className={`admin-sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <FaTachometerAlt className="admin-sidebar-icon" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/admin/approve-adverts"
                            className={`admin-sidebar-link ${isActive('/admin/approve-adverts') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <FaClipboardCheck className="admin-sidebar-icon" />
                            <span>Approve Adverts</span>
                        </Link>

                        <Link
                            to="/admin/approve-reviews"
                            className={`admin-sidebar-link ${isActive('/admin/approve-reviews') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <FaStar className="admin-sidebar-icon" />
                            <span>Approve Reviews</span>
                        </Link>

                        <Link
                            to="/admin/manage-users"
                            className={`admin-sidebar-link ${isActive('/admin/manage-users') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <FaUsers className="admin-sidebar-icon" />
                            <span>Manage Users</span>
                        </Link>

                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-sidebar-link external"
                            onClick={closeSidebar}
                        >
                            <FaGlobe className="admin-sidebar-icon" />
                            <span>Visit Website</span>
                        </a>
                    </nav>
                </div>

                {userData && (
                    <div className="admin-sidebar-footer">
                        <div className="admin-sidebar-user">
                            <div className="admin-sidebar-avatar">
                                <img src={userData.avatar || "https://placehold.co/50x50"} alt="Admin Avatar" />
                            </div>
                            <div className="admin-sidebar-user-info">
                                <Link
                                    to={`/admin/user/${userData.uid}`}
                                    onClick={closeSidebar}
                                    className="admin-sidebar-username"
                                >
                                    <span className="admin-sidebar-name">{userData.firstName} {userData.lastName}</span>
                                    <FaUser className="admin-sidebar-profile-icon" />
                                </Link>

                                <Link to="/logout" className="admin-sidebar-logout" onClick={closeSidebar}>
                                    <FaSignOutAlt className="admin-sidebar-logout-icon" />
                                    <span>Log Out</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}