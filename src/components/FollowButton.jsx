// FollowButton.jsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserCheck, faSpinner, faUserMinus } from '@fortawesome/free-solid-svg-icons';

export default function FollowButton({ targetUserId, currentUserId, targetUserName, currentUserName }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [animateSuccess, setAnimateSuccess] = useState(false);

    // Prevent following yourself
    if (currentUserId === targetUserId) {
        return null;
    }

    // Create a consistent follow document ID
    const followId = `${currentUserId}_${targetUserId}`;

    useEffect(() => {
        if (!currentUserId || !targetUserId) return;

        // Check if current user is following target user
        const checkFollowing = async () => {
            try {
                const followDoc = await getDoc(doc(db, 'follows', followId));
                setIsFollowing(followDoc.exists());
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };

        checkFollowing();
    }, [currentUserId, targetUserId, followId]);

    const handleFollow = async () => {
        if (!currentUserId || !targetUserId || loading) return;

        // Additional safety check
        if (currentUserId === targetUserId) {
            alert("You cannot follow yourself!");
            return;
        }

        setLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                await deleteDoc(doc(db, 'follows', followId));
                setIsFollowing(false);
            } else {
                // Follow
                await setDoc(doc(db, 'follows', followId), {
                    followerId: currentUserId,
                    followingId: targetUserId,
                    followerName: currentUserName || 'Unknown User',
                    followingName: targetUserName || 'Unknown User',
                    timestamp: new Date().toISOString()
                });
                setIsFollowing(true);

                // Trigger success animation
                setAnimateSuccess(true);
                setTimeout(() => setAnimateSuccess(false), 300);
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
            alert('Failed to update follow status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="follow-button-container">
            <button
                className={`follow-button ${isFollowing ? 'following' : 'follow'} ${animateSuccess ? 'animate-success' : ''}`}
                onClick={handleFollow}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} className="follow-button-icon follow-button-spinner" />
                        <span>Processing...</span>
                    </>
                ) : isFollowing ? (
                    <>
                        <FontAwesomeIcon icon={faUserCheck} className="follow-button-icon" />
                        <span className="follow-text">Following</span>
                        <span className="unfollow-text">Unfollow</span>
                    </>
                ) : (
                    <>
                        <FontAwesomeIcon icon={faUserPlus} className="follow-button-icon" />
                        <span>Follow</span>
                    </>
                )}
            </button>
        </div>
    );
}