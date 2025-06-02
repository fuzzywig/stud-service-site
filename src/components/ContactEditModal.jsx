// ContactEditModal.jsx
import React, { useState } from "react";
import "./ContactEditModal.css";

function ContactEditModal({ currentData, onSave, onClose }) {
    const [formData, setFormData] = useState({
        phone: currentData.phone || "",
        address: currentData.address || "",
        city: currentData.city || "",
        county: currentData.county || ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>X</button>
                <h2>Edit Contact Details</h2>
                <form onSubmit={handleSubmit} className="edit-contact-form">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />

                    <label>City</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                    />

                    <label>County</label>
                    <input
                        type="text"
                        name="county"
                        value={formData.county}
                        onChange={handleChange}
                    />

                    <button type="submit" className="save-button">Save Changes</button>
                </form>
            </div>
        </div>
    );
}

export default ContactEditModal;
