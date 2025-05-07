// src/pages/admin/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import './ManageUsers.css';
import { FaSearch, FaUserSlash, FaEye, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(userList);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const toggleBlacklist = async (e, userId, currentStatus) => {
        e.preventDefault(); // Prevent navigation from the Link
        e.stopPropagation(); // Stop the event from bubbling up

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { blacklisted: !currentStatus });
            setUsers(prev => prev.map(user => user.id === userId ? { ...user, blacklisted: !currentStatus } : user));
        } catch (error) {
            console.error('Error updating blacklist status:', error);
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
    };

    // Filter users based on search term and status filter
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm);

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'active') return matchesSearch && !user.blacklisted;
        if (filterStatus === 'blacklisted') return matchesSearch && user.blacklisted;

        return matchesSearch;
    });

    return (
        <div className="admin-manage-users-page">
            <AdminSidebar />

            <div className="content-area">
                <div className="page-header">
                    <h1 className="page-title">Manage Users</h1>
                    <div className="page-actions">
                        <div className="filter-controls">
                            <button
                                className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('all')}
                            >
                                All Users
                            </button>
                            <button
                                className={`filter-button ${filterStatus === 'active' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('active')}
                            >
                                Active
                            </button>
                            <button
                                className={`filter-button ${filterStatus === 'blacklisted' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('blacklisted')}
                            >
                                Blacklisted
                            </button>
                        </div>
                    </div>
                </div>

                <div className="search-section">
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                    <div className="search-results-count">
                        <span>{filteredUsers.length} users found</span>
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
                        {filteredUsers.length > 0 ? (
                            <div className="users-grid">
                                {filteredUsers.map(user => (
                                    <div className="user-card" key={user.id}>
                                        <div className="user-card-header">
                                            <div className="user-avatar-wrapper">
                                                <img
                                                    src={user.avatar || '/default-avatar.png'}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    className="user-avatar"
                                                />
                                                <span className={`status-indicator ${user.blacklisted ? 'status-blacklisted' : 'status-active'}`}></span>
                                            </div>
                                            <div className="user-header-info">
                                                <h3 className="user-name">
                                                    {user.firstName} {user.lastName}
                                                </h3>
                                                <span className={`user-status-badge ${user.blacklisted ? 'status-badge-blacklisted' : 'status-badge-active'}`}>
                                                    {user.blacklisted ? 'Blacklisted' : 'Active'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="user-card-body">
                                            <div className="user-detail">
                                                <span className="detail-label">Email:</span>
                                                <span className="detail-value">{user.email}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">Phone:</span>
                                                <span className="detail-value">{user.phone || 'N/A'}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">Location:</span>
                                                <span className="detail-value">
                                                    {user.city && user.county ? `${user.city}, ${user.county}` : 'N/A'}
                                                </span>
                                            </div>

                                            <div className="user-stats">
                                                <div className="stat-item">
                                                    <span className="stat-value">{user.adverts?.length || 0}</span>
                                                    <span className="stat-label">Adverts</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">{user.reviews?.length || 0}</span>
                                                    <span className="stat-label">Reviews</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">
                                                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    <span className="stat-label">Joined</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="user-card-footer">
                                            <Link to={`/admin/user/${user.id}`} className="view-profile-button">
                                                <FaEye /> View Profile
                                            </Link>
                                            <button
                                                className={`blacklist-button ${user.blacklisted ? 'unblacklist' : 'blacklist'}`}
                                                onClick={(e) => toggleBlacklist(e, user.id, user.blacklisted)}
                                            >
                                                <FaUserSlash /> {user.blacklisted ? 'Unblacklist' : 'Blacklist'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <p>No users found matching your search criteria.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;