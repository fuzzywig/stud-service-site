import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase.js";

// Register, login, logout functions (unchanged)
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};

export { auth };

// Enhanced function to check both users and adminUsers collections
const fetchUserData = async (uid) => {
    try {
        console.log('firebaseAuth: Checking user data for:', uid);

        // First, check the users collection (frontend users)
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('firebaseAuth: Found user in users collection:', userData);
            return {
                uid,
                ...userData,
                source: 'users'
            };
        }

        // Then, check the adminUsers collection (staff members)
        const adminQuery = query(collection(db, 'adminUsers'), where('uid', '==', uid));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
            const adminData = adminSnapshot.docs[0].data();
            console.log('firebaseAuth: Found user in adminUsers collection:', adminData);

            // Map admin data to expected user data structure
            return {
                uid,
                email: adminData.email,
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                role: adminData.role,
                avatar: adminData.avatar,
                isActive: adminData.isActive,
                department: adminData.department,
                jobTitle: adminData.jobTitle,
                contactNumber: adminData.contactNumber,
                company: adminData.company,
                permissions: adminData.permissions || [],
                // Important: Mark as admin so they can access admin areas
                isAdmin: true,
                isStaffUser: true, // Flag to identify staff users
                source: 'adminUsers'
            };
        }

        console.log('firebaseAuth: User not found in either collection');
        return null;

    } catch (error) {
        console.error('firebaseAuth: Error fetching user data:', error);
        return null;
    }
};

// ✅ Enhanced useAuth Hook that checks both collections
export function useAuth() {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // 🔁 Force refresh token to get latest custom claims
                    await user.getIdToken(true);

                    // Use enhanced function to check both collections
                    const fetchedUserData = await fetchUserData(user.uid);

                    if (fetchedUserData) {
                        console.log(`firebaseAuth: User data loaded from ${fetchedUserData.source} collection`);
                        setUserData(fetchedUserData);
                    } else {
                        console.log('firebaseAuth: No user data found');
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("firebaseAuth: Failed to fetch user data", error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { currentUser, userData, loading };
}