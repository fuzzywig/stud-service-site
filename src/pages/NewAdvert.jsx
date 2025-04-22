import React, { useState } from "react";
import "./NewAdvert.css";
import { db, auth, storage } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


// (Keep the same imports as before)

function NewAdvert() {
    const [formData, setFormData] = useState({
        name: "",
        breed: "",
        age: "",
        colour: "",
        description: "",
        fee: "",
        kcRegistered: false,
        healthChecks: Array(10).fill(""),
        images: []
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleHealthCheckChange = (index, value) => {
        const updated = [...formData.healthChecks];
        updated[index] = value;
        setFormData((prev) => ({ ...prev, healthChecks: updated }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name || formData.name.length < 2) newErrors.name = "Name must be at least 2 characters.";
        if (!formData.breed) newErrors.breed = "Please select a breed.";
        if (!formData.age || formData.age < 0) newErrors.age = "Please enter a valid age.";
        if (!formData.description || formData.description.length < 100) newErrors.description = "Description should be at least 100 characters.";
        if (formData.images.length === 0) newErrors.images = "Please upload at least one photo.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadImages = async (images, userId) => {
        const urls = [];
        for (const img of images) {
            const fileRef = ref(storage, `studAds/${userId}/${Date.now()}_${img.file.name}`);
            const snapshot = await uploadBytes(fileRef, img.file);
            const url = await getDownloadURL(snapshot.ref);
            urls.push(url);
        }
        return urls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to post an advert.");
            return;
        }

        try {
            const imageUrls = await uploadImages(formData.images, user.uid);

            await addDoc(collection(db, "studAds"), {
                name: formData.name,
                breed: formData.breed,
                age: formData.age,
                colour: formData.colour,
                description: formData.description,
                fee: formData.fee,
                kcRegistered: formData.kcRegistered,
                healthChecks: formData.healthChecks.filter(h => h.trim() !== ""),
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                approved: false, // 👈 Require admin approval
                images: imageUrls
            });


            setSuccess("✅ Advert submitted successfully!");
            setFormData({
                name: "",
                breed: "",
                age: "",
                colour: "",
                description: "",
                fee: "",
                kcRegistered: false,
                healthChecks: Array(10).fill(""),
                images: []
            });
        } catch (err) {
            console.error("❌ Failed to upload or save advert:", err.message);
            alert("Something went wrong: " + err.message);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.slice(0, 10 - formData.images.length);
        const previews = newImages.map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...previews] }));
    };

    const handleImageRemove = (index) => {
        const updatedImages = [...formData.images];
        URL.revokeObjectURL(updatedImages[index].url);
        updatedImages.splice(index, 1);
        setFormData(prev => ({ ...prev, images: updatedImages }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const newImages = files.slice(0, 10 - formData.images.length);
        const previews = newImages.map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...previews] }));
    };

    return (
        <div className="new-advert-page">
            <h1>Create New Advert</h1>
            {success && <p className="success-message">{success}</p>}
            <form onSubmit={handleSubmit} className="advert-form" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                <div className="form-group">
                    <label>Dog's Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    {errors.name && <small className="error">{errors.name}</small>}
                </div>

                <div className="form-group">
                    <label>Breed</label>
                    <select name="breed" value={formData.breed} onChange={handleChange}>
                        <option value="">-- Select Breed --</option>
                        <option value="Toy Poodle">Toy Poodle</option>
                        <option value="Golden Retriever">Golden Retriever</option>
                        <option value="French Bulldog">French Bulldog</option>
                    </select>
                    {errors.breed && <small className="error">{errors.breed}</small>}
                </div>

                <div className="form-group">
                    <label>Age (years)</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} />
                    {errors.age && <small className="error">{errors.age}</small>}
                </div>

                <div className="form-group">
                    <label>Colour</label>
                    <input type="text" name="colour" value={formData.colour} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Stud Fee (£)</label>
                    <input type="number" name="fee" value={formData.fee} onChange={handleChange} />
                </div>

                <div className="form-group checkbox">
                    <label>
                        <input type="checkbox" name="kcRegistered" checked={formData.kcRegistered} onChange={handleChange} />
                        KC Registered
                    </label>
                </div>

                <div className="form-group">
                    <label>Health Checks (up to 10)</label>
                    {formData.healthChecks.map((check, index) => (
                        <input
                            key={index}
                            type="text"
                            placeholder={`Health Test ${index + 1}`}
                            value={check}
                            onChange={(e) => handleHealthCheckChange(index, e.target.value)}
                        />
                    ))}
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} />
                    {errors.description && <small className="error">{errors.description}</small>}
                </div>

                <div className="form-group image-upload">
                    <label>Upload Photos (max 10)</label>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} />
                    {errors.images && <small className="error">{errors.images}</small>}
                    <div className="preview-grid">
                        {formData.images.map((img, index) => (
                            <div key={index} className="preview-image-wrapper">
                                <img src={img.url} alt={`Preview ${index}`} />
                                <button type="button" className="remove-button" onClick={() => handleImageRemove(index)}>✕</button>
                            </div>
                        ))}
                    </div>
                    <p className="upload-hint">Drag and drop supported</p>
                </div>

                <button type="submit" className="submit-button">Submit Advert</button>
            </form>
        </div>
    );
}

export default NewAdvert;
