// src/pages/admin/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../firebase/firebaseAuth';
import { useNavigate } from 'react-router-dom';

import {
    collection,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    setDoc,
    where
} from 'firebase/firestore';
import './ManageUsers.css';
import {
    FaSearch,
    FaUserSlash,
    FaEye,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaAd,
    FaStar,
    FaCommentAlt,
    FaUserCircle,
    FaTimes,
    FaIdCard,
    FaExclamationTriangle,
    FaCheckCircle,
    FaCopy,
    FaFilter
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ManageUsers = () => {
    const navigate = useNavigate();
    const { currentUser, userData, loading: authLoading } = useAuth();

    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [userNotes, setUserNotes] = useState([]);
    const [noteText, setNoteText] = useState('');
    const [duplicateGroups, setDuplicateGroups] = useState([]);
    const [selectedUserForNotes, setSelectedUserForNotes] = useState(null);
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    const [error, setError] = useState(null);

    // Check if user is admin
    useEffect(() => {
        if (!authLoading) {
            if (!currentUser) {
                navigate('/login');
            } else if (userData && !userData.isAdmin) {
                navigate('/');
            }
        }
    }, [authLoading, currentUser, userData, navigate]);

    useEffect(() => {
        const fetchUsers = async () => {
            // Don't fetch if we're still loading auth or user is not admin
            if (authLoading || !userData?.isAdmin) {
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Try to fetch with orderBy first
                let userList = [];
                try {
                    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                    const snapshot = await getDocs(q);

                    userList = await Promise.all(
                        snapshot.docs.map(async (docSnap) => {
                            const userData = { id: docSnap.id, ...docSnap.data() };
                            return await fetchUserStats(userData);
                        })
                    );
                } catch (orderError) {
                    console.log('OrderBy failed, trying without ordering:', orderError);
                    // If orderBy fails, try without it
                    const snapshot = await getDocs(collection(db, 'users'));

                    userList = await Promise.all(
                        snapshot.docs.map(async (docSnap) => {
                            const userData = { id: docSnap.id, ...docSnap.data() };
                            return await fetchUserStats(userData);
                        })
                    );

                    // Sort manually if createdAt exists
                    userList.sort((a, b) => {
                        const aTime = a.createdAt?.seconds || 0;
                        const bTime = b.createdAt?.seconds || 0;
                        return bTime - aTime;
                    });
                }

                setUsers(userList);
                detectDuplicateUsers(userList);
            } catch (error) {
                console.error('Error fetching users:', error);
                setError('Failed to fetch users. Please check your permissions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [authLoading, userData]);

    const fetchUserStats = async (userData) => {
        try {
            const [advertsSnap, reviewsSnap, notesSnap] = await Promise.all([
                getDocs(
                    query(
                        collection(db, 'studAds'),
                        where('ownerId', '==', userData.id),
                        where('approved', '==', true)
                    )
                ),
                getDocs(
                    query(
                        collection(db, 'reviews'),
                        where('ownerId', '==', userData.id),
                        where('approved', '==', true)
                    )
                ),
                getDocs(
                    query(
                        collection(db, 'adminNotes'),
                        where('userId', '==', userData.id)
                    )
                )
            ]);

            return {
                ...userData,
                advertCount: advertsSnap.size,
                reviewCount: reviewsSnap.size,
                notesCount: notesSnap.size
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                ...userData,
                advertCount: 0,
                reviewCount: 0,
                notesCount: 0
            };
        }
    };

    const detectDuplicateUsers = (userList) => {
        const compositeKeyMap = new Map();
        const duplicateGroups = [];

        userList.forEach(user => {
            if (user.compositeKey) {
                if (!compositeKeyMap.has(user.compositeKey)) {
                    compositeKeyMap.set(user.compositeKey, []);
                }
                compositeKeyMap.get(user.compositeKey).push(user);
            }
        });

        compositeKeyMap.forEach((users, key) => {
            if (users.length > 1) {
                const sortedUsers = users.sort((a, b) => {
                    const aDate = a.createdAt?.seconds || 0;
                    const bDate = b.createdAt?.seconds || 0;
                    return aDate - bDate;
                });

                duplicateGroups.push({
                    compositeKey: key,
                    users: sortedUsers,
                    originalUser: sortedUsers[0],
                    duplicateCount: sortedUsers.length - 1
                });
            }
        });

        setDuplicateGroups(duplicateGroups);
    };

    const parseCompositeKey = (compositeKey) => {
        const [phone, address] = compositeKey.split('|');
        return { phone: phone || 'N/A', address: address || 'N/A' };
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const toggleBlacklist = async (e, userId, currentStatus) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { blacklisted: !currentStatus });
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, blacklisted: !currentStatus } : user
                )
            );
        } catch (error) {
            console.error('Error updating blacklist status:', error);
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setShowDuplicatesOnly(false);
    };

    const openNotesPopup = async (userId) => {
        setSelectedUserForNotes(userId);
        try {
            const q = query(
                collection(db, 'adminNotes'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            const notes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUserNotes(notes);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
            setUserNotes([]);
        }
    };

    const deleteNote = async (noteId) => {
        try {
            await deleteDoc(doc(db, 'adminNotes', noteId));
            await openNotesPopup(selectedUserForNotes);
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const getDuplicateUserIds = () => {
        const duplicateIds = new Set();
        duplicateGroups.forEach(group => {
            group.users.slice(1).forEach(user => {
                duplicateIds.add(user.id);
            });
        });
        return duplicateIds;
    };

    const filteredUsers = users.filter((user) => {
        if (showDuplicatesOnly) {
            const duplicateIds = getDuplicateUserIds();
            const allDuplicateIds = new Set();
            duplicateGroups.forEach(group => {
                group.users.forEach(u => allDuplicateIds.add(u.id));
            });
            if (!allDuplicateIds.has(user.id)) return false;
        }

        const matchesSearch =
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.phone?.toLowerCase().includes(searchTerm) ||
            user.id?.toLowerCase().includes(searchTerm);

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'active') return matchesSearch && !user.blacklisted;
        if (filterStatus === 'blacklisted') return matchesSearch && user.blacklisted;

        return matchesSearch;
    });

    const isDuplicateUser = (userId) => {
        const duplicateIds = getDuplicateUserIds();
        return duplicateIds.has(userId);
    };

    const isOriginalUser = (userId) => {
        return duplicateGroups.some(group => group.originalUser.id === userId);
    };

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="admin-manage-users-page">
                <AdminSidebar />
                <div className="content-area">
                    <div className="loading-container">
                        <div className="loading-animation">
                            <div className="loading-circle"></div>
                            <p>Checking authentication...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if not authorized
    if (!userData?.isAdmin) {
        return (
            <div className="admin-manage-users-page">
                <AdminSidebar />
                <div className="content-area">
                    <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
                        <h2>Access Denied</h2>
                        <p>You do not have permission to view this page.</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            <button
                                className={`filter-button duplicate-filter ${showDuplicatesOnly ? 'active' : ''}`}
                                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                            >
                                <FaCopy /> Duplicates Only
                            </button>
                        </div>
                    </div>
                </div>

                <div className="search-section">
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, phone, or ID..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                    <div className="search-results-count">
                        <span>{filteredUsers.length} users found</span>
                        {duplicateGroups.length > 0 && (
                            <span className="duplicate-count">
                                • {duplicateGroups.length} duplicate groups detected
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="error-banner" style={{
                        background: '#f8d7da',
                        color: '#721c24',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

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
                        {duplicateGroups.length > 0 && !showDuplicatesOnly && (
                            <div className="duplicate-alert-banner">
                                <FaExclamationTriangle className="alert-icon" />
                                <span>
                                    {duplicateGroups.length} duplicate account group{duplicateGroups.length > 1 ? 's' : ''} detected
                                </span>
                                <button
                                    className="view-duplicates-btn"
                                    onClick={() => setShowDuplicatesOnly(true)}
                                >
                                    View Duplicates
                                </button>
                            </div>
                        )}

                        {filteredUsers.length > 0 ? (
                            <div className="users-list">
                                {filteredUsers.map((user) => {
                                    const duplicateGroup = duplicateGroups.find(group =>
                                        group.users.some(u => u.id === user.id)
                                    );
                                    const isDuplicate = isDuplicateUser(user.id);
                                    const isOriginal = isOriginalUser(user.id);

                                    return (
                                        <div
                                            className={`user-list-item ${isDuplicate ? 'is-duplicate' : ''} ${isOriginal ? 'is-original' : ''}`}
                                            key={user.id}
                                        >
                                            <div className="user-avatar-section">
                                                <div className="user-avatar-wrapper">
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="user-avatar"
                                                        />
                                                    ) : (
                                                        <FaUserCircle className="user-avatar default-avatar-icon" />
                                                    )}
                                                    <span
                                                        className={`status-indicator ${
                                                            user.blacklisted ? 'status-blacklisted' : 'status-active'
                                                        }`}
                                                    ></span>
                                                </div>
                                            </div>

                                            <div className="user-info-section">
                                                <div className="user-header">
                                                    <h3 className="user-name">
                                                        {user.firstName} {user.lastName}
                                                        {isDuplicate && (
                                                            <span className="duplicate-badge duplicate">
                                                                <FaCopy /> Duplicate
                                                            </span>
                                                        )}
                                                        {isOriginal && duplicateGroup && (
                                                            <span className="duplicate-badge original">
                                                                <FaCheckCircle /> Original ({duplicateGroup.duplicateCount} duplicate{duplicateGroup.duplicateCount > 1 ? 's' : ''})
                                                            </span>
                                                        )}
                                                    </h3>
                                                    {user.createdAt && (
                                                        <span className="user-joined-date">
                                                            <FaCalendarAlt className="date-icon" />
                                                            Joined {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="user-details">
                                                    <div className="user-detail">
                                                        <FaEnvelope className="detail-icon" />
                                                        <span className="detail-value">{user.email}</span>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="user-detail">
                                                            <FaPhone className="detail-icon" />
                                                            <span className="detail-value">{user.phone}</span>
                                                        </div>
                                                    )}
                                                    {(user.city || user.county) && (
                                                        <div className="user-detail">
                                                            <FaMapMarkerAlt className="detail-icon" />
                                                            <span className="detail-value">
                                                                {user.city && user.county
                                                                    ? `${user.city}, ${user.county}`
                                                                    : user.city || user.county}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="user-detail">
                                                        <FaIdCard className="detail-icon" />
                                                        <span className="detail-value user-id">
                                                            ID: {user.id}
                                                            <button
                                                                className="copy-id-btn"
                                                                onClick={() => copyToClipboard(user.id)}
                                                                title="Copy ID"
                                                            >
                                                                <FaCopy />
                                                            </button>
                                                        </span>
                                                    </div>
                                                </div>

                                                {duplicateGroup && (
                                                    <div className="composite-key-info">
                                                        <span className="composite-label">Composite Key:</span>
                                                        <code className="composite-value">{user.compositeKey}</code>
                                                    </div>
                                                )}

                                                <div className="user-stats">
                                                    <div className="stat-item">
                                                        <FaAd className="stat-icon" />
                                                        <span className="stat-value">{user.advertCount} Adverts</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <FaStar className="stat-icon" />
                                                        <span className="stat-value">{user.reviewCount} Reviews</span>
                                                    </div>
                                                    <button
                                                        className={`admin-comment-button ${user.notesCount > 0 ? 'has-notes' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openNotesPopup(user.id);
                                                        }}
                                                    >
                                                        <FaCommentAlt className="comment-icon" />
                                                        <span>
                                                            Admin Notes{user.notesCount > 0 ? ` (${user.notesCount})` : ''}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="user-actions">
                                                <Link to={`/admin/user/${user.id}`} className="view-profile-button">
                                                    <FaEye /> View Profile
                                                </Link>
                                                <button
                                                    className={`blacklist-button ${
                                                        user.blacklisted ? 'unblacklist' : 'blacklist'
                                                    }`}
                                                    onClick={(e) => toggleBlacklist(e, user.id, user.blacklisted)}
                                                >
                                                    <FaUserSlash /> {user.blacklisted ? 'Unblacklist' : 'Blacklist'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-results">
                                <p>No users found matching your search criteria.</p>
                            </div>
                        )}
                    </>
                )}

                {selectedUserForNotes && (
                    <div className="admin-notes-popup">
                        <div className="popup-backdrop" onClick={() => setSelectedUserForNotes(null)}></div>
                        <div className="popup-content">
                            <button
                                className="popup-close-button"
                                onClick={() => setSelectedUserForNotes(null)}
                            >
                                <FaTimes />
                            </button>

                            <h3>Admin Notes</h3>

                            <ul className="note-list">
                                {userNotes.length > 0 ? (
                                    userNotes.map((note) => (
                                        <li key={note.id}>
                                            <p>{note.text}</p>
                                            <small>
                                                {note.adminName || 'Admin'} &middot;{' '}
                                                {note.createdAt?.seconds
                                                    ? new Date(note.createdAt.seconds * 1000).toLocaleString()
                                                    : 'Unknown date'}
                                            </small>
                                            <button
                                                className="note-delete-button"
                                                onClick={() => deleteNote(note.id)}
                                                title="Delete note"
                                            >
                                                <FaTimes />
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li>No notes yet for this user.</li>
                                )}
                            </ul>

                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a new note..."
                                rows={4}
                            />

                            <button
                                onClick={async () => {
                                    if (!noteText.trim()) return;

                                    const first = userData?.firstName || 'Admin';
                                    const lastInitial = userData?.lastName?.charAt(0).toUpperCase() || '';
                                    const fullAdminName = `${first} ${lastInitial}.`;

                                    const newNote = {
                                        userId: selectedUserForNotes,
                                        text: noteText,
                                        createdAt: new Date(),
                                        adminName: fullAdminName,
                                    };

                                    await setDoc(doc(collection(db, 'adminNotes')), newNote);
                                    setNoteText('');
                                    await openNotesPopup(selectedUserForNotes);
                                }}
                                disabled={!noteText.trim()}
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;