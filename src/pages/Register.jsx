import React, { useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

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
    });

    const [errors, setErrors] = useState({});
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
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
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // Geocode the postcode
            let coords;
            try {
                const res = await fetch(
                    `https://api.postcodes.io/postcodes/${encodeURIComponent(formData.postcode)}`
                );
                const payload = await res.json();
                if (payload.status !== 200) throw new Error("Invalid postcode");
                coords = {
                    latitude: payload.result.latitude,
                    longitude: payload.result.longitude,
                };
            } catch {
                alert("Invalid postcode. Please double-check and try again.");
                setIsSubmitting(false);
                return;
            }

            // Write user document including GeoPoint
            try {
                await setDoc(doc(db, "users", user.uid), {
                    firstName: formData.firstName,
                    lastName:  formData.lastName,
                    email:     formData.email,
                    phone:     formData.phone,
                    postcode:  formData.postcode,
                    location:  new GeoPoint(coords.latitude, coords.longitude),
                    address1:  formData.address1,
                    address2:  formData.address2,
                    city:      formData.city,
                    county:    formData.county,
                    createdAt: serverTimestamp(),
                });
            } catch (firestoreError) {
                console.error("❌ Firestore write failed:", firestoreError.message);
                alert("There was an error saving your information. Please try again.");
            }

            await sendEmailVerification(user);
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
            });
            setConfirmationMessage(
                "Registration successful! Please check your email to verify your account before logging in."
            );
            setTimeout(() => {
                navigate("/login");
            }, 5000);

        } catch (err) {
            console.error("🔥 Registration error:", err);
            setErrors({ submit: err.message || "Registration failed. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <Navbar />

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
                                    <label htmlFor="city">City</label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="address1">Address Line 1</label>
                                    <input
                                        id="address1"
                                        type="text"
                                        name="address1"
                                        value={formData.address1}
                                        onChange={handleChange}
                                    />
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
                                    <label htmlFor="county">County</label>
                                    <input
                                        id="county"
                                        type="text"
                                        name="county"
                                        value={formData.county}
                                        onChange={handleChange}
                                    />
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

                        <div className="form-actions">
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? "Registering..." : "Create Account"}
                            </button>
                            <p className="login-link">Already have an account? <a href="/login">Sign in</a></p>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Register;