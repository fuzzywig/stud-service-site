import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { notifyProfilePasswordChange } from '../utils/emailNotifications';
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
    faExclamationCircle,
    faGlobe,
    faClipboardCheck,
    faHandHoldingHeart
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

    const [adoptionData, setAdoptionData] = useState({
        adoptionProcess: currentData.adoptionProcess || '',
        adoptionRequirements: currentData.adoptionRequirements || ''
    });

    // Council details form data - Updated to include rescue fields
    const [councilData, setCouncilData] = useState({
        breederType: currentData.breederType || 'hobby',
        licenceNumber: currentData.licenceNumber || '',
        localAuthority: currentData.localAuthority || '',
        organizationName: currentData.organizationName || '',
        charityNumber: currentData.charityNumber || '',
        websiteUrl: currentData.websiteUrl || ''
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

    // Tab configuration - Updated label
    const tabs = [
        { id: 'profile', label: 'Profile Details', icon: faUser },
        { id: 'bio', label: 'Bio', icon: faPencilAlt },
        { id: 'council', label: 'Account Type', icon: faIdCard },
        // Only show adoption tab for rescue organizations
        ...(currentData.breederType === 'rescue' ? [{ id: 'adoption', label: 'Adoption Process', icon: faClipboardCheck }] : []),
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

    // Add handler for adoption form changes
    const handleAdoptionChange = (e) => {
        const { name, value } = e.target;
        setAdoptionData(prev => ({ ...prev, [name]: value }));
    };

    // Add save adoption handler
    const handleSaveAdoption = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                adoptionProcess: adoptionData.adoptionProcess,
                adoptionRequirements: adoptionData.adoptionRequirements
            });

            setMessage({ type: 'success', text: 'Adoption process updated successfully!' });

            // Update the parent component's data
            if (onSave) {
                onSave({ ...currentData, ...adoptionData });
            }

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update adoption process. Please try again.' });
            setLoading(false);
        }
    };

    // Save council details - Updated to handle all account types
    const handleSaveCouncil = async () => {
        // Validation for rescue organizations
        if (councilData.breederType === 'rescue' && !councilData.organizationName.trim()) {
            setMessage({ type: 'error', text: 'Organization name is required for rescue organizations.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);

            // Prepare update data based on breeder type
            let updateData = {
                breederType: councilData.breederType
            };

            // Add fields based on breeder type
            if (councilData.breederType === 'licensed') {
                updateData.licenceNumber = councilData.licenceNumber;
                updateData.localAuthority = councilData.localAuthority;
                // Clear rescue fields
                updateData.organizationName = '';
                updateData.charityNumber = '';
                updateData.websiteUrl = '';
            } else if (councilData.breederType === 'rescue') {
                updateData.organizationName = councilData.organizationName;
                updateData.charityNumber = councilData.charityNumber;
                updateData.websiteUrl = councilData.websiteUrl;
                // Clear licensed breeder fields
                updateData.licenceNumber = '';
                updateData.localAuthority = '';
            } else {
                // Hobby breeder - clear all special fields
                updateData.licenceNumber = '';
                updateData.localAuthority = '';
                updateData.organizationName = '';
                updateData.charityNumber = '';
                updateData.websiteUrl = '';
            }

            await updateDoc(userRef, updateData);

            setMessage({ type: 'success', text: 'Account type updated successfully!' });

            // Update the parent component's data
            if (onSave) {
                onSave({ ...currentData, ...updateData });
            }

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update account type. Please try again.' });
            setLoading(false);
        }
    };

    // Change password - UPDATED WITH PROPER EMAIL NOTIFICATION
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

            // 🆕 FIXED: Send password change notification email with proper data
            try {
                console.log('📧 Sending password change notification...');

                // Get user agent and timestamp
                const userAgent = navigator.userAgent || 'Unknown device';
                const timestamp = new Date().toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const emailPayload = {
                    userEmail: currentData.email || auth.currentUser.email,
                    userName: `${currentData.firstName || ''} ${currentData.lastName || ''}`.trim() || 'User',
                    changeMethod: 'profile', // This indicates it was changed from profile settings
                    userAgent: userAgent,
                    ipAddress: 'Not available', // We can't easily get IP from frontend
                    timestamp: timestamp,
                    userId: auth.currentUser.uid
                };

                console.log('📧 Email payload:', emailPayload);

                const emailResult = await notifyProfilePasswordChange(emailPayload);

                if (emailResult.success) {
                    console.log('✅ Password change notification sent successfully');
                    setMessage({ type: 'success', text: 'Password changed successfully! A confirmation email has been sent.' });
                } else {
                    console.error('❌ Failed to send notification:', emailResult.error);
                    setMessage({ type: 'success', text: 'Password changed successfully!' });
                }
            } catch (emailError) {
                console.error('❌ Password change notification error:', emailError);
                // Don't block the password change if email fails
                setMessage({ type: 'success', text: 'Password changed successfully!' });
            }

            // Reset form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => {
                onClose();
            }, 2000); // Give user time to read the success message

        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setMessage({ type: 'error', text: 'Current password is incorrect!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
            }
            setLoading(false);
        }
    };

    // Update getCurrentSaveHandler to include adoption
    const getCurrentSaveHandler = () => {
        switch (activeTab) {
            case 'profile':
                return handleSaveProfile;
            case 'bio':
                return handleSaveBio;
            case 'council':
                return handleSaveCouncil;
            case 'adoption':
                return handleSaveAdoption;
            case 'password':
                return handleChangePassword;
            default:
                return null;
        }
    };

    // Determine bio placeholder text based on user type
    const getBioPlaceholder = () => {
        if (councilData.breederType === 'rescue') {
            return "Share your rescue organization's mission, history, and the types of animals you help. What makes your rescue special?";
        }
        return "Share your story, experience, and what makes your service special...";
    };

    // Determine bio label based on user type
    const getBioLabel = () => {
        if (councilData.breederType === 'rescue' && councilData.organizationName) {
            return `About ${councilData.organizationName}`;
        }
        return 'Your Bio';
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
                                    {getBioLabel()}
                                </label>
                                <p className="psm-field-help">
                                    {councilData.breederType === 'rescue'
                                        ? 'Tell others about your rescue organization and mission.'
                                        : 'Tell others about yourself, your experience with dogs, and what you offer.'}
                                </p>
                                <textarea
                                    value={bioData.bio}
                                    onChange={handleBioChange}
                                    maxLength={1000}
                                    rows={8}
                                    placeholder={getBioPlaceholder()}
                                />
                                <div className="psm-char-count">
                                    {bioData.bio.length}/1000 characters
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Type Tab (formerly Council Tab) */}
                    {activeTab === 'council' && (
                        <div className="psm-form">
                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faIdCard} />
                                    Account Type
                                </label>
                                <select
                                    name="breederType"
                                    value={councilData.breederType}
                                    onChange={handleCouncilChange}
                                >
                                    <option value="hobby">Hobby Breeder</option>
                                    <option value="licensed">Licensed Breeder</option>
                                    <option value="rescue">Rescue Organization</option>
                                </select>
                            </div>

                            {/* Licensed Breeder Fields */}
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

                            {/* Rescue Organization Fields */}
                            {councilData.breederType === 'rescue' && (
                                <>
                                    <div className="psm-form-group">
                                        <label>
                                            <FontAwesomeIcon icon={faHandHoldingHeart} />
                                            Organization Name <span style={{ color: '#e74c3c' }}>*</span>
                                        </label>
                                        <p className="psm-field-help">
                                            The official name of your rescue organization.
                                        </p>
                                        <input
                                            type="text"
                                            name="organizationName"
                                            value={councilData.organizationName}
                                            onChange={handleCouncilChange}
                                            placeholder="e.g., Happy Paws Rescue"
                                            required
                                        />
                                    </div>

                                    <div className="psm-form-group">
                                        <label>
                                            <FontAwesomeIcon icon={faIdCard} />
                                            Charity Registration Number
                                        </label>
                                        <p className="psm-field-help">
                                            If you're a registered charity, enter your registration number.
                                        </p>
                                        <input
                                            type="text"
                                            name="charityNumber"
                                            value={councilData.charityNumber}
                                            onChange={handleCouncilChange}
                                            placeholder="e.g., 1234567"
                                        />
                                    </div>

                                    <div className="psm-form-group">
                                        <label>
                                            <FontAwesomeIcon icon={faGlobe} />
                                            Website or Social Media
                                        </label>
                                        <p className="psm-field-help">
                                            Your organization's website or main social media page.
                                        </p>
                                        <input
                                            type="url"
                                            name="websiteUrl"
                                            value={councilData.websiteUrl}
                                            onChange={handleCouncilChange}
                                            placeholder="https://www.happypawsrescue.org"
                                        />
                                    </div>

                                    <div className="psm-info-box">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <p>
                                            Rescue organizations are dedicated to rescuing, rehabilitating, and
                                            rehoming animals in need. This information helps potential adopters
                                            identify and trust your organization.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Hobby Breeder Info */}
                            {councilData.breederType === 'hobby' && (
                                <div className="psm-info-box">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <p>
                                        Hobby breeders typically breed infrequently (1-2 litters per year)
                                        and focus on improving the breed. They may not be licensed if under
                                        the threshold but still operate ethically.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Adoption Tab */}
                    {activeTab === 'adoption' && currentData.breederType === 'rescue' && (
                        <div className="psm-form">
                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                    Adoption Process
                                </label>
                                <p className="psm-field-help">
                                    Describe your adoption process step by step. This helps potential adopters understand what to expect.
                                </p>
                                <textarea
                                    name="adoptionProcess"
                                    value={adoptionData.adoptionProcess}
                                    onChange={handleAdoptionChange}
                                    maxLength={1000}
                                    rows={6}
                                    placeholder="Example: We follow a thorough adoption process to ensure the best match. First, complete our online application form. We'll review your application within 48 hours and arrange a home check if suitable..."
                                />
                                <div className="psm-char-count">
                                    {adoptionData.adoptionProcess.length}/1000 characters
                                </div>
                            </div>

                            <div className="psm-form-group">
                                <label>
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                    Adoption Requirements
                                </label>
                                <p className="psm-field-help">
                                    List your adoption requirements, one per line. These will be displayed as a bulleted list.
                                </p>
                                <textarea
                                    name="adoptionRequirements"
                                    value={adoptionData.adoptionRequirements}
                                    onChange={handleAdoptionChange}
                                    rows={8}
                                    placeholder="Secure home and garden&#10;Adults over 21 years&#10;Proof of homeowner permission if renting&#10;Previous pet experience preferred&#10;Ability to cover veterinary costs"
                                />
                                <p className="psm-field-note">
                                    Press Enter after each requirement to create a new line
                                </p>
                            </div>

                            <div className="psm-info-box">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <p>
                                    A clear adoption process builds trust with potential adopters and helps ensure
                                    successful placements. Be transparent about your requirements and procedures.
                                </p>
                            </div>
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