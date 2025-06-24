// src/components/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../firebase/firebaseAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Menu,
    X,
    BarChart3,
    CheckSquare,
    Users,
    Edit,
    Star,
    Globe,
    LogOut,
    User,
    Search,
    Shield,
    MessageSquare,
    Edit3
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [notificationCounts, setNotificationCounts] = useState({
        pendingAdverts: 0,
        pendingReviews: 0,
        reportedUsers: 0,
        supportTickets: 0
    });
    const { userData } = useAuth();
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

    // Fetch notification counts with loading state
    useEffect(() => {
        const fetchNotificationCounts = async () => {
            try {
                // Count pending adverts
                const pendingAdvertsQuery = query(
                    collection(db, 'allListings'),
                    where('approved', '==', false)
                );
                const pendingAdvertsSnapshot = await getDocs(pendingAdvertsQuery);
                const pendingAdvertsCount = pendingAdvertsSnapshot.size;

                // Count pending reviews (adjust this based on your reviews structure)
                const pendingReviewsQuery = query(
                    collection(db, 'reviews'),
                    where('approved', '==', false)
                );
                const pendingReviewsSnapshot = await getDocs(pendingReviewsQuery);
                const pendingReviewsCount = pendingReviewsSnapshot.size;

                // Count reported users (adjust this based on your reports structure)
                const reportedUsersQuery = query(
                    collection(db, 'reportedUsers'),
                    where('resolved', '==', false)
                );
                const reportedUsersSnapshot = await getDocs(reportedUsersQuery);
                const reportedUsersCount = reportedUsersSnapshot.size;

                // Count support tickets (adjust this based on your tickets structure)
                const supportTicketsQuery = query(
                    collection(db, 'supportTickets'),
                    where('status', '==', 'open')
                );
                const supportTicketsSnapshot = await getDocs(supportTicketsQuery);
                const supportTicketsCount = supportTicketsSnapshot.size;

                setNotificationCounts({
                    pendingAdverts: pendingAdvertsCount,
                    pendingReviews: pendingReviewsCount,
                    reportedUsers: reportedUsersCount,
                    supportTickets: supportTicketsCount
                });

            } catch (error) {
                console.error('Error fetching notification counts:', error);
                // Set to 0 on error to avoid showing stale data
                setNotificationCounts({
                    pendingAdverts: 0,
                    pendingReviews: 0,
                    reportedUsers: 0,
                    supportTickets: 0
                });
            }
        };

        fetchNotificationCounts();

        // Refresh counts every 30 seconds
        const interval = setInterval(fetchNotificationCounts, 30000);
        return () => clearInterval(interval);
    }, []);

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

    // Simple, clean notification badge
    const NotificationBadge = ({ count, isLoading = false }) => {
        if (isLoading) {
            return <span className="admin-sidebar-notification-badge loading">•••</span>;
        }

        if (count === 0) return null;

        const displayCount = count > 99 ? '99+' : count;

        return (
            <span
                className="admin-sidebar-notification-badge"
                title={`${count} pending item${count !== 1 ? 's' : ''}`}
            >
                {displayCount}
            </span>
        );
    };

    return (
        <>
            <button className="admin-sidebar-toggle" onClick={openSidebar} aria-label="Open menu">
                <Menu size={20} strokeWidth={2} />
            </button>

            {isOpen && (
                <div className="admin-sidebar-overlay" onClick={closeSidebar}></div>
            )}

            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-logo">
                        <img src="https://firebasestorage.googleapis.com/v0/b/studservice-app.firebasestorage.app/o/images%2Flogo%2F120-logo.png?alt=media&token=50ac4271-ae63-4553-8f45-f1f557a26707" alt="Admin Logo" />
                    </div>
                    <button className="admin-sidebar-close" onClick={closeSidebar} aria-label="Close menu">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <div className="admin-sidebar-content">
                    <nav className="admin-sidebar-nav">
                        <Link
                            to="/admin"
                            className={`admin-sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <BarChart3 className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/admin/approve-adverts"
                            className={`admin-sidebar-link ${isActive('/admin/approve-adverts') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <CheckSquare className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Approve Adverts</span>
                            <NotificationBadge count={notificationCounts.pendingAdverts} />
                        </Link>

                        <Link
                            to="/admin/approve-reviews"
                            className={`admin-sidebar-link ${isActive('/admin/approve-reviews') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Star className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Approve Reviews</span>
                            <NotificationBadge count={notificationCounts.pendingReviews} />
                        </Link>

                        <Link
                            to="/admin/manage-users"
                            className={`admin-sidebar-link ${isActive('/admin/manage-users') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Users className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Manage Users</span>
                        </Link>

                        <Link
                            to="/admin/reported-users"
                            className={`admin-sidebar-link ${isActive('/admin/reported-users') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Shield className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Reported Users</span>
                            <NotificationBadge count={notificationCounts.reportedUsers} />
                        </Link>

                        <Link
                            to="/admin/uid-inspector"
                            className={`admin-sidebar-link ${isActive('/admin/uid-inspector') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Search className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>UID Inspector</span>
                        </Link>

                        <Link
                            to="/admin/tickets"
                            className={`admin-sidebar-link ${isActive('/admin/tickets') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <MessageSquare className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Support Tickets</span>
                            <NotificationBadge count={notificationCounts.supportTickets} />
                        </Link>

                        <Link
                            to="/blog-admin"
                            className={`admin-sidebar-link ${isActive('/blog-admin') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Edit3 className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Blog Management</span>
                        </Link>
                        <Link
                            to="/admin/staff-management"
                            className={`admin-sidebar-link ${isActive('/admin/staff-management') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Edit className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>Staff Management</span>
                        </Link>
                        <Link
                            to="/admin/sms-marketing"
                            className={`admin-sidebar-link ${isActive('/admin/sms-marketing') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <MessageSquare className="admin-sidebar-icon" size={18} strokeWidth={2} />
                            <span>SMS Marketing</span>
                        </Link>

                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-sidebar-link external"
                            onClick={closeSidebar}
                        >
                            <Globe className="admin-sidebar-icon" size={18} strokeWidth={2} />
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
                                {/* ✅ FIXED: Non-clickable username display */}
                                <div className="admin-sidebar-username">
                                    <span className="admin-sidebar-name">{userData.firstName} {userData.lastName}</span>
                                    <User className="admin-sidebar-profile-icon" size={16} strokeWidth={2} />
                                </div>

                                <Link to="/logout" className="admin-sidebar-logout" onClick={closeSidebar}>
                                    <LogOut className="admin-sidebar-logout-icon" size={16} strokeWidth={2} />
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