// Update your NotificationContext.jsx file:
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
    const [newAdvertsCount, setNewAdvertsCount] = useState(0);
    const [hasNewFollowingAdverts, setHasNewFollowingAdverts] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

    const checkNewAdverts = async () => {
        if (!currentUser) return;

        try {
            // Get followed users
            const followsQuery = query(
                collection(db, "follows"),
                where("followerId", "==", currentUser.uid)
            );
            const followsSnap = await getDocs(followsQuery);
            const followedUserIds = followsSnap.docs.map(doc => doc.data().followingId);

            if (followedUserIds.length === 0) {
                setHasNewFollowingAdverts(false);
                setNewAdvertsCount(0);
                return;
            }

            // Get viewed adverts from localStorage
            const viewedKey = `followingFeed_viewed_${currentUser.uid}`;
            const viewed = localStorage.getItem(viewedKey);
            const viewedAdverts = viewed ? new Set(JSON.parse(viewed)) : new Set();

            // Query for adverts from followed users in the last 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const advertsQuery = query(
                collection(db, "allListings"),
                where("ownerId", "in", followedUserIds),
                where("approved", "==", true),
                where("createdAt", ">", sevenDaysAgo)
            );

            const advertsSnap = await getDocs(advertsQuery);
            const newAdverts = advertsSnap.docs.filter(doc => {
                const data = doc.data();
                return data.expired === false &&
                    data.sold !== true &&
                    !viewedAdverts.has(doc.id);
            });

            setNewAdvertsCount(newAdverts.length);
            setHasNewFollowingAdverts(newAdverts.length > 0);
        } catch (error) {
            console.error("Error checking new adverts:", error);
        }
    };

    // Check immediately and periodically
    useEffect(() => {
        if (currentUser) {
            checkNewAdverts();
            const interval = setInterval(checkNewAdverts, 60000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    // Listen for storage events (when other tabs update localStorage)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (currentUser && e.key === `followingFeed_viewed_${currentUser.uid}`) {
                checkNewAdverts();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentUser]);

    // Listen for custom events (same tab updates)
    useEffect(() => {
        const handleAdvertViewed = () => {
            checkNewAdverts();
        };

        window.addEventListener('advertViewed', handleAdvertViewed);
        return () => window.removeEventListener('advertViewed', handleAdvertViewed);
    }, [currentUser]);

    // Expose method to refresh count
    const refreshNotificationCount = () => {
        checkNewAdverts();
    };

    return (
        <NotificationContext.Provider value={{
            newAdvertsCount,
            hasNewFollowingAdverts,
            refreshNotificationCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
}