import React, { useState, useEffect } from "react";
import "./EditContactModal.css";
import { auth } from "../firebase/firebaseAuth";
import { updateEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function EditContactModal({ currentData = {}, onSave, onClose }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address1: "",
        address2: "",
        city: "",
        county: "",
        postcode: ""
    });

    useEffect(() => {
        document.body.classList.add("contactedit-no-scroll");

        // Preload current user data once
        setFormData({
            firstName: currentData.firstName || "",
            lastName: currentData.lastName || "",
            email: currentData.email || "",
            phone: currentData.phone || "",
            address1: currentData.address1 || "",
            address2: currentData.address2 || "",
            city: currentData.city || "",
            county: currentData.county || "",
            postcode: currentData.postcode || ""
        });

        return () => {
            document.body.classList.remove("contactedit-no-scroll");
        };
    }, []); // only runs on first mount

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        document.body.classList.remove("contactedit-no-scroll");

        try {
            // Update email in Firebase Auth if changed
            if (auth.currentUser && formData.email !== auth.currentUser.email) {
                await updateEmail(auth.currentUser, formData.email);
            }

            onSave(formData); // Save all fields
        } catch (error) {
            if (error.code === "auth/requires-recent-login") {
                alert("Please log in again to confirm your identity before changing your email.");
                navigate("/login");
            } else {
                alert("Error updating email: " + error.message);
            }
        }
    };

    const handleClose = () => {
        document.body.classList.remove("contactedit-no-scroll");
        onClose();
    };

    return (
        <div className="contactedit-modal-overlay" onClick={handleClose}>
            <div className="contactedit-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="contactedit-modal-close" onClick={handleClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="contactedit-container">
                    <h2 className="contactedit-title">Edit Contact Details</h2>
                    <form onSubmit={handleSubmit} className="contactedit-form">
                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="firstName"
                                className="contactedit-input"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First Name"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="lastName"
                                className="contactedit-input"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last Name"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="email"
                                name="email"
                                className="contactedit-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="phone"
                                className="contactedit-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="address1"
                                className="contactedit-input"
                                value={formData.address1}
                                onChange={handleChange}
                                placeholder="Address Line 1"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="address2"
                                className="contactedit-input"
                                value={formData.address2}
                                onChange={handleChange}
                                placeholder="Address Line 2 (optional)"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="city"
                                className="contactedit-input"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="City"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="county"
                                className="contactedit-input"
                                value={formData.county}
                                onChange={handleChange}
                                placeholder="County"
                            />
                        </div>

                        <div className="contactedit-form-group">
                            <input
                                type="text"
                                name="postcode"
                                className="contactedit-input"
                                value={formData.postcode}
                                onChange={handleChange}
                                placeholder="Postcode"
                            />
                        </div>

                        <button type="submit" className="contactedit-submit-button">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
