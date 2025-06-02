import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import {
    writeBatch,
    doc,
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "firebase/auth";
import { deleteObject, ref } from "firebase/storage";
import { db, auth, storage } from "../firebase/firebase";
import './AccountDeletionModal.css';

const AccountDeletionModal = ({ isOpen, onClose, onConfirm, userEmail }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');

    const handleDelete = async () => {
        if (step === 2 && confirmText !== 'DELETE MY ACCOUNT') return;
        if (step === 3 && !password) {
            alert('Please enter your password');
            return;
        }

        setIsDeleting(true);

        try {
            if (step === 3) {
                // Re-authenticate the user
                const credential = EmailAuthProvider.credential(userEmail, password);
                await reauthenticateWithCredential(auth.currentUser, credential);
                console.log('Re-authentication successful');
            }

            await onConfirm();
        } catch (error) {
            console.error('Error in deletion process:', error);

            if (error.code === 'auth/requires-recent-login') {
                // Move to re-authentication step
                setStep(3);
                setIsDeleting(false);
            } else if (error.code === 'auth/wrong-password') {
                alert('Incorrect password. Please try again.');
                setIsDeleting(false);
            } else {
                alert(`Failed to delete account: ${error.message}`);
                setIsDeleting(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="gdpr-modal-overlay" onClick={onClose}>
            <div className="gdpr-delete-modal" onClick={e => e.stopPropagation()}>
                <button className="gdpr-modal-close" onClick={onClose}>×</button>

                {step === 1 && (
                    <>
                        <div className="gdpr-modal-header">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="gdpr-warning-icon" />
                            <h2>Delete Account</h2>
                        </div>

                        <div className="gdpr-warning-box">
                            <h3>⚠️ This action cannot be undone</h3>
                            <p>Deleting your account will permanently remove:</p>
                            <ul>
                                <li>Your profile and all personal information</li>
                                <li>All your adverts and listings</li>
                                <li>Your reviews and ratings</li>
                                <li>Your messages and communications</li>
                                <li>Any saved preferences or settings</li>
                            </ul>
                        </div>

                        <div className="gdpr-info-box">
                            <p><strong>Account to be deleted:</strong> {userEmail}</p>
                            <p className="gdpr-notice-text">In compliance with GDPR, all your data will be permanently erased from our systems.</p>
                        </div>

                        <div className="gdpr-modal-actions">
                            <button className="gdpr-cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="gdpr-proceed-btn" onClick={() => setStep(2)}>
                                Proceed to Delete
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="gdpr-modal-header">
                            <FontAwesomeIcon icon={faTrash} className="gdpr-delete-icon" />
                            <h2>Confirm Account Deletion</h2>
                        </div>

                        <div className="gdpr-final-warning">
                            <p>To confirm you want to permanently delete your account, please type:</p>
                            <p className="gdpr-confirm-phrase">DELETE MY ACCOUNT</p>
                        </div>

                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type the text above"
                            className="gdpr-confirm-input"
                            disabled={isDeleting}
                        />

                        <div className="gdpr-modal-actions">
                            <button
                                className="gdpr-back-btn"
                                onClick={() => {
                                    setStep(1);
                                    setConfirmText('');
                                }}
                                disabled={isDeleting}
                            >
                                Go Back
                            </button>
                            <button
                                className="gdpr-delete-btn"
                                onClick={handleDelete}
                                disabled={confirmText !== 'DELETE MY ACCOUNT' || isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete My Account'}
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="gdpr-modal-header">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="gdpr-warning-icon" />
                            <h2>Security Verification Required</h2>
                        </div>

                        <div className="gdpr-info-box">
                            <p>For security reasons, please enter your password to confirm account deletion.</p>
                        </div>

                        <div className="gdpr-password-section">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="gdpr-password-input"
                                disabled={isDeleting}
                            />
                        </div>

                        <div className="gdpr-modal-actions">
                            <button
                                className="gdpr-back-btn"
                                onClick={() => {
                                    setStep(2);
                                    setPassword('');
                                }}
                                disabled={isDeleting}
                            >
                                Go Back
                            </button>
                            <button
                                className="gdpr-delete-btn"
                                onClick={handleDelete}
                                disabled={!password || isDeleting}
                            >
                                {isDeleting ? 'Verifying...' : 'Verify and Delete'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Updated deletion function
const DeleteAccountSection = ({ currentUserId, userEmail }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            console.log("Starting account deletion for user:", currentUserId);

            // First, delete all Firestore data
            const batch = writeBatch(db);
            let batchCount = 0;

            // Delete user's listings
            try {
                const listingsQuery = query(
                    collection(db, "allListings"),
                    where("ownerId", "==", currentUserId)
                );
                const listings = await getDocs(listingsQuery);
                listings.forEach(docSnapshot => {
                    batch.delete(docSnapshot.ref);
                    batchCount++;
                });
            } catch (error) {
                console.error("Error querying listings:", error);
            }

            // Delete user's reviews
            try {
                const reviewsQuery = query(
                    collection(db, "reviews"),
                    where("ownerId", "==", currentUserId)
                );
                const reviews = await getDocs(reviewsQuery);
                reviews.forEach(docSnapshot => {
                    batch.delete(docSnapshot.ref);
                    batchCount++;
                });
            } catch (error) {
                console.error("Error querying reviews:", error);
            }

            // Delete user document
            batch.delete(doc(db, "users", currentUserId));
            batchCount++;

            // Commit all Firestore deletions
            if (batchCount > 0) {
                await batch.commit();
                console.log("Firestore data deleted successfully");
            }

            // Delete avatar from storage
            try {
                const avatarRef = ref(storage, `avatars/${currentUserId}`);
                await deleteObject(avatarRef);
            } catch (error) {
                console.log("No avatar to delete or error:", error);
            }

            // Finally, delete the authentication
            // This might throw an error if re-authentication is needed
            await deleteUser(auth.currentUser);
            console.log("Authentication deleted successfully");

            // Redirect to homepage
            window.location.href = '/';

        } catch (error) {
            // Re-throw the error to be handled by the modal
            throw error;
        }
    };

    return (
        <>
            <div className="gdpr-delete-section">
                <h3 className="gdpr-section-title">Delete Account</h3>
                <p className="gdpr-section-description">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    className="gdpr-delete-trigger-btn"
                    onClick={() => setShowDeleteModal(true)}
                >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete My Account
                </button>
            </div>

            <AccountDeletionModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                userEmail={userEmail}
            />
        </>
    );
};

export default DeleteAccountSection;