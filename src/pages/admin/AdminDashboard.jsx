import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalAds: 0,
        pendingAds: 0,
        pendingReviews: 0,
        totalUsers: 0,
    });
    const [recentAds, setRecentAds] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const allAdsSnap = await getDocs(collection(db, 'studAds'));
                const pendingAdsSnap = await getDocs(query(collection(db, 'studAds'), where('approved', '==', false)));
                const usersSnap = await getDocs(collection(db, 'users'));
                const reviewsSnap = await getDocs(query(collection(db, 'users'), where('reviews', '!=', null)));

                setStats({
                    totalAds: allAdsSnap.size,
                    pendingAds: pendingAdsSnap.size,
                    totalUsers: usersSnap.size,
                    pendingReviews: reviewsSnap.size,
                });

                const recentUnapproved = pendingAdsSnap.docs.slice(0, 3).map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRecentAds(recentUnapproved);
            } catch (err) {
                console.error('🔥 Failed to load stats:', err.message);
            }
        };

        fetchStats();
    }, []);

    return (
        <>
            <AdminSidebar />
            <div className="admin-dashboard-wrapper">
                <div className="admin-dashboard">
                    <h1 style={{ marginTop: '40px' }}>Admin Overview</h1>

                    <div className="stats-grid">
                        <div className="stat-card"><h3>Total Stud Adverts</h3><p>{stats.totalAds}</p></div>
                        <div className="stat-card"><h3>Pending Approvals</h3><p>{stats.pendingAds}</p></div>
                        <div className="stat-card"><h3>Total Users</h3><p>{stats.totalUsers}</p></div>
                        <div className="stat-card"><h3>Pending Reviews</h3><p>{stats.pendingReviews}</p></div>
                    </div>

                    <div className="quick-approvals-wrapper">
                        <div className="quick-approvals">
                            <h2>Quick Approvals</h2>
                            {recentAds.length === 0 ? (
                                <p>No pending adverts to approve.</p>
                            ) : (
                                <ul>
                                    {recentAds.map(ad => (
                                        <li key={ad.id}>
                                            <strong>{ad.breed}</strong> — {ad.name || 'Unnamed'}
                                            <span> • {ad.description?.substring(0, 60)}...</span>
                                            <a href={`/admin/approve-adverts`} style={{ marginLeft: '1rem' }}>Approve</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
