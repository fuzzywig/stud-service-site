// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../../firebase/firebase'; // Added functions import
import AdminSidebar from '../../components/AdminSidebar';
import { Link } from 'react-router-dom';
import { FaChartLine,  FaAd, FaCalendarAlt, FaCalendarWeek, FaUsers, FaClipboardCheck, FaExclamationTriangle, FaStar, FaEye, FaCheck, FaTimes, FaSync, FaPause, FaPlay, FaCog, FaMap, FaExternalLinkAlt } from 'react-icons/fa';
import './AdminDashboard.css';

// Email functions copied from ApproveAdverts
const sendAdvertApprovedEmail = async (userData, advertData) => {
    try {
        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-approved-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData, advertData }),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Advert approved email sent to ${userData.email}`);
        } else {
            console.error('❌ Failed to send advert approved email:', result.error);
        }
    } catch (err) {
        console.error('❌ Failed to send advert approved email:', err);
    }
};

const sendAdvertRejectedEmail = async (userData, advertData, rejectionReason) => {
    try {
        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-rejected-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData, advertData, rejectionReason }),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Advert rejected email sent to ${userData.email}`);
        } else {
            console.error('❌ Failed to send advert rejected email:', result.error);
        }
    } catch (err) {
        console.error('❌ Failed to send advert rejected email:', err);
    }
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalAds: 0,
        pendingAds: 0,
        pendingReviews: 0,
        totalUsers: 0,
        activeUsers: 0,
        weeklyRegistrations: 0,
        monthlyRegistrations: 0,
        newAdsWeekly: 0,
    });
    const [recentAds, setRecentAds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Sitemap state
    const [sitemapStatus, setSitemapStatus] = useState(null);
    const [sitemapLoading, setSitemapLoading] = useState(false);
    const [lastSitemapGeneration, setLastSitemapGeneration] = useState(null);

    // Auto-refresh state
    const [lastRefresh, setLastRefresh] = useState(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Rejection modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectionTarget, setRejectionTarget] = useState(null);

    // Sitemap functions
    const getSitemapStatus = async () => {
        try {
            const getSitemapStatusFn = httpsCallable(functions, 'getSitemapStatus');
            const result = await getSitemapStatusFn();
            setSitemapStatus(result.data);
        } catch (error) {
            console.error('Error getting sitemap status:', error);
            setSitemapStatus({ exists: false, error: error.message });
        }
    };

    const generateSitemap = async () => {
        setSitemapLoading(true);
        try {
            const generateSitemapFn = httpsCallable(functions, 'generateSitemapManual');
            const result = await generateSitemapFn();

            setLastSitemapGeneration(result.data);
            await getSitemapStatus(); // Refresh status

            alert(`✅ Sitemap generated successfully!\n📊 ${result.data.routeCount} URLs\n🔗 ${result.data.url}`);
        } catch (error) {
            console.error('Error generating sitemap:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setSitemapLoading(false);
        }
    };

    // Simple Settings Modal
    const SettingsModal = ({ isOpen, onClose }) => {
        const [tempAutoRefresh, setTempAutoRefresh] = useState(autoRefreshEnabled);
        const [tempInterval, setTempInterval] = useState(refreshInterval);

        if (!isOpen) return null;

        const handleSave = () => {
            setAutoRefreshEnabled(tempAutoRefresh);
            setRefreshInterval(tempInterval);

            // Save to localStorage
            try {
                localStorage.setItem('dashboardAutoRefresh', tempAutoRefresh.toString());
                localStorage.setItem('dashboardRefreshInterval', tempInterval.toString());
            } catch (error) {
                console.error('Failed to save settings:', error);
            }

            onClose();
            alert('Settings saved!');
        };

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    minWidth: '400px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginTop: 0 }}>Dashboard Settings</h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={tempAutoRefresh}
                                onChange={(e) => setTempAutoRefresh(e.target.checked)}
                            />
                            Enable auto-refresh
                        </label>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>
                            Refresh interval:
                            <select
                                value={tempInterval}
                                onChange={(e) => setTempInterval(Number(e.target.value))}
                                disabled={!tempAutoRefresh}
                                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
                            >
                                <option value={15}>15 seconds</option>
                                <option value={30}>30 seconds</option>
                                <option value={60}>1 minute</option>
                                <option value={120}>2 minutes</option>
                                <option value={300}>5 minutes</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Rejection Modal Component
    const RejectionModal = ({ isOpen, onClose, onSubmit, dogName }) => {
        const [selectedReason, setSelectedReason] = useState('');
        const [customMessage, setCustomMessage] = useState('');

        const reasons = [
            'Incomplete or missing information',
            'Inappropriate or misleading content',
            'Poor quality or unclear photos',
            'Violates site policies',
        ];

        const handleSend = () => {
            const finalMessage = customMessage || selectedReason;
            if (finalMessage) {
                onSubmit(finalMessage);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="approve-adverts-modal-backdrop">
                <div className="approve-adverts-modal">
                    <h2>Reject Advert for {dogName}</h2>
                    <p>Select a reason or type your own:</p>
                    <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                    >
                        <option value="">-- Choose a reason --</option>
                        {reasons.map((reason, index) => (
                            <option key={index} value={reason}>{reason}</option>
                        ))}
                    </select>
                    <textarea
                        placeholder="Optional custom message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={4}
                    />
                    <div className="approve-adverts-modal-actions">
                        <button onClick={handleSend} className="approve-adverts-btn-approve">Send Rejection</button>
                        <button onClick={onClose} className="approve-adverts-btn-reject">Cancel</button>
                    </div>
                </div>
            </div>
        );
    };

    // Fetch stats function
    const fetchStats = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const allAdsSnap = await getDocs(collection(db, 'allListings'));
            const usersRef = collection(db, 'users');

            const pendingAdsQuery = query(
                collection(db, 'allListings'),
                where('approved', '==', false),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const pendingAdsSnap = await getDocs(pendingAdsQuery);

            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

            const activeUsersSnap = await getDocs(
                query(
                    usersRef,
                    where('lastSeen', '>=', tenMinutesAgo),
                )
            );

            const weeklyUsersSnap = await getDocs(
                query(usersRef, where('createdAt', '>=', oneWeekAgo))
            );

            const monthlyUsersSnap = await getDocs(
                query(usersRef, where('createdAt', '>=', oneMonthAgo))
            );

            const weeklyAdsSnap = await getDocs(
                query(collection(db, 'allListings'), where('createdAt', '>=', oneWeekAgo))
            );

            const reviewsSnap = await getDocs(
                query(collection(db, 'reviews'), where('approved', '==', false))
            );

            const allUsersSnap = await getDocs(usersRef);

            setStats({
                totalAds: allAdsSnap.size,
                pendingAds: pendingAdsSnap.size,
                totalUsers: allUsersSnap.size,
                pendingReviews: reviewsSnap.size,
                activeUsers: activeUsersSnap.size,
                weeklyRegistrations: weeklyUsersSnap.size,
                monthlyRegistrations: monthlyUsersSnap.size,
                newAdsWeekly: weeklyAdsSnap.size,
            });

            const recentUnapproved = await Promise.all(
                pendingAdsSnap.docs.map(async advertDoc => {
                    const data = advertDoc.data();
                    let ownerName = "Unknown";

                    if (data.ownerId) {
                        const ownerSnap = await getDoc(doc(db, "users", data.ownerId));
                        if (ownerSnap.exists()) {
                            const ownerData = ownerSnap.data();
                            ownerName = ownerData.firstName
                                ? `${ownerData.firstName} ${ownerData.lastName?.charAt(0) || ""}.`
                                : "Unknown";
                        }
                    }

                    return {
                        id: advertDoc.id,
                        ...data,
                        ownerName,
                    };
                })
            );

            setRecentAds(recentUnapproved);
            setLastRefresh(new Date());

        } catch (err) {
            console.error('🔥 Failed to load stats:', err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        fetchStats(true);
    };

    // Load saved settings and setup auto-refresh
    useEffect(() => {
        // Load saved settings
        try {
            const savedAutoRefresh = localStorage.getItem('dashboardAutoRefresh');
            const savedInterval = localStorage.getItem('dashboardRefreshInterval');

            if (savedAutoRefresh !== null) {
                setAutoRefreshEnabled(savedAutoRefresh === 'true');
            }
            if (savedInterval !== null) {
                setRefreshInterval(Number(savedInterval));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }

        // Initial fetch
        fetchStats();
        getSitemapStatus(); // Load sitemap status
    }, []);

    // Auto-refresh interval effect
    useEffect(() => {
        let intervalId = null;

        if (autoRefreshEnabled && refreshInterval > 0) {
            intervalId = setInterval(() => {
                fetchStats(true);
            }, refreshInterval * 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [autoRefreshEnabled, refreshInterval]);

    const handleApprove = async (advertId) => {
        try {
            const adRef = doc(db, "allListings", advertId);
            await updateDoc(adRef, { approved: true });

            // Get the advert data for email
            const adSnap = await getDoc(adRef);
            const ad = adSnap.data();

            // Send approval email
            if (ad.ownerId) {
                const userSnap = await getDoc(doc(db, 'users', ad.ownerId));
                if (userSnap.exists()) {
                    const user = userSnap.data();

                    // Prepare user data
                    const userData = {
                        email: user.email,
                        firstName: user.firstName || '',
                        lastName: user.lastName || ''
                    };

                    // Prepare advert data
                    const advertData = {
                        id: advertId,
                        petName: ad.name || ad.title || 'your pet',
                        type: ad.petType || 'pet'
                    };

                    // Send approval email
                    await sendAdvertApprovedEmail(userData, advertData);
                }
            }

            alert("Advert approved successfully.");

            // Update the visible list of recent unapproved ads
            setRecentAds(prev => prev.filter(ad => ad.id !== advertId));

            // Decrement the pending ads count
            setStats(prev => ({
                ...prev,
                pendingAds: Math.max(prev.pendingAds - 1, 0),
            }));

            // Refresh data after action
            setTimeout(() => fetchStats(true), 1000);
        } catch (error) {
            console.error("Error approving advert:", error);
            alert("Failed to approve advert. Please try again.");
        }
    };

    // Reject advert function
    const rejectAdvert = async (id, reasonText) => {
        try {
            const adRef = doc(db, 'allListings', id);
            const adSnap = await getDoc(adRef);
            const ad = adSnap.data();

            if (!adSnap.exists()) return;

            const rejectedAt = new Date();

            // Save rejection details to rejectedAdverts collection for record keeping
            try {
                await setDoc(doc(db, 'rejectedAdverts', id), {
                    ...ad,
                    rejectedAt: rejectedAt.toISOString(),
                    rejectionReason: reasonText,
                    reviewedBy: auth.currentUser?.uid || "admin",
                });
            } catch (permissionError) {
                console.error('Failed to save to rejectedAdverts:', permissionError);
            }

            // Update the advert to include rejection info
            try {
                await updateDoc(adRef, {
                    lastRejectedAt: rejectedAt.toISOString(),
                    lastRejectionReason: reasonText,
                    approved: false
                });
            } catch (updateError) {
                console.error('Failed to update advert with rejection info:', updateError);
            }

            // Send notification email to the owner using SendGrid template
            if (ad.ownerId) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', ad.ownerId));
                    if (userSnap.exists()) {
                        const user = userSnap.data();

                        // Prepare user data
                        const userData = {
                            email: user.email,
                            firstName: user.firstName || '',
                            lastName: user.lastName || ''
                        };

                        // Prepare advert data
                        const advertData = {
                            id: id,
                            petName: ad.name || ad.title || 'your pet',
                            type: ad.petType || 'pet'
                        };

                        // Send using SendGrid template
                        await sendAdvertRejectedEmail(userData, advertData, reasonText);
                    }
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                }
            }

            // Remove from the current view
            setRecentAds(prev => prev.filter(ad => ad.id !== id));

            // Decrement the pending ads count
            setStats(prev => ({
                ...prev,
                pendingAds: Math.max(prev.pendingAds - 1, 0),
            }));

            setModalOpen(false);
            setRejectionTarget(null);

            alert("Advert rejected successfully.");

            // Refresh data after action
            setTimeout(() => fetchStats(true), 1000);

        } catch (error) {
            console.error('Error rejecting advert:', error);
            alert('Failed to reject advert. Please try again.');
        }
    };

    return (
        <div className="admin-dashboard-page">
            <AdminSidebar />

            <div className="content-area">
                {/* Header with refresh controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <h1 className="page-title">Admin Dashboard</h1>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        {lastRefresh && (
                            <span style={{ fontSize: '0.875rem', color: '#666', marginRight: '1rem' }}>
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}

                        <button
                            onClick={() => setShowSettings(true)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <FaCog /> Settings
                        </button>

                        <button
                            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: autoRefreshEnabled ? '#28a745' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px'
                            }}
                        >
                            {autoRefreshEnabled ? <FaPause /> : <FaPlay />}
                            {autoRefreshEnabled ? 'Auto' : 'Manual'}
                        </button>

                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            disabled={!autoRefreshEnabled}
                            style={{
                                padding: '6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <option value={15}>15s</option>
                            <option value={30}>30s</option>
                            <option value={60}>1m</option>
                            <option value={120}>2m</option>
                            <option value={300}>5m</option>
                        </select>

                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: isRefreshing ? '#ffc107' : '#17a2b8',
                                color: isRefreshing ? '#000' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <FaSync style={{
                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                            }} />
                            Refresh
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-animation">
                            <div className="loading-circle"></div>
                            <div className="loading-lines">
                                <div className="loading-line"></div>
                                <div className="loading-line"></div>
                                <div className="loading-line"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            {/* First row - your original 4 stats */}
                            <div className="stat-card total-ads">
                                <div className="stat-icon">
                                    <FaChartLine />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Total Adverts</h3>
                                    <p className="stat-value">{stats.totalAds}</p>
                                </div>
                            </div>

                            <div className="stat-card pending-ads">
                                <div className="stat-icon">
                                    <FaClipboardCheck />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Pending Approvals</h3>
                                    <p className="stat-value">{stats.pendingAds}</p>
                                </div>
                                {stats.pendingAds > 0 && (
                                    <div className="stat-action">
                                        <Link to="/admin/approve-adverts" className="action-link">
                                            Review
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="stat-card total-users">
                                <div className="stat-icon">
                                    <FaUsers />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Total Users</h3>
                                    <p className="stat-value">{stats.totalUsers}</p>
                                </div>
                                <div className="stat-action">
                                    <Link to="/admin/manage-users" className="action-link">
                                        Manage
                                    </Link>
                                </div>
                            </div>

                            <div className="stat-card pending-reviews">
                                <div className="stat-icon">
                                    <FaStar />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Pending Reviews</h3>
                                    <p className="stat-value">{stats.pendingReviews}</p>
                                </div>
                                {stats.pendingReviews > 0 && (
                                    <div className="stat-action">
                                        <Link to="/admin/approve-reviews" className="action-link">
                                            Review
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Second row - new stats you requested */}
                            <div className="stat-card active-users">
                                <div className="stat-icon">
                                    <FaUsers />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Active Users</h3>
                                    <p className="stat-value">{stats.activeUsers}</p>
                                </div>
                            </div>

                            <div className="stat-card weekly-registrations">
                                <div className="stat-icon">
                                    <FaCalendarWeek />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Weekly Registrations</h3>
                                    <p className="stat-value">{stats.weeklyRegistrations}</p>
                                </div>
                            </div>

                            <div className="stat-card monthly-registrations">
                                <div className="stat-icon">
                                    <FaCalendarAlt />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Monthly Registrations</h3>
                                    <p className="stat-value">{stats.monthlyRegistrations}</p>
                                </div>
                            </div>

                            <div className="stat-card new-ads-weekly">
                                <div className="stat-icon">
                                    <FaAd />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">New Ads Weekly</h3>
                                    <p className="stat-value">{stats.newAdsWeekly}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sitemap Management Section */}
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaMap className="section-icon" />
                                    Sitemap Management
                                </h2>
                            </div>

                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {/* Current Status */}
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Current Status</h3>
                                    {sitemapStatus ? (
                                        sitemapStatus.exists ? (
                                            <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                                <p style={{ margin: '0 0 0.5rem 0' }}>
                                                    <strong>URLs:</strong> {sitemapStatus.routeCount}
                                                </p>
                                                <p style={{ margin: '0 0 0.5rem 0' }}>
                                                    <strong>Last Updated:</strong> {new Date(sitemapStatus.lastUpdated).toLocaleString()}
                                                </p>
                                                <p style={{ margin: '0 0 0.5rem 0' }}>
                                                    <strong>Generated By:</strong> {sitemapStatus.generatedBy}
                                                </p>
                                                <p style={{ margin: '0' }}>
                                                    <a
                                                        href={sitemapStatus.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#007bff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        View Sitemap <FaExternalLinkAlt style={{ fontSize: '12px' }} />
                                                    </a>
                                                </p>
                                            </div>
                                        ) : (
                                            <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                                                <p style={{ margin: '0', color: '#856404' }}>
                                                    {sitemapStatus.error ? `Error: ${sitemapStatus.error}` : 'No sitemap generated yet'}
                                                </p>
                                            </div>
                                        )
                                    ) : (
                                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                            <p style={{ margin: '0', color: '#6c757d' }}>Loading status...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Generation */}
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Manual Generation</h3>
                                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                        <button
                                            onClick={generateSitemap}
                                            disabled={sitemapLoading}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: sitemapLoading ? '#6c757d' : '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: sitemapLoading ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '14px',
                                                width: '100%',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <FaSync style={{
                                                animation: sitemapLoading ? 'spin 1s linear infinite' : 'none'
                                            }} />
                                            {sitemapLoading ? 'Generating...' : 'Generate Sitemap Now'}
                                        </button>
                                        <p style={{
                                            margin: '0.75rem 0 0 0',
                                            fontSize: '12px',
                                            color: '#6c757d',
                                            lineHeight: '1.4'
                                        }}>
                                            This will fetch the latest content and generate a fresh sitemap.
                                        </p>
                                    </div>

                                    {/* Automatic Schedule Info */}
                                    <div style={{
                                        backgroundColor: '#e3f2fd',
                                        padding: '1rem',
                                        borderRadius: '6px',
                                        border: '1px solid #bbdefb',
                                        marginTop: '1rem'
                                    }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1565c0', fontSize: '14px' }}>
                                            📅 Automatic Updates
                                        </h4>
                                        <p style={{
                                            margin: '0',
                                            fontSize: '12px',
                                            color: '#1976d2',
                                            lineHeight: '1.4'
                                        }}>
                                            The sitemap automatically regenerates daily at 6:00 AM UTC to stay current.
                                        </p>
                                    </div>
                                </div>

                                {/* Last Manual Generation Result */}
                                {lastSitemapGeneration && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Last Manual Generation</h3>
                                        <div style={{
                                            backgroundColor: '#d4edda',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            border: '1px solid #c3e6cb'
                                        }}>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                                                <strong>✅ Success!</strong>
                                            </p>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                                                <strong>URLs Generated:</strong> {lastSitemapGeneration.routeCount}
                                            </p>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                                                <strong>Generated At:</strong> {new Date(lastSitemapGeneration.generatedAt).toLocaleString()}
                                            </p>
                                            <p style={{ margin: '0', color: '#155724' }}>
                                                <a
                                                    href={lastSitemapGeneration.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#155724', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    View Generated Sitemap <FaExternalLinkAlt style={{ fontSize: '12px' }} />
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Approvals Section */}
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaExclamationTriangle className="section-icon" />
                                    Pending Approvals
                                </h2>
                                {stats.pendingAds > 0 && (
                                    <Link to="/admin/approve-adverts" className="view-all-link">
                                        View All
                                    </Link>
                                )}
                            </div>

                            {recentAds.length === 0 ? (
                                <div className="empty-state">
                                    <p>No pending adverts to approve.</p>
                                </div>
                            ) : (
                                <div className="approval-list">
                                    {recentAds.map(ad => (
                                        <div key={ad.id} className="approval-item">
                                            {ad.images && ad.images.length > 0 && (
                                                <div className="item-image">
                                                    <img
                                                        src={ad.images[ad.mainImageIndex || 0]}
                                                        alt={`${ad.name || 'Stud Dog'} image`}
                                                        className="approval-thumbnail"
                                                    />
                                                </div>
                                            )}

                                            <div className="item-content">
                                                <h3 className="item-title">
                                                    {ad.breedOrType || 'Unknown Breed'}
                                                    {ad.name && <span className="item-subtitle"> — {ad.name}</span>}
                                                </h3>
                                                <p className="item-description">
                                                    {ad.description
                                                        ? ad.description.length > 100
                                                            ? `${ad.description.substring(0, 100)}...`
                                                            : ad.description
                                                        : 'No description provided.'
                                                    }
                                                </p>
                                                <div className="item-meta">
                                                    <span className="meta-item">
                                                        {ad.createdAt
                                                            ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString()
                                                            : 'Unknown date'
                                                        }
                                                    </span>
                                                    <span className="meta-item">
                                                        Owner: {ad.ownerName || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                <Link to={`/admin/view-advert/${ad.id}`} className="action-button view">
                                                    <FaEye /> View
                                                </Link>

                                                <button className="action-button approve" onClick={() => handleApprove(ad.id)}>
                                                    <FaCheck /> Approve
                                                </button>
                                                <button
                                                    className="action-button reject"
                                                    onClick={() => {
                                                        setRejectionTarget(ad);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <FaTimes /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Rejection Modal */}
            {modalOpen && rejectionTarget && (
                <RejectionModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setRejectionTarget(null);
                    }}
                    onSubmit={(reason) => rejectAdvert(rejectionTarget.id, reason)}
                    dogName={rejectionTarget.name || 'this pet'}
                />
            )}
        </div>
    );
}