// src/components/EditUserModal.jsx
import React, { useState } from "react";
import "./EditUserModal.css";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const EditUserModal = ({ user, onClose, onUpdated }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
    });
    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [error, setError] = useState(""); // Store error messages

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError("Please fill in all required fields (First Name, Last Name, Email).");
            return;
        }

        setIsLoading(true); // Start loading
        setError(""); // Clear any previous error

        try {
            await updateDoc(doc(db, "users", user.id), formData);
            alert("User updated!");
            onUpdated(); // Refresh user list
            onClose(); // Close the modal
        } catch (err) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit User</h2>

                {/* Display error message */}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                    />
                    <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                    />
                    <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                    />
                    <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone"
                    />
                    <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Address"
                    />
                    <div className="edit-modal-buttons">
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
