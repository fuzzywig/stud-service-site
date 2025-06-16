// src/components/AdminStaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth, functions } from '../../firebase/firebase'; // Make sure functions is exported
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../firebase/firebaseAuth';
import AdminSidebar from '../../components/AdminSidebar';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Save,
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Shield,
    FileText,
    Image,
    Key,
    Calendar,
    Eye,
    EyeOff,
    AlertTriangle,
    Check
} from 'lucide-react';
import './AdminStaffManagement.css';

export default function AdminStaffManagement() {
    const [adminUsers, setAdminUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '', // Add password field
        confirmPassword: '', // Add confirm password field
        jobTitle: '',
        role: 'moderator',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        contactNumber: '',
        notes: '',
        avatar: '',
        uid: '',
        isActive: true,
        department: '',
        permissions: [],
        company: 'MyPetConnect'
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { userData } = useAuth();

    // Role options
    const roleOptions = [
        { value: 'super-admin', label: 'Super Admin', color: '#dc2626' },
        { value: 'admin', label: 'Admin', color: '#ea580c' },
        { value: 'moderator', label: 'Moderator', color: '#2563eb' },
        { value: 'content-moderator', label: 'Content Moderator', color: '#7c3aed' },
        { value: 'support', label: 'Support Staff', color: '#059669' },
        { value: 'editor', label: 'Editor', color: '#0891b2' },
        { value: 'analyst', label: 'Analyst', color: '#4338ca' }
    ];

    // Department options
    const departmentOptions = [
        'Administration',
        'Moderation',
        'Content Management',
        'Customer Support',
        'Technical',
        'Marketing',
        'Legal & Compliance'
    ];

    // Permission options
    const permissionOptions = [
        'manage_users',
        'approve_content',
        'handle_reports',
        'access_analytics',
        'manage_staff',
        'system_settings',
        'delete_content',
        'ban_users',
        'financial_access'
    ];

    useEffect(() => {
        fetchAdminUsers();
    }, []);

    const fetchAdminUsers = async () => {
        try {
            setLoading(true);
            const adminUsersQuery = query(
                collection(db, 'adminUsers'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(adminUsersQuery);
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAdminUsers(users);
        } catch (error) {
            console.error('Error fetching admin users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = adminUsers.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.uid?.toLowerCase().includes(searchLower) ||
            user.jobTitle?.toLowerCase().includes(searchLower)
        );
    });

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '', // Add password field
            confirmPassword: '', // Add confirm password field
            jobTitle: '',
            role: 'moderator',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            contactNumber: '',
            notes: '',
            avatar: '',
            uid: '',
            isActive: true,
            department: '',
            permissions: [],
            company: 'MyPetConnect'
        });
        setFormErrors({});
        setAvatarFile(null);
        setAvatarPreview('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // Update your openModal function to handle address fields properly
    const openModal = (mode, user = null) => {
        setModalMode(mode);
        setSelectedUser(user);

        if (user) {
            // Handle both individual address fields AND legacy single address field
            let addressData = {};

            if (user.addressLine1 || user.city || user.state || user.postalCode || user.country) {
                // User has individual address fields
                addressData = {
                    addressLine1: user.addressLine1 || '',
                    addressLine2: user.addressLine2 || '',
                    city: user.city || '',
                    state: user.state || '',
                    postalCode: user.postalCode || '',
                    country: user.country || ''
                };
            } else if (user.address) {
                // Legacy single address field - try to parse it
                const addressLines = user.address.split('\n');
                addressData = {
                    addressLine1: addressLines[0] || '',
                    addressLine2: addressLines[1] || '',
                    city: addressLines[2] || '',
                    state: '',
                    postalCode: '',
                    country: ''
                };
            } else {
                // No address data
                addressData = {
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: ''
                };
            }

            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                password: '', // Always empty for existing users
                confirmPassword: '', // Always empty for existing users
                jobTitle: user.jobTitle || '',
                role: user.role || 'moderator',
                ...addressData,
                contactNumber: user.contactNumber || '',
                notes: user.notes || '',
                avatar: user.avatar || '',
                uid: user.uid || '',
                isActive: user.isActive !== false,
                department: user.department || '',
                permissions: user.permissions || [],
                company: user.company || 'MyPetConnect'
            });
            setAvatarPreview(user.avatar || '');
        } else {
            resetForm();
            // Generate a temporary UID for new users
            setFormData(prev => ({
                ...prev,
                uid: 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            }));
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        resetForm();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name, file.type, file.size);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            setAvatarFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target.result;
                console.log('FileReader result:', result ? 'Image loaded successfully' : 'Failed to load image');
                setAvatarPreview(result);
            };
            reader.onerror = (e) => {
                console.error('FileReader error:', e);
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected');
        }
    };

    const uploadAvatar = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    };

    const createStaffAccountViaCloudFunction = async (email, password, staffData) => {
        try {
            console.log('Creating staff account via Cloud Function:', email);

            // Get the Cloud Function
            const createStaffAccount = httpsCallable(functions, 'createStaffAccount');

            // Call the Cloud Function
            const result = await createStaffAccount({
                email: email,
                password: password,
                staffData: staffData
            });

            console.log('Cloud Function result:', result.data);

            return {
                success: true,
                uid: result.data.uid,
                documentId: result.data.documentId,
                message: result.data.message
            };

        } catch (error) {
            console.error('Cloud Function error:', error);

            // Handle Cloud Function errors
            if (error.code === 'functions/already-exists') {
                return {
                    success: false,
                    error: 'An account with this email already exists',
                    code: 'email-exists'
                };
            } else if (error.code === 'functions/invalid-argument') {
                return {
                    success: false,
                    error: error.message,
                    code: 'invalid-argument'
                };
            } else if (error.code === 'functions/permission-denied') {
                return {
                    success: false,
                    error: 'You do not have permission to create staff accounts',
                    code: 'permission-denied'
                };
            } else if (error.code === 'functions/unauthenticated') {
                return {
                    success: false,
                    error: 'You must be logged in to create staff accounts',
                    code: 'unauthenticated'
                };
            }

            return {
                success: false,
                error: `Failed to create staff account: ${error.message}`,
                code: 'unknown'
            };
        }
    };

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push('At least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('At least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('At least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('At least one number');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('At least one special character (!@#$%^&*)');
        }

        return errors;
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation (only required for new users)
        if (modalMode === 'add') {
            if (!formData.password.trim()) {
                errors.password = 'Password is required for new admin users';
            } else {
                const passwordErrors = validatePassword(formData.password);
                if (passwordErrors.length > 0) {
                    errors.password = 'Password must include: ' + passwordErrors.join(', ');
                }
            }

            if (!formData.confirmPassword.trim()) {
                errors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        if (!formData.jobTitle.trim()) errors.jobTitle = 'Job title is required';
        if (!formData.role) errors.role = 'Role is required';
        if (!formData.contactNumber.trim()) errors.contactNumber = 'Contact number is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSaving(true);

            let avatarUrl = formData.avatar;
            let authResult = null;

            // Upload avatar if a new file was selected
            if (avatarFile) {
                setUploadingAvatar(true);
                try {
                    avatarUrl = await uploadAvatar(avatarFile);
                } catch (error) {
                    console.error('Error uploading avatar:', error);
                    alert('Failed to upload avatar. Please try again.');
                    return;
                } finally {
                    setUploadingAvatar(false);
                }
            }

            // For new admin users, create via Cloud Function
            if (modalMode === 'add') {
                // Prepare staff data for Cloud Function
                const staffData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    jobTitle: formData.jobTitle,
                    role: formData.role,
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.postalCode,
                    country: formData.country,
                    contactNumber: formData.contactNumber,
                    notes: formData.notes,
                    avatar: avatarUrl,
                    isActive: formData.isActive,
                    department: formData.department,
                    permissions: formData.permissions,
                    company: formData.company
                };

                console.log('Creating staff account via Cloud Function...');
                authResult = await createStaffAccountViaCloudFunction(formData.email, formData.password, staffData);

                if (!authResult.success) {
                    // Show different messages based on the error type
                    if (authResult.code === 'email-exists') {
                        const shouldContinue = window.confirm(
                            `⚠️ Email Already Exists\n\n` +
                            `The email "${formData.email}" already has a Firebase Auth account.\n\n` +
                            `Options:\n` +
                            `1. Use a different email address\n` +
                            `2. Contact system admin to manage existing account\n\n` +
                            `Would you like to try with a different email address?\n\n` +
                            `Click OK to change email, or Cancel to abort.`
                        );

                        if (shouldContinue) {
                            // Focus back to email field for user to change it
                            const emailInput = document.querySelector('input[name="email"]');
                            if (emailInput) {
                                emailInput.focus();
                                emailInput.select();
                            }
                            return; // Don't close modal, let user fix the email
                        } else {
                            closeModal(); // User chose to cancel
                            return;
                        }
                    } else {
                        // For other errors, show the error message
                        alert(`❌ Failed to create staff account:\n\n${authResult.error}`);
                        return;
                    }
                }

                // Success! The Cloud Function handled everything
                alert(`✅ Staff Account Created Successfully!\n\n👤 New Staff Member:\nName: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nRole: ${getRoleLabel(formData.role)}\nUID: ${authResult.uid}\n\n📧 Login Credentials:\nEmail: ${formData.email}\nPassword: [as provided]\n\n⚠️ Important:\n1. Share these credentials securely with the new staff member\n2. Recommend they change their password on first login\n3. Your admin session remains intact!\n\n✅ The staff member can now log in and access their assigned permissions.`);

                // Refresh the admin users list
                await fetchAdminUsers();
                closeModal();
                return;

            } else if (modalMode === 'edit') {
                // For editing existing users, still use direct Firestore update
                const adminUserData = {
                    ...formData,
                    avatar: avatarUrl,
                    updatedAt: new Date(),
                    updatedBy: userData?.uid || 'system'
                };

                // Remove password and confirmPassword from stored data
                delete adminUserData.password;
                delete adminUserData.confirmPassword;

                await updateDoc(doc(db, 'adminUsers', selectedUser.id), adminUserData);
                alert('✅ Admin account updated successfully!');

                await fetchAdminUsers();
                closeModal();
            }

        } catch (error) {
            console.error('Error saving admin user:', error);
            alert('Failed to save admin user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await deleteDoc(doc(db, 'adminUsers', userToDelete.id));
            await fetchAdminUsers();
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting admin user:', error);
        }
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePermissionChange = (permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const getRoleColor = (role) => {
        const roleOption = roleOptions.find(option => option.value === role);
        return roleOption ? roleOption.color : '#6b7280';
    };

    const getRoleLabel = (role) => {
        const roleOption = roleOptions.find(option => option.value === role);
        return roleOption ? roleOption.label : role;
    };

    return (
        <div className="staff-management-layout">
            <AdminSidebar />

            <div className="staff-management-main">
                <div className="staff-management-header">

                    <div className="staff-management-title-section">
                        <h1 className="staff-management-title">Admin Staff Management</h1>
                        <p className="staff-management-subtitle">
                            Manage administrators and moderators

                        </p>
                    </div>

                    <button
                        onClick={() => openModal('add')}
                        className="staff-management-add-btn"
                    >
                        <Plus size={20} />
                        Add New Staff
                    </button>
                </div>

                <div className="staff-management-controls">
                    <div className="staff-management-search">
                        <Search className="staff-management-search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or UID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="staff-management-search-input"
                        />
                    </div>

                    <div className="staff-management-stats">
                        <span className="staff-management-count">
                            {filteredUsers.length} of {adminUsers.length} staff members
                        </span>
                    </div>
                </div>

                <div className="staff-management-content">
                    {loading ? (
                        <div className="staff-management-loading">
                            <div className="staff-management-spinner"></div>
                            <p>Loading staff members...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="staff-management-empty">
                            <User size={48} className="staff-management-empty-icon" />
                            <h3>No staff members found</h3>
                            <p>
                                {searchTerm
                                    ? 'No staff members match your search criteria.'
                                    : 'Get started by adding your first admin or moderator.'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => openModal('add')}
                                    className="staff-management-empty-btn"
                                >
                                    <Plus size={20} />
                                    Add First Staff Member
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="staff-management-grid">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="staff-management-card">
                                    <div className="staff-management-card-header">
                                        <div className="staff-management-avatar">
                                            <img
                                                src={user.avatar || "https://placehold.co/64x64?text=" + (user.firstName?.[0] || 'U')}
                                                alt={`${user.firstName} ${user.lastName}`}
                                                onError={(e) => {
                                                    if (e.target) {
                                                        e.target.src = "https://placehold.co/64x64?text=" + (user.firstName?.[0] || 'U');
                                                    }
                                                }}
                                            />
                                            <div className={`staff-management-status ${user.isActive ? 'active' : 'inactive'}`}></div>
                                        </div>

                                        <div className="staff-management-card-actions">
                                            <button
                                                onClick={() => openModal('view', user)}
                                                className="staff-management-action-btn view"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openModal('edit', user)}
                                                className="staff-management-action-btn edit"
                                                title="Edit User"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="staff-management-action-btn delete"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="staff-management-card-body">
                                        <h3 className="staff-management-card-name">
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        <p className="staff-management-card-job">{user.jobTitle}</p>

                                        <div className="staff-management-card-role">
                                            <span
                                                className="staff-management-role-badge"
                                                style={{ backgroundColor: getRoleColor(user.role) }}
                                            >
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </div>

                                        <div className="staff-management-card-info">
                                            <div className="staff-management-info-item">
                                                <Mail size={14} />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.department && (
                                                <div className="staff-management-info-item">
                                                    <Briefcase size={14} />
                                                    <span>{user.department}</span>
                                                </div>
                                            )}
                                            <div className="staff-management-info-item">
                                                <Key size={14} />
                                                <span className="staff-management-uid">{user.uid}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="staff-management-modal-overlay" onClick={closeModal}>
                    <div className="staff-management-modal" data-mode={modalMode} onClick={(e) => e.stopPropagation()}>
                        <div className="staff-management-modal-header">
                            <h2 className="staff-management-modal-title">
                                {modalMode === 'add' && 'Add New Staff Member'}
                                {modalMode === 'edit' && 'Edit Staff Member'}
                                {modalMode === 'view' && 'Staff Member Details'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="staff-management-modal-close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="staff-management-modal-body">
                            <div className="staff-management-form-grid">
                                {/* Basic Information */}
                                <div className="staff-management-form-section">
                                    <h3 className="staff-management-section-title">
                                        <User size={18} />
                                        Basic Information
                                    </h3>

                                    {/* Name Fields */}
                                    <div className="staff-management-form-row">
                                        <div className="staff-management-form-group">
                                            <label>First Name *</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter first name"
                                                className={`staff-management-input ${formErrors.firstName ? 'staff-management-input-error' : ''}`}
                                            />
                                            {formErrors.firstName && (
                                                <span className="staff-management-error">{formErrors.firstName}</span>
                                            )}
                                        </div>

                                        <div className="staff-management-form-group">
                                            <label>Last Name *</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter last name"
                                                className={`staff-management-input ${formErrors.lastName ? 'staff-management-input-error' : ''}`}
                                            />
                                            {formErrors.lastName && (
                                                <span className="staff-management-error">{formErrors.lastName}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="staff-management-form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter email address"
                                            className={`staff-management-input ${formErrors.email ? 'staff-management-input-error' : ''}`}
                                        />
                                        {formErrors.email && (
                                            <span className="staff-management-error">{formErrors.email}</span>
                                        )}
                                    </div>

                                    {/* Password Fields - Only show for new users */}
                                    {modalMode === 'add' && (
                                        <>
                                            <div className="staff-management-form-group">
                                                <label>Password *</label>
                                                <div className="staff-management-password-input-container">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter secure password"
                                                        className={`staff-management-input ${formErrors.password ? 'staff-management-input-error' : ''}`}
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="staff-management-password-toggle"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {formErrors.password && (
                                                    <span className="staff-management-error">{formErrors.password}</span>
                                                )}
                                                <div className="staff-management-password-requirements">
                                                    <div className="staff-management-password-requirements-box">
                                                        <div className="staff-management-password-requirements-header">
                                                            <Shield size={14} />
                                                            <span>Password Requirements</span>
                                                        </div>
                                                        <ul className="staff-management-password-checklist">
                                                            <li className={formData.password.length >= 8 ? 'valid' : ''}>
                                                                <Check size={12} />
                                                                At least 8 characters
                                                            </li>
                                                            <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                                                                <Check size={12} />
                                                                One uppercase letter
                                                            </li>
                                                            <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                                                                <Check size={12} />
                                                                One lowercase letter
                                                            </li>
                                                            <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                                                                <Check size={12} />
                                                                One number
                                                            </li>
                                                            <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'valid' : ''}>
                                                                <Check size={12} />
                                                                One special character (!@#$%^&*)
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="staff-management-form-group">
                                                <label>Confirm Password *</label>
                                                <div className="staff-management-password-input-container">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        placeholder="Confirm your password"
                                                        className={`staff-management-input ${formErrors.confirmPassword ? 'staff-management-input-error' : ''}`}
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="staff-management-password-toggle"
                                                        tabIndex={-1}
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {formErrors.confirmPassword && (
                                                    <span className="staff-management-error">{formErrors.confirmPassword}</span>
                                                )}
                                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                                    <span className="staff-management-success">
                                                        <Check size={14} />
                                                        Passwords match
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Contact Number */}
                                    <div className="staff-management-form-group">
                                        <label>Contact Number *</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter phone number"
                                            className={`staff-management-input ${formErrors.contactNumber ? 'staff-management-input-error' : ''}`}
                                        />
                                        {formErrors.contactNumber && (
                                            <span className="staff-management-error">{formErrors.contactNumber}</span>
                                        )}
                                    </div>

                                    {/* Job Title and Department */}
                                    <div className="staff-management-form-row">
                                        <div className="staff-management-form-group">
                                            <label>Job Title *</label>
                                            <input
                                                type="text"
                                                name="jobTitle"
                                                value={formData.jobTitle}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter job title"
                                                className={`staff-management-input ${formErrors.jobTitle ? 'staff-management-input-error' : ''}`}
                                            />
                                            {formErrors.jobTitle && (
                                                <span className="staff-management-error">{formErrors.jobTitle}</span>
                                            )}
                                        </div>

                                        <div className="staff-management-form-group">
                                            <label>Department</label>
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="staff-management-select"
                                            >
                                                <option value="">Select Department</option>
                                                {departmentOptions.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Company */}
                                    <div className="staff-management-form-group">
                                        <label>Company</label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            disabled={true}
                                            className="staff-management-input staff-management-input-readonly"
                                            title="Company is automatically set to MyPetConnect"
                                        />
                                    </div>

                                    {/* Address Section */}
                                    <div className="staff-management-form-group">
                                        <label>Address Line 1</label>
                                        <input
                                            type="text"
                                            name="addressLine1"
                                            value={formData.addressLine1}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Street address, P.O. box, company name"
                                            className="staff-management-input"
                                        />
                                    </div>

                                    <div className="staff-management-form-group">
                                        <label>Address Line 2 <span className="staff-management-optional">(Optional)</span></label>
                                        <input
                                            type="text"
                                            name="addressLine2"
                                            value={formData.addressLine2}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                            className="staff-management-input"
                                        />
                                    </div>

                                    <div className="staff-management-form-row">
                                        <div className="staff-management-form-group">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="City"
                                                className="staff-management-input"
                                            />
                                        </div>

                                        <div className="staff-management-form-group">
                                            <label>State/Province</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="State or Province"
                                                className="staff-management-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-management-form-row">
                                        <div className="staff-management-form-group">
                                            <label>Postal Code</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="ZIP or Postal Code"
                                                className="staff-management-input"
                                            />
                                        </div>

                                        <div className="staff-management-form-group">
                                            <label>Country</label>
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="staff-management-select"
                                            >
                                                <option value="">Select Country</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="United States">United States</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Australia">Australia</option>
                                                <option value="Germany">Germany</option>
                                                <option value="France">France</option>
                                                <option value="Spain">Spain</option>
                                                <option value="Italy">Italy</option>
                                                <option value="Netherlands">Netherlands</option>
                                                <option value="Belgium">Belgium</option>
                                                <option value="Switzerland">Switzerland</option>
                                                <option value="Austria">Austria</option>
                                                <option value="Ireland">Ireland</option>
                                                <option value="Sweden">Sweden</option>
                                                <option value="Norway">Norway</option>
                                                <option value="Denmark">Denmark</option>
                                                <option value="Finland">Finland</option>
                                                <option value="Poland">Poland</option>
                                                <option value="Czech Republic">Czech Republic</option>
                                                <option value="Portugal">Portugal</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Role & Permissions */}
                                <div className="staff-management-form-section">
                                    <h3 className="staff-management-section-title">
                                        <Shield size={18} />
                                        Role & Permissions
                                    </h3>

                                    <div className="staff-management-form-group">
                                        <label>Role *</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            className={`staff-management-select ${formErrors.role ? 'staff-management-select-error' : ''}`}
                                        >
                                            {roleOptions.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.role && (
                                            <span className="staff-management-error">{formErrors.role}</span>
                                        )}
                                    </div>

                                    <div className="staff-management-form-group">
                                        <label>Permissions</label>
                                        <div className="staff-management-permissions-grid">
                                            {permissionOptions.map(permission => (
                                                <label key={permission} className="staff-management-permission-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(permission)}
                                                        onChange={() => handlePermissionChange(permission)}
                                                        disabled={modalMode === 'view'}
                                                    />
                                                    <span>{permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="staff-management-status-section">
                                        <h4 className="staff-management-status-title">Account Status</h4>
                                        <label className="staff-management-status-checkbox">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="staff-management-checkbox"
                                            />
                                            <span className="staff-management-checkbox-label">
                                                <span className="staff-management-checkbox-text">Active User</span>
                                                <span className="staff-management-checkbox-description">
                                                    {formData.isActive ? 'User can access the system' : 'User access is disabled'}
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Avatar Upload Section */}
                                <div className="staff-management-form-section">
                                    <h3 className="staff-management-section-title">
                                        <Image size={18} />
                                        Profile Picture
                                    </h3>

                                    <div className={`staff-management-avatar-upload ${avatarPreview ? 'has-image' : ''} ${uploadingAvatar ? 'uploading' : ''}`}>
                                        {uploadingAvatar && (
                                            <div className="staff-management-upload-progress">
                                                <div className="staff-management-upload-spinner"></div>
                                                <span className="staff-management-upload-text">Uploading image...</span>
                                            </div>
                                        )}

                                        <div className="staff-management-avatar-main">
                                            <div className={`staff-management-avatar-preview ${avatarPreview ? 'has-image' : ''}`}>
                                                {avatarPreview ? (
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar preview"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="staff-management-avatar-placeholder">
                                                        <User size={24} />
                                                        <span>No Image</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="staff-management-avatar-info">
                                                <h4 className="staff-management-avatar-title">
                                                    {avatarPreview ? 'Profile Picture' : 'Upload Profile Picture'}
                                                </h4>
                                                <p className="staff-management-avatar-description">
                                                    {avatarPreview
                                                        ? 'This image will be displayed as the staff member\'s profile picture across the platform.'
                                                        : 'Choose a professional photo that represents this staff member. The image will be cropped to a circle.'
                                                    }
                                                </p>

                                                {modalMode !== 'view' && (
                                                    <div className="staff-management-avatar-controls">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleAvatarChange}
                                                            className="staff-management-file-input"
                                                            id="avatar-upload"
                                                            disabled={uploadingAvatar}
                                                        />
                                                        <label
                                                            htmlFor="avatar-upload"
                                                            className="staff-management-upload-btn"
                                                        >
                                                            <Image size={16} />
                                                            {avatarPreview ? 'Change Image' : 'Choose Image'}
                                                        </label>

                                                        {avatarPreview && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAvatarFile(null);
                                                                    setAvatarPreview('');
                                                                    setFormData(prev => ({ ...prev, avatar: '' }));
                                                                }}
                                                                className="staff-management-remove-btn"
                                                                disabled={uploadingAvatar}
                                                            >
                                                                <X size={16} />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="staff-management-avatar-specs">
                                            <h5 className="staff-management-avatar-specs-title">Image Requirements</h5>
                                            <ul className="staff-management-avatar-specs-list">
                                                <li className="staff-management-avatar-specs-item">
                                                    <Check size={12} />
                                                    JPG, PNG, or GIF format
                                                </li>
                                                <li className="staff-management-avatar-specs-item">
                                                    <Check size={12} />
                                                    Maximum size: 5MB
                                                </li>
                                                <li className="staff-management-avatar-specs-item">
                                                    <Check size={12} />
                                                    Recommended: 400×400px
                                                </li>
                                                <li className="staff-management-avatar-specs-item">
                                                    <Check size={12} />
                                                    Square aspect ratio works best
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="staff-management-form-section">
                                    <h3 className="staff-management-section-title">
                                        <FileText size={18} />
                                        Additional Information
                                    </h3>

                                    <div className="staff-management-form-group">
                                        <label>Notes <span className="staff-management-optional">(Optional)</span></label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Any additional notes about this staff member..."
                                            className="staff-management-textarea"
                                            rows="4"
                                        />
                                    </div>
                                </div>
                            </div>

                            {modalMode !== 'view' && (
                                <div className="staff-management-modal-footer">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="staff-management-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || uploadingAvatar}
                                        className="staff-management-btn-primary"
                                    >
                                        {saving || uploadingAvatar ? (
                                            <>
                                                <div className="staff-management-btn-spinner"></div>
                                                {uploadingAvatar ? 'Uploading...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                {modalMode === 'add' ? 'Add Staff Member' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="staff-management-modal-overlay">
                    <div className="staff-management-confirm-modal">
                        <div className="staff-management-confirm-header">
                            <AlertTriangle size={24} className="staff-management-confirm-icon" />
                            <h3>Confirm Deletion</h3>
                        </div>
                        <div className="staff-management-confirm-body">
                            <p>
                                Are you sure you want to delete <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
                            </p>
                            <p className="staff-management-confirm-warning">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="staff-management-confirm-footer">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="staff-management-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="staff-management-btn-danger"
                            >
                                <Trash2 size={18} />
                                Delete Staff Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}