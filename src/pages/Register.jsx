import React, { useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import {
    query,
    where,
    getDocs,
    collection,
    doc,
    setDoc,
    serverTimestamp,
    GeoPoint
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Register.css";
import { useLoginModal } from "../context/LoginContext";


const sendWelcomeEmail = async (userData) => {
    try {
        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData }),
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Welcome email sent successfully');
        } else {
            console.error('❌ Failed to send welcome email:', result.error);
        }
    } catch (err) {
        console.error('❌ Failed to send welcome email:', err);
    }
};


function Register() {
    const navigate = useNavigate();
    const { openLogin } = useLoginModal(); // Add this line

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        postcode: "",
        address1: "",
        address2: "",
        city: "",
        county: "",
        password: "",
        confirmPassword: "",
        showContactInfo: false,
        breederType: "",
        licenceNumber: "",
        localAuthority: "",
        organizationName: "",
        charityNumber: "",
        websiteUrl: "",
        allowNotifications: true, // Added essential notifications field (default to true)
        marketingOptIn: false, // Marketing opt-in field
    });



    const [errors, setErrors] = useState({});
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "" });

    const calculatePasswordStrength = (password) => {
        let score = 0;
        let text = "";

        if (!password) {
            return { score: 0, text: "" };
        }

        // Length check
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Character variety checks
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Determine strength text and color
        if (score <= 2) {
            text = "Weak";
        } else if (score <= 4) {
            text = "Medium";
        } else {
            text = "Strong";
        }

        return { score, text };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Calculate password strength when password changes
        if (name === "password") {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        // Clear license fields if breeder type is changed from licensed
        if (name === "breederType" && value !== "licensed") {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                licenceNumber: "",
                localAuthority: ""
            }));
            // Clear any errors for these fields
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.licenceNumber;
                delete newErrors.localAuthority;
                return newErrors;
            });
        }

        // Clear rescue fields if breeder type is changed from rescue
        if (name === "breederType" && value !== "rescue") {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                organizationName: "",
                charityNumber: "",
                websiteUrl: ""
            }));
            // Clear any errors for these fields
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.organizationName;
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
        if (!formData.phone) newErrors.phone = "Phone is required";
        if (!formData.postcode) newErrors.postcode = "Postcode is required";
        if (!formData.address1) newErrors.address1 = "Address is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.county) newErrors.county = "County is required";
        if (!formData.breederType) newErrors.breederType = "Account type is required";

        // Validate license fields if breeder type is licensed
        if (formData.breederType === "licensed") {
            if (!formData.licenceNumber) newErrors.licenceNumber = "Licence number is required for licensed breeders";
            if (!formData.localAuthority) newErrors.localAuthority = "Local authority is required for licensed breeders";
        }

        // Validate rescue fields if type is rescue
        if (formData.breederType === "rescue") {
            if (!formData.organizationName) newErrors.organizationName = "Organization name is required for rescue organizations";
        }

        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords must match";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Create the composite key BEFORE creating the user
            const normalisedPhone = formData.phone.replace(/\s+/g, "").trim();
            const normalisedAddress = (formData.address1 + " " + formData.postcode).toLowerCase().trim();
            const compositeKey = `${normalisedPhone}|${normalisedAddress}`;

            // Check for duplicates BEFORE creating the auth user
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("compositeKey", "==", compositeKey));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    setErrors({ submit: "An account with this phone number and address already exists." });
                    setIsSubmitting(false);
                    return;
                }
            } catch (queryError) {
                console.error("Error checking for duplicates:", queryError);
                // Continue with registration even if duplicate check fails
                // You might want to handle this differently based on your requirements
            }

            // Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // Geocode the postcode
            let coords = { latitude: 0, longitude: 0 }; // Default coordinates
            try {
                const res = await fetch(
                    `https://api.postcodes.io/postcodes/${encodeURIComponent(formData.postcode)}`
                );
                const payload = await res.json();
                if (payload.status === 200 && payload.result) {
                    coords = {
                        latitude: payload.result.latitude,
                        longitude: payload.result.longitude,
                    };
                }
            } catch (geocodeError) {
                console.error("Geocoding error:", geocodeError);
                // Continue with default coordinates
            }

            // Prepare user data
            const userData = {
                uid: user.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                postcode: formData.postcode,
                location: new GeoPoint(coords.latitude, coords.longitude),
                address1: formData.address1,
                address2: formData.address2 || "",
                city: formData.city || "",
                county: formData.county || "",
                breederType: formData.breederType,
                showPhoneOnAdverts: formData.showContactInfo || false,
                showEmailOnProfile: formData.showContactInfo || false,
                allowNotifications: formData.allowNotifications !== false, // Added essential notifications to user data
                marketingOptIn: formData.marketingOptIn || false, // Marketing opt-in to user data
                createdAt: serverTimestamp(),
                compositeKey: compositeKey,
                isActive: true,
                emailVerified: false
            };

            // Add license fields if breeder type is licensed
            if (formData.breederType === "licensed") {
                userData.licenceNumber = formData.licenceNumber;
                userData.localAuthority = formData.localAuthority;
            }

            // Add rescue fields if type is rescue
            if (formData.breederType === "rescue") {
                userData.organizationName = formData.organizationName;
                userData.charityNumber = formData.charityNumber || "";
                userData.websiteUrl = formData.websiteUrl || "";
            }

            // Write user document
            try {
                await setDoc(doc(db, "users", user.uid), userData);

                // Send welcome email after successful user creation
                // Send welcome email after successful user creation
                try {
                    await sendWelcomeEmail({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        accountType: formData.breederType,
                        breederType: formData.breederType,
                        licenceNumber: formData.licenceNumber || null,
                        organizationName: formData.organizationName || null,
                        allowNotifications: formData.allowNotifications !== false, // Include essential notifications in welcome email data
                        marketingOptIn: formData.marketingOptIn || false // Include marketing opt-in in welcome email data
                    });
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError);
                    // Don't block registration if email fails
                }

            } catch (firestoreError) {
                console.error("❌ Firestore write failed:", firestoreError);
                // Delete the auth user if Firestore write fails
                try {
                    await user.delete();
                } catch (deleteError) {
                    console.error("Failed to delete auth user after Firestore error:", deleteError);
                }
                throw new Error("Failed to save user information. Please try again.");
            }

            // Send verification email
            try {
                await sendEmailVerification(user);
            } catch (emailError) {
                console.error("Failed to send verification email:", emailError);
                // Don't throw here, user is created successfully
            }

            // Sign out the user (force them to verify email first)
            await signOut(auth);

            // Clear form and show confirmation
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                postcode: "",
                address1: "",
                address2: "",
                city: "",
                county: "",
                password: "",
                confirmPassword: "",
                showContactInfo: false,
                breederType: "",
                licenceNumber: "",
                localAuthority: "",
                organizationName: "",
                charityNumber: "",
                websiteUrl: "",
                allowNotifications: true, // Reset essential notifications to default
                marketingOptIn: false, // Reset marketing opt-in
            });

            setConfirmationMessage(
                "Registration successful! Please check your email to verify your account. Redirecting to homepage..."
            );

            // Redirect to homepage after 3 seconds
            setTimeout(() => {
                navigate("/");
            }, 3000);

        } catch (err) {
            console.error("🔥 Registration error:", err);

            // Provide user-friendly error messages
            let errorMessage = "Registration failed. Please try again.";

            if (err.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered. Please use a different email or try logging in.";
            } else if (err.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please use a stronger password.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address. Please check and try again.";
            } else if (err.message) {
                errorMessage = err.message;
            }

            setErrors({ submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Navbar onLoginClick={openLogin} />

            <div className="register-page">
                <div className="register-container">
                    <div className="register-header">
                        <h2>Create an Account</h2>
                        <p className="register-subtitle">Join us today and get access to all our services</p>
                    </div>

                    {confirmationMessage && (
                        <div className="register-confirmation">
                            <div className="confirmation-icon">✓</div>
                            <p className="confirmation-message">{confirmationMessage}</p>
                        </div>
                    )}

                    {errors.submit && (
                        <div className="register-error-banner">
                            <p>{errors.submit}</p>
                        </div>
                    )}

                    <form className="register-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3 className="section-title">Personal Information</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name<span className="required">*</span></label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={errors.firstName ? "input-error" : ""}
                                    />
                                    {errors.firstName && <p className="error">{errors.firstName}</p>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name<span className="required">*</span></label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={errors.lastName ? "input-error" : ""}
                                    />
                                    {errors.lastName && <p className="error">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email<span className="required">*</span></label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? "input-error" : ""}
                                    />
                                    {errors.email && <p className="error">{errors.email}</p>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone<span className="required">*</span></label>
                                    <input
                                        id="phone"
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={errors.phone ? "input-error" : ""}
                                    />
                                    {errors.phone && <p className="error">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="breederType">Account Type<span className="required">*</span></label>
                                    <select
                                        id="breederType"
                                        name="breederType"
                                        value={formData.breederType}
                                        onChange={handleChange}
                                        className={`form-select ${errors.breederType ? "input-error" : ""}`}
                                    >
                                        <option value="">Select account type</option>
                                        <option value="hobby">Hobby Breeder</option>
                                        <option value="licensed">Licensed Breeder</option>
                                        <option value="rescue">Rescue Organization</option>
                                    </select>
                                    {errors.breederType && <p className="error">{errors.breederType}</p>}
                                    <div className="breeder-type-info">
                                        {formData.breederType === "licensed" && (
                                            <p className="info-text">
                                                <strong>Licensed Breeders:</strong> Registered with their local authority (a legal requirement in the UK if they breed 3+ litters per year or run breeding as a business). Must meet welfare standards and may be inspected regularly.
                                            </p>
                                        )}
                                        {formData.breederType === "hobby" && (
                                            <p className="info-text">
                                                <strong>Hobby Breeders:</strong> Typically breed infrequently (1–2 litters per year). Often own dogs as pets and focus on improving the breed. May not be licensed if under the threshold but still operate ethically.
                                            </p>
                                        )}
                                        {formData.breederType === "rescue" && (
                                            <p className="info-text">
                                                <strong>Rescue Organizations:</strong> Non-profit organizations dedicated to rescuing, rehabilitating, and rehoming animals in need. May be registered charities or volunteer-run groups.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* License fields - only show if breeder type is licensed */}
                            {formData.breederType === "licensed" && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="licenceNumber">Licence Number<span className="required">*</span></label>
                                        <input
                                            id="licenceNumber"
                                            type="text"
                                            name="licenceNumber"
                                            value={formData.licenceNumber}
                                            onChange={handleChange}
                                            className={errors.licenceNumber ? "input-error" : ""}
                                            placeholder="Enter your breeding licence number"
                                        />
                                        {errors.licenceNumber && <p className="error">{errors.licenceNumber}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="localAuthority">Local Authority<span className="required">*</span></label>
                                        <input
                                            id="localAuthority"
                                            type="text"
                                            name="localAuthority"
                                            value={formData.localAuthority}
                                            onChange={handleChange}
                                            className={errors.localAuthority ? "input-error" : ""}
                                            placeholder="e.g. Westminster City Council"
                                        />
                                        {errors.localAuthority && <p className="error">{errors.localAuthority}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Rescue fields - only show if account type is rescue */}
                            {formData.breederType === "rescue" && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group full-width">
                                            <label htmlFor="organizationName">
                                                Organization Name<span className="required">*</span>
                                            </label>
                                            <input
                                                id="organizationName"
                                                type="text"
                                                name="organizationName"
                                                value={formData.organizationName}
                                                onChange={handleChange}
                                                className={errors.organizationName ? "input-error" : ""}
                                                placeholder="e.g. Happy Paws Rescue"
                                            />
                                            {errors.organizationName && <p className="error">{errors.organizationName}</p>}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="charityNumber">Charity Registration Number</label>
                                            <input
                                                id="charityNumber"
                                                type="text"
                                                name="charityNumber"
                                                value={formData.charityNumber}
                                                onChange={handleChange}
                                                placeholder="If registered charity"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="websiteUrl">Website or Social Media</label>
                                            <input
                                                id="websiteUrl"
                                                type="url"
                                                name="websiteUrl"
                                                value={formData.websiteUrl}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Address Information</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="postcode">Postcode<span className="required">*</span></label>
                                    <input
                                        id="postcode"
                                        type="text"
                                        name="postcode"
                                        value={formData.postcode}
                                        onChange={handleChange}
                                        className={errors.postcode ? "input-error" : ""}
                                    />
                                    {errors.postcode && <p className="error">{errors.postcode}</p>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="city">City<span className="required">*</span></label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className={errors.city ? "input-error" : ""}
                                    />
                                    {errors.city && <p className="error">{errors.city}</p>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="address1">Address Line 1<span className="required">*</span></label>
                                    <input
                                        id="address1"
                                        type="text"
                                        name="address1"
                                        value={formData.address1}
                                        onChange={handleChange}
                                        className={errors.address1 ? "input-error" : ""}
                                    />
                                    {errors.address1 && <p className="error">{errors.address1}</p>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="address2">Address Line 2</label>
                                    <input
                                        id="address2"
                                        type="text"
                                        name="address2"
                                        value={formData.address2}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="county">County<span className="required">*</span></label>
                                    <input
                                        id="county"
                                        type="text"
                                        name="county"
                                        value={formData.county}
                                        onChange={handleChange}
                                        className={errors.county ? "input-error" : ""}
                                    />
                                    {errors.county && <p className="error">{errors.county}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Account Security</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password<span className="required">*</span></label>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={errors.password ? "input-error" : ""}
                                    />
                                    {errors.password && <p className="error">{errors.password}</p>}
                                    {formData.password && (
                                        <div className="password-strength">
                                            <div className="password-strength-label">
                                                <span>Password strength:</span>
                                                <span className={`password-strength-text strength-${passwordStrength.text.toLowerCase()}`}>
                                                    {passwordStrength.text}
                                                </span>
                                            </div>
                                            <div className="password-strength-bars">
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 1 ? `active strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                                                />
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 2 ? `active strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                                                />
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 3 ? `active strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                                                />
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 4 ? `active strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                                                />
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 5 ? `active strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                                                />
                                                <div
                                                    className={`password-strength-segment ${passwordStrength.score >= 6 ? `active strength-strong` : ''}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {formData.password && (
                                        <p className="password-tips">
                                            Tips: Use 8+ characters, mix uppercase & lowercase, add numbers & symbols
                                        </p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={errors.confirmPassword ? "input-error" : ""}
                                    />
                                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Privacy Settings <span className="optional-text">(Optional)</span></h3>

                            <div className="privacy-settings">
                                <label className="checkbox-field-prominent">
                                    <input
                                        type="checkbox"
                                        checked={formData.showContactInfo || false}
                                        onChange={e => setFormData({ ...formData, showContactInfo: e.target.checked })}
                                    />
                                    <div className="checkbox-content">
                                        <span className="checkbox-label">Make my contact information public</span>
                                        <span className="checkbox-description">
                                            Your email address and phone number will be visible on your profile and adverts.
                                            Other users will be able to contact you directly. You can change this anytime in your profile settings.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Communication Preferences <span className="optional-text">(Optional)</span></h3>

                            <div className="privacy-settings">
                                <div className="notification-option">
                                    <label className="checkbox-field-prominent">
                                        <input
                                            type="checkbox"
                                            checked={formData.allowNotifications !== false}
                                            onChange={e => setFormData({ ...formData, allowNotifications: e.target.checked })}
                                        />
                                        <div className="checkbox-content">
                                            <span className="checkbox-label">Allow email and SMS notifications</span>
                                            <span className="checkbox-description">
                                                Receive notifications about messages, reviews, inquiries, and important account updates.
                                                You can change this preference at any time.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div className="notification-option">
                                    <label className="checkbox-field-prominent">
                                        <input
                                            type="checkbox"
                                            checked={formData.marketingOptIn || false}
                                            onChange={e => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                                        />
                                        <div className="checkbox-content">
                                            <span className="checkbox-label">Keep me updated with news and offers from MyPetConnect</span>
                                            <span className="checkbox-description">
                                                Receive occasional emails about new features, tips for pet care, breeding advice, and special offers.
                                                We respect your privacy and you can unsubscribe at any time.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? "Registering..." : "Create Account"}
                            </button>
                            <p className="login-link">
                                Already have an account?
                                <button
                                    type="button"
                                    className="login-modal-link"
                                    onClick={openLogin}
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Register;