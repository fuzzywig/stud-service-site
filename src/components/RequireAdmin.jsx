import React, { useEffect, useState } from 'react';
import { useAuth, logoutUser } from '../firebase/firebaseAuth';
import { useLoginModal } from '../context/LoginContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function RequireAdmin({ children }) {
    const { currentUser, userData, loading } = useAuth();
    const { openLogin, closeLogin, isLoginOpen } = useLoginModal();
    const [authError, setAuthError] = useState(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [fullUserData, setFullUserData] = useState(null);

    // Enhanced function to check both users and adminUsers collections
    const fetchUserAdminStatus = async (uid) => {
        try {
            console.log('RequireAdmin: Checking admin status for:', uid);

            // First, check the users collection (existing logic for frontend users)
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('RequireAdmin: Found user in users collection:', userData);

                if (userData.isAdmin === true) {
                    return {
                        isAdmin: true,
                        userData: { uid, ...userData },
                        source: 'users'
                    };
                }
            }

            // Then, check the adminUsers collection (new logic for staff members)
            const adminQuery = query(collection(db, 'adminUsers'), where('uid', '==', uid));
            const adminSnapshot = await getDocs(adminQuery);

            if (!adminSnapshot.empty) {
                const adminData = adminSnapshot.docs[0].data();
                console.log('RequireAdmin: Found user in adminUsers collection:', adminData);

                return {
                    isAdmin: true,
                    userData: {
                        uid,
                        email: adminData.email,
                        firstName: adminData.firstName,
                        lastName: adminData.lastName,
                        role: adminData.role,
                        avatar: adminData.avatar,
                        isActive: adminData.isActive,
                        department: adminData.department,
                        jobTitle: adminData.jobTitle,
                        // Add any other fields you need
                        isAdmin: true,
                        isStaffUser: true // Flag to identify staff users
                    },
                    source: 'adminUsers'
                };
            }

            console.log('RequireAdmin: User not found in either collection or not admin');
            return {
                isAdmin: false,
                userData: null,
                source: null
            };

        } catch (error) {
            console.error('RequireAdmin: Error checking admin status:', error);
            return {
                isAdmin: false,
                userData: null,
                source: null,
                error: error.message
            };
        }
    };

    // Fetch full user data if we have a user but incomplete data
    useEffect(() => {
        const fetchFullUserData = async () => {
            if (currentUser && (!userData || userData.isAdmin === undefined)) {
                const result = await fetchUserAdminStatus(currentUser.uid);

                if (result.isAdmin) {
                    console.log(`RequireAdmin: User is admin (source: ${result.source})`);
                    setFullUserData(result.userData);
                } else {
                    console.log('RequireAdmin: User is not admin or not found');
                    setFullUserData({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        isAdmin: false
                    });
                }
            }
        };

        fetchFullUserData();
    }, [currentUser, userData]);

    // Use fullUserData if available, otherwise userData
    const effectiveUserData = fullUserData || userData;

    useEffect(() => {
        console.log('RequireAdmin: State check', {
            loading,
            currentUser: currentUser?.email,
            userData: effectiveUserData,
            isAdmin: effectiveUserData?.isAdmin,
            isStaffUser: effectiveUserData?.isStaffUser,
            source: effectiveUserData?.isStaffUser ? 'adminUsers' : 'users',
            isLoginOpen
        });

        // Reset error when user changes
        setAuthError(null);
    }, [currentUser, effectiveUserData, loading, isLoginOpen]);

    useEffect(() => {
        // If not loading and no user, open login modal
        if (!loading && !currentUser && !isSigningOut) {
            console.log('RequireAdmin: Opening login modal - no user');
            openLogin();
        }

        // If user exists but is not admin, set error
        if (!loading && currentUser && effectiveUserData && effectiveUserData.isAdmin === false) {
            console.log('RequireAdmin: User is not admin');
            setAuthError('Admin access required');
            closeLogin();
        }

        // If user is admin, close login modal
        if (!loading && currentUser && effectiveUserData?.isAdmin === true) {
            console.log('RequireAdmin: User is admin, closing modal');
            closeLogin();
        }
    }, [loading, currentUser, effectiveUserData, openLogin, closeLogin, isSigningOut]);

    const handleLoginAsAdmin = async () => {
        try {
            setIsSigningOut(true);
            console.log('RequireAdmin: Signing out current user...');

            // Sign out current user
            await logoutUser();

            // Small delay to ensure auth state updates
            setTimeout(() => {
                console.log('RequireAdmin: Opening login modal after sign out');
                setIsSigningOut(false);
                openLogin();
            }, 500);

        } catch (error) {
            console.error('RequireAdmin: Error signing out:', error);
            setAuthError('Error signing out. Please try again.');
            setIsSigningOut(false);
        }
    };

    // Show loading while auth is being checked or signing out
    if (loading || isSigningOut) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #007bff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p>{isSigningOut ? 'Signing out...' : 'Checking access...'}</p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // If no user, show message (login modal should be open)
    if (!currentUser) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>Admin Access Required</h2>
                    <p style={{ marginBottom: '20px' }}>Please log in with an admin account to continue.</p>
                    <button
                        onClick={() => {
                            console.log('RequireAdmin: Manual open login clicked');
                            openLogin();
                        }}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    // If we have a user but no userData yet, keep showing loading
    if (!effectiveUserData) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p>Loading user data...</p>
                </div>
            </div>
        );
    }

    // If logged in but not admin, show error with options
    if (effectiveUserData.isAdmin !== true) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxWidth: '500px'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px'
                    }}>
                        🚫
                    </div>
                    <h2 style={{ marginBottom: '20px', color: '#dc3545' }}>Access Denied</h2>
                    <p style={{ marginBottom: '10px' }}>
                        You need administrator privileges to access this page.
                    </p>
                    <p style={{ marginBottom: '30px', fontSize: '14px', color: '#666' }}>
                        Currently logged in as: <strong>{effectiveUserData.email || currentUser.email}</strong>
                        {effectiveUserData.firstName && effectiveUserData.lastName && (
                            <span> ({effectiveUserData.firstName} {effectiveUserData.lastName})</span>
                        )}
                    </p>

                    {authError && (
                        <p style={{ color: '#dc3545', marginBottom: '20px', fontSize: '14px' }}>
                            {authError}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleLoginAsAdmin}
                            disabled={isSigningOut}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isSigningOut ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: isSigningOut ? 0.6 : 1
                            }}
                        >
                            {isSigningOut ? 'Signing out...' : 'Log In as Admin'}
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Go to Home
                        </button>
                    </div>

                    <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
                        <p>Need admin access? Contact your system administrator.</p>
                    </div>
                </div>
            </div>
        );
    }

    // User is admin, render children with enhanced user data
    console.log('RequireAdmin: Rendering admin content');
    return React.Children.map(children, child =>
        React.cloneElement(child, {
            currentUser: {
                ...currentUser,
                ...effectiveUserData,
                uid: currentUser.uid,
                isAdmin: effectiveUserData.isAdmin
            }
        })
    );
}