import React, { useState } from "react";
import "./Register.css";
import { auth, db } from "../firebase/firebase";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.phone) newErrors.phone = "Phone is required";
        if (!formData.postcode) newErrors.postcode = "Postcode is required";
        if (!formData.password) newErrors.password = "Password is required";
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

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;

            try {
                await setDoc(doc(db, "users", user.uid), {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    postcode: formData.postcode,
                    address1: formData.address1,
                    address2: formData.address2,
                    city: formData.city,
                    county: formData.county,
                    createdAt: serverTimestamp(),
                });
            } catch (firestoreError) {
                console.error("❌ Firestore write failed:", firestoreError.message);
                alert("There was an error saving your information. Please try again.");
            }

            await sendEmailVerification(user);
            console.log("✅ Verification email sent.");

            await signOut(auth);

            // Clear form
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
            alert("Registration failed: " + err.message);
        }
    };

    return (
        <>
            <Navbar />

            <div className="register-page">
                <h2>Register</h2>
                {confirmationMessage && (
                    <p className="confirmation-message">{confirmationMessage}</p>
                )}
                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                        {errors.firstName && <p className="error">{errors.firstName}</p>}
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                        {errors.lastName && <p className="error">{errors.lastName}</p>}
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="error">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        {errors.phone && <p className="error">{errors.phone}</p>}
                    </div>

                    <div className="form-group">
                        <label>Postcode</label>
                        <input
                            type="text"
                            name="postcode"
                            value={formData.postcode}
                            onChange={handleChange}
                        />
                        {errors.postcode && <p className="error">{errors.postcode}</p>}
                    </div>

                    <div className="form-group">
                        <label>Address Line 1</label>
                        <input
                            type="text"
                            name="address1"
                            value={formData.address1}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Address Line 2</label>
                        <input
                            type="text"
                            name="address2"
                            value={formData.address2}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>County</label>
                        <input
                            type="text"
                            name="county"
                            value={formData.county}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <p className="error">{errors.password}</p>}
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && (
                            <p className="error">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button type="submit" className="submit-btn">Register</button>
                </form>
            </div>

            <Footer />
        </>
    );
}

export default Register;
