import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';
import { useAuth } from '../firebase/firebaseAuth'; // Adjust path if needed

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { userData } = useAuth(); // Grab user context

    const openSidebar = () => setIsOpen(true);
    const closeSidebar = () => setIsOpen(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeSidebar();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <>
            <button className="sidebar-toggle" onClick={openSidebar}>☰</button>
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="https://placehold.co/100x100?text=Logo" alt="Logo" />
                </div>

                <nav className="sidebar-nav">
                    <Link to="/admin" onClick={closeSidebar}>Dashboard</Link>
                    <Link to="/admin/approve-adverts" onClick={closeSidebar}>Approve Adverts</Link>
                    <Link to="/admin/approve-reviews" onClick={closeSidebar}>Approve Reviews</Link>
                    <Link to="/admin/manage-users" onClick={closeSidebar}>Manage Users</Link>
                    <a href="/" target="_blank" rel="noopener noreferrer" onClick={closeSidebar}>Visit Website</a>
                </nav>

                {userData && (
                    <>
                        <div className="admin-auth-button">
                            <Link to="/logout" onClick={closeSidebar}>Log Out</Link>
                        </div>

                        <div className="admin-avatar">
                            <img src={userData.avatar || "https://placehold.co/50x50"} alt="Admin Avatar" />
                            <div className="admin-name">
                                <Link
                                    to={`/admin/user/${userData.uid}`}
                                    onClick={closeSidebar}
                                    className="admin-name-link"
                                >
                                    {userData.firstName} {userData.lastName}
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
