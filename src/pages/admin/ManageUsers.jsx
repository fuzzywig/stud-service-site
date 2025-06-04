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
    where,
    limit
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
    FaFilter,
    FaClock
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
            // Fetch notes separately to handle potential query errors
            let notesCount = 0;
            try {
                const notesSnap = await getDocs(
                    query(
                        collection(db, 'adminNotes'),
                        where('userId', '==', userData.id)
                    )
                );
                notesCount = notesSnap.size;
            } catch (notesError) {
                console.log('Error fetching notes, trying without query:', notesError);
                // If query fails, try to get all notes and filter manually
                try {
                    const allNotesSnap = await getDocs(collection(db, 'adminNotes'));
                    notesCount = allNotesSnap.docs.filter(doc => doc.data().userId === userData.id).length;
                } catch (fallbackError) {
                    console.error('Failed to fetch notes:', fallbackError);
                }
            }

            const [advertsSnap, reviewsSnap, recentAdvertsSnap] = await Promise.all([
                getDocs(
                    query(
                        collection(db, 'allListings'),
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
                        collection(db, 'allListings'),
                        where('ownerId', '==', userData.id),
                        where('approved', '==', true),
                        orderBy('createdAt', 'desc'),
                        limit(3)
                    )
                )
            ]);

            const recentAdverts = recentAdvertsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`User ${userData.id} has ${notesCount} notes`);

            return {
                ...userData,
                advertCount: advertsSnap.size,
                reviewCount: reviewsSnap.size,
                notesCount: notesCount,
                recentAdverts: recentAdverts
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                ...userData,
                advertCount: 0,
                reviewCount: 0,
                notesCount: 0,
                recentAdverts: []
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

            // Update the notes count in the user list
            setUsers(prev => prev.map(user =>
                user.id === selectedUserForNotes
                    ? { ...user, notesCount: Math.max(0, user.notesCount - 1) }
                    : user
            ));
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

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown time';

        const now = new Date();
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="mu-admin-page">
                <AdminSidebar />
                <div className="mu-content-area">
                    <div className="mu-loading-container">
                        <div className="mu-loading-animation">
                            <div className="mu-loading-circle"></div>
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
            <div className="mu-admin-page">
                <AdminSidebar />
                <div className="mu-content-area">
                    <div className="mu-error-container">
                        <h2>Access Denied</h2>
                        <p>You do not have permission to view this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mu-admin-page">
            <AdminSidebar />

            <div className="mu-content-area">
                <div className="mu-page-header">
                    <h1 className="mu-page-title">Manage Users</h1>
                    <div className="mu-page-actions">
                        <div className="mu-filter-controls">
                            <button
                                className={`mu-filter-button ${filterStatus === 'all' ? 'mu-active' : ''}`}
                                onClick={() => handleFilterChange('all')}
                            >
                                All Users
                            </button>
                            <button
                                className={`mu-filter-button ${filterStatus === 'active' ? 'mu-active' : ''}`}
                                onClick={() => handleFilterChange('active')}
                            >
                                Active
                            </button>
                            <button
                                className={`mu-filter-button ${filterStatus === 'blacklisted' ? 'mu-active' : ''}`}
                                onClick={() => handleFilterChange('blacklisted')}
                            >
                                Blacklisted
                            </button>
                            <button
                                className={`mu-filter-button mu-duplicate-filter ${showDuplicatesOnly ? 'mu-active' : ''}`}
                                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                            >
                                <FaCopy /> Duplicates Only
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mu-search-section">
                    <div className="mu-search-container">
                        <FaSearch className="mu-search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, phone, or ID..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="mu-search-input"
                        />
                    </div>
                    <div className="mu-search-results-count">
                        <span>{filteredUsers.length} users found</span>
                        {duplicateGroups.length > 0 && (
                            <span className="mu-duplicate-count">
                                • {duplicateGroups.length} duplicate groups detected
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mu-error-banner">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="mu-loading-container">
                        <div className="mu-loading-animation">
                            <div className="mu-loading-circle"></div>
                            <div className="mu-loading-lines">
                                <div className="mu-loading-line"></div>
                                <div className="mu-loading-line"></div>
                                <div className="mu-loading-line"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {duplicateGroups.length > 0 && !showDuplicatesOnly && (
                            <div className="mu-duplicate-alert-banner">
                                <FaExclamationTriangle className="mu-alert-icon" />
                                <span>
                                    {duplicateGroups.length} duplicate account group{duplicateGroups.length > 1 ? 's' : ''} detected
                                </span>
                                <button
                                    className="mu-view-duplicates-btn"
                                    onClick={() => setShowDuplicatesOnly(true)}
                                >
                                    View Duplicates
                                </button>
                            </div>
                        )}

                        {filteredUsers.length > 0 ? (
                            <div className="mu-users-list">
                                {filteredUsers.map((user) => {
                                    const duplicateGroup = duplicateGroups.find(group =>
                                        group.users.some(u => u.id === user.id)
                                    );
                                    const isDuplicate = isDuplicateUser(user.id);
                                    const isOriginal = isOriginalUser(user.id);

                                    return (
                                        <div
                                            className={`mu-user-list-item ${isDuplicate ? 'mu-is-duplicate' : ''} ${isOriginal ? 'mu-is-original' : ''}`}
                                            key={user.id}
                                        >
                                            <div className="mu-user-avatar-section">
                                                <div className="mu-user-avatar-wrapper">
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="mu-user-avatar"
                                                        />
                                                    ) : (
                                                        <FaUserCircle className="mu-user-avatar mu-default-avatar-icon" />
                                                    )}
                                                    <span
                                                        className={`mu-status-indicator ${
                                                            user.blacklisted ? 'mu-status-blacklisted' : 'mu-status-active'
                                                        }`}
                                                    ></span>
                                                </div>
                                            </div>

                                            <div className="mu-user-info-section">
                                                <div className="mu-user-header">
                                                    <h3 className="mu-user-name">
                                                        {user.firstName} {user.lastName}
                                                        {isDuplicate && (
                                                            <span className="mu-duplicate-badge mu-duplicate">
                                                                <FaCopy /> Duplicate
                                                            </span>
                                                        )}
                                                        {isOriginal && duplicateGroup && (
                                                            <span className="mu-duplicate-badge mu-original">
                                                                <FaCheckCircle /> Original ({duplicateGroup.duplicateCount} duplicate{duplicateGroup.duplicateCount > 1 ? 's' : ''})
                                                            </span>
                                                        )}
                                                    </h3>
                                                    {user.createdAt && (
                                                        <span className="mu-user-joined-date">
                                                            <FaCalendarAlt className="mu-date-icon" />
                                                            Joined {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mu-user-details">
                                                    <div className="mu-user-detail">
                                                        <FaEnvelope className="mu-detail-icon" />
                                                        <span className="mu-detail-value">{user.email}</span>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="mu-user-detail">
                                                            <FaPhone className="mu-detail-icon" />
                                                            <span className="mu-detail-value">{user.phone}</span>
                                                        </div>
                                                    )}
                                                    {(user.city || user.county) && (
                                                        <div className="mu-user-detail">
                                                            <FaMapMarkerAlt className="mu-detail-icon" />
                                                            <span className="mu-detail-value">
                                                                {user.city && user.county
                                                                    ? `${user.city}, ${user.county}`
                                                                    : user.city || user.county}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mu-user-detail">
                                                        <FaIdCard className="mu-detail-icon" />
                                                        <span className="mu-detail-value mu-user-id">
                                                            ID: {user.id}
                                                            <button
                                                                className="mu-copy-id-btn"
                                                                onClick={() => copyToClipboard(user.id)}
                                                                title="Copy ID"
                                                            >
                                                                <FaCopy />
                                                            </button>
                                                        </span>
                                                    </div>
                                                </div>

                                                {duplicateGroup && (
                                                    <div className="mu-composite-key-info">
                                                        <span className="mu-composite-label">Composite Key:</span>
                                                        <code className="mu-composite-value">{user.compositeKey}</code>
                                                    </div>
                                                )}

                                                <div className="mu-user-stats">
                                                    <div className="mu-stat-item">
                                                        <FaAd className="mu-stat-icon" />
                                                        <span className="mu-stat-value">{user.advertCount} Adverts</span>
                                                    </div>
                                                    <div className="mu-stat-item">
                                                        <FaStar className="mu-stat-icon" />
                                                        <span className="mu-stat-value">{user.reviewCount} Reviews</span>
                                                    </div>
                                                    <button
                                                        className={`mu-admin-comment-button ${user.notesCount > 0 ? 'mu-has-notes' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openNotesPopup(user.id);
                                                        }}
                                                    >
                                                        <FaCommentAlt className="mu-comment-icon" />
                                                        <span>
                                                            Admin Notes{user.notesCount > 0 ? ` (${user.notesCount})` : ''}
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Recent Adverts Section */}
                                                {user.recentAdverts && user.recentAdverts.length > 0 && (
                                                    <div className="mu-recent-adverts-section">
                                                        <h4 className="mu-recent-adverts-title">Recent Adverts</h4>
                                                        <div className="mu-recent-adverts-list">
                                                            {user.recentAdverts.map((advert) => (
                                                                <div key={advert.id} className="mu-recent-advert-item">
                                                                    <Link
                                                                        to={`/admin/adverts/${advert.id}`}
                                                                        className="mu-advert-link"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="mu-advert-title">{advert.title || 'Untitled Advert'}</div>
                                                                        <div className="mu-advert-meta">
                                                                            <span className="mu-advert-location">
                                                                                <FaMapMarkerAlt /> {advert.city || 'Unknown Location'}
                                                                            </span>
                                                                            <span className="mu-advert-date">
                                                                                <FaClock /> {formatTimeAgo(advert.createdAt)}
                                                                            </span>
                                                                        </div>
                                                                    </Link>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mu-user-actions">
                                                <Link to={`/admin/user/${user.id}`} className="mu-view-profile-button">
                                                    <FaEye /> View Profile
                                                </Link>
                                                <button
                                                    className={`mu-blacklist-button ${
                                                        user.blacklisted ? 'mu-unblacklist' : 'mu-blacklist'
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
                            <div className="mu-no-results">
                                <p>No users found matching your search criteria.</p>
                            </div>
                        )}
                    </>
                )}

                {selectedUserForNotes && (
                    <div className="mu-admin-notes-popup">
                        <div className="mu-popup-backdrop" onClick={() => setSelectedUserForNotes(null)}></div>
                        <div className="mu-popup-content">
                            <button
                                className="mu-popup-close-button"
                                onClick={() => setSelectedUserForNotes(null)}
                            >
                                <FaTimes />
                            </button>

                            <h3>Admin Notes</h3>

                            <ul className="mu-note-list">
                                {userNotes.length > 0 ? (
                                    userNotes.map((note) => (
                                        <li key={note.id} className="mu-note-item">
                                            <p className="mu-note-text">{note.text}</p>
                                            <small className="mu-note-meta">
                                                {note.adminName || 'Admin'} &middot;{' '}
                                                {note.createdAt?.seconds
                                                    ? new Date(note.createdAt.seconds * 1000).toLocaleString()
                                                    : 'Unknown date'}
                                            </small>
                                            <button
                                                className="mu-note-delete-button"
                                                onClick={() => deleteNote(note.id)}
                                                title="Delete note"
                                            >
                                                <FaTimes />
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="mu-note-item">No notes yet for this user.</li>
                                )}
                            </ul>

                            <textarea
                                className="mu-note-textarea"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a new note..."
                                rows={4}
                            />

                            <button
                                className="mu-note-save-button"
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

                                    // Update the notes count in the user list
                                    setUsers(prev => prev.map(user =>
                                        user.id === selectedUserForNotes
                                            ? { ...user, notesCount: user.notesCount + 1 }
                                            : user
                                    ));
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