import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faUser,
    faLock,
    faIdCard,
    faPencilAlt,
    faEnvelope,
    faPhone,
    faMapMarkerAlt,
    faEye,
    faEyeSlash,
    faCheckCircle,
    faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { auth, db } from '../firebase/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import './ProfileSettingsModal.css';

export default function ProfileSettingsModal({ currentData, onSave, onClose, initialTab = 'profile' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile form data
    const [profileData, setProfileData] = useState({
        firstName: currentData.firstName || '',
        lastName: currentData.lastName || '',
        email: currentData.email || '',
        phone: currentData.phone || '',
        address1: currentData.address1 || '',
        address2: currentData.address2 || '',
        city: currentData.city || '',
        county: currentData.county || '',
        postcode: currentData.postcode || ''
    });

    // Bio form data
    const [bioData, setBioData] = useState({
        bio: currentData.bio || ''
    });

    // Council details form data
    const [councilData, setCouncilData] = useState({
        breederType: currentData.breederType || 'hobbyist',
        licenceNumber: currentData.licenceNumber || '',
        localAuthority: currentData.localAuthority || ''
    });

    // Password form data
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Tab configuration
    const tabs = [
        { id: 'profile', label: 'Profile Details', icon: faUser },
        { id: 'bio', label: 'Bio', icon: faPencilAlt },
        { id: 'council', label: 'Council Licence', icon: faIdCard },
        { id: 'password', label: 'Change Password', icon: faLock }
    ];

    // Handle profile form changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    // Handle bio form changes
    const handleBioChange = (e) => {
        setBioData({ bio: e.target.value });
    };

    // Handle council form changes
    const handleCouncilChange = (e) => {
        const { name, value } = e.target;
        setCouncilData(prev => ({ ...prev, [name]: value }));
    };

    // Handle password form changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    // Save profile data
    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await onSave(profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        }
    };

    // Save bio
    const handleSaveBio = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { bio: bioData.bio });
            setMessage({ type: 'success', text: 'Bio updated successfully!' });

            // Update the parent component's data
            if (onSave) {
                onSave({ ...currentData, bio: bioData.bio });
            }

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update bio. Please try again.' });
            setLoading(false);
        }
    };

    // Save council details
    const handleSaveCouncil = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                breederType: councilData.breederType,
                licenceNumber: councilData.licenceNumber,
                localAuthority: councilData.localAuthority
            });

            setMessage({ type: 'success', text: 'Council details updated successfully!' });

            // Update the parent component's data
            if (onSave) {
                onSave({ ...currentData, ...councilData });
            }

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update council details. Please try again.' });
            setLoading(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await updatePassword(auth.currentUser, passwordData.newPassword);

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setMessage({ type: 'error', text: 'Current password is incorrect!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
            }
            setLoading(false);
        }
    };

    // Get the appropriate save handler for the current tab
    const getCurrentSaveHandler = () => {
        switch (activeTab) {
            case 'profile':
                return handleSaveProfile;
            case 'bio':
                return handleSaveBio;
            case 'council':
                return handleSaveCouncil;
            case 'password':
                return handleChangePassword;
            default:
                return null;
        }
    };

    return (
        <div className="psm-modal-overlay" onClick={onClose}>
            <div className="psm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="psm-modal-header">
                    <h2>Account Settings</h2>
                    <button className="psm-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="psm-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`psm-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setMessage({ type: '', text: '' });
                            }}
                        >
                            <FontAwesomeIcon icon={tab.icon} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Message Display */}
                {message.text && (
                    <div className={`psm-message ${message.type}`}>
                        <FontAwesomeIcon
                            icon={message.type === 'success' ? faCheckCircle : faExclamationCircle}
                        />
                        {message.text}
                    </div>
                )}

                {/* Tab Content */}
                <div className="psm-tab-content">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="psm-form">
                            <div className="psm-form-row">
                                <div className="psm-form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faUser} />
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your first name"
                                    />
                                </div>
                                <div className="psm-form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faUser} />
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your last name"
                                    />
                                </div>
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faPhone} />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleProfileChange}
                                    placeholder="07123 456789"
                                />
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    Address Line 1
                                </label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={profileData.address1}
                                    onChange={handleProfileChange}
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    Address Line 2 (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={profileData.address2}
                                    onChange={handleProfileChange}
                                    placeholder="Apartment, suite, etc."
                                />
                            </div>

                            <div className="psm-form-row">
                                <div className="psm-form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={profileData.city}
                                        onChange={handleProfileChange}
                                        placeholder="London"
                                    />
                                </div>
                                <div className="psm-form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                                        County
                                    </label>
                                    <input
                                        type="text"
                                        name="county"
                                        value={profileData.county}
                                        onChange={handleProfileChange}
                                        placeholder="Greater London"
                                    />
                                </div>
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    Postcode
                                </label>
                                <input
                                    type="text"
                                    name="postcode"
                                    value={profileData.postcode}
                                    onChange={handleProfileChange}
                                    placeholder="SW1A 1AA"
                                />
                            </div>
                        </div>
                    )}

                    {/* Bio Tab */}
                    {activeTab === 'bio' && (
                        <div className="psm-form">
                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                    Your Bio
                                </label>
                                <p className="psm-field-help">
                                    Tell others about yourself, your experience with dogs, and what you offer.
                                </p>
                                <textarea
                                    value={bioData.bio}
                                    onChange={handleBioChange}
                                    maxLength={500}
                                    rows={8}
                                    placeholder="Share your story, experience, and what makes your service special..."
                                />
                                <div className="psm-char-count">
                                    {bioData.bio.length}/500 characters
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Council Tab */}
                    {activeTab === 'council' && (
                        <div className="psm-form">
                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faIdCard} />
                                    Breeder Type
                                </label>
                                <select
                                    name="breederType"
                                    value={councilData.breederType}
                                    onChange={handleCouncilChange}
                                >
                                    <option value="hobbyist">Hobbyist Breeder</option>
                                    <option value="licensed">Licensed Breeder</option>
                                </select>
                            </div>

                            {councilData.breederType === 'licensed' && (
                                <>
                                    <div className="psm-form-group">
                                        <label>
                                            <FontAwesomeIcon icon={faIdCard} />
                                            Local Authority
                                        </label>
                                        <p className="psm-field-help">
                                            Enter the name of the council that issued your breeding licence.
                                        </p>
                                        <input
                                            type="text"
                                            name="localAuthority"
                                            value={councilData.localAuthority}
                                            onChange={handleCouncilChange}
                                            placeholder="e.g., Westminster City Council"
                                        />
                                    </div>

                                    <div className="psm-form-group">
                                        <label>
                                            <FontAwesomeIcon icon={faIdCard} />
                                            Licence Number
                                        </label>
                                        <p className="psm-field-help">
                                            Your official breeding licence number as provided by your local authority.
                                        </p>
                                        <input
                                            type="text"
                                            name="licenceNumber"
                                            value={councilData.licenceNumber}
                                            onChange={handleCouncilChange}
                                            placeholder="e.g., LN-2024-12345"
                                        />
                                    </div>

                                    <div className="psm-info-box">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <p>
                                            Licensed breeders are verified by their local council and must meet
                                            regulatory standards for breeding dogs. This information will be
                                            displayed on your profile to build trust with potential customers.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="psm-form">
                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faLock} />
                                    Current Password
                                </label>
                                <div className="psm-password-input">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        className="psm-toggle-password"
                                        onClick={() => setShowPasswords(prev => ({
                                            ...prev,
                                            current: !prev.current
                                        }))}
                                    >
                                        <FontAwesomeIcon
                                            icon={showPasswords.current ? faEyeSlash : faEye}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faLock} />
                                    New Password
                                </label>
                                <div className="psm-password-input">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your new password"
                                    />
                                    <button
                                        type="button"
                                        className="psm-toggle-password"
                                        onClick={() => setShowPasswords(prev => ({
                                            ...prev,
                                            new: !prev.new
                                        }))}
                                    >
                                        <FontAwesomeIcon
                                            icon={showPasswords.new ? faEyeSlash : faEye}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faLock} />
                                    Confirm New Password
                                </label>
                                <div className="psm-password-input">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm your new password"
                                    />
                                    <button
                                        type="button"
                                        className="psm-toggle-password"
                                        onClick={() => setShowPasswords(prev => ({
                                            ...prev,
                                            confirm: !prev.confirm
                                        }))}
                                    >
                                        <FontAwesomeIcon
                                            icon={showPasswords.confirm ? faEyeSlash : faEye}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="psm-info-box">
                                <FontAwesomeIcon icon={faExclamationCircle} />
                                <p>
                                    Make sure your password is at least 6 characters long and includes
                                    a mix of letters, numbers, and symbols for better security.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="psm-modal-actions">
                    <button
                        className="psm-cancel-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="psm-save-btn"
                        onClick={getCurrentSaveHandler()}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' :
                            activeTab === 'password' ? 'Change Password & Close' : 'Save & Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}