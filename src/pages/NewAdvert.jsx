// src/pages/NewAdvert.jsx
import React, { useState } from "react";
import "./NewAdvert.css";
import { db, auth, storage } from "../firebase/firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Select from "react-select";
import { breedOptions } from "../components/breedOptions";
import colourOptions from "../components/colourOptions";
function NewAdvert() {
    const [formData, setFormData] = useState({
        title: "",
        name: "",
        breed: "",
        age: "",
        colour: "",
        otherColour: "",
        fee: "",
        height: "",
        weight: "",
        fleaWormed: false,
        vacsUpToDate: false,
        kcRegistered: false,
        kcName: "",
        healthTested: false,
        proven: false,
        healthChecks: Array(10).fill(""),
        facebookUrl: "",
        instagramUrl: "",
        description: "",
        images: [],
        mainImageIndex: 0,
        matings: ""
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleHealthCheckChange = (idx, value) => {
        const updated = [...formData.healthChecks];
        updated[idx] = value;
        setFormData(prev => ({ ...prev, healthChecks: updated }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title) newErrors.title = "Advert title is required.";
        if (!formData.breed) newErrors.breed = "Breed is required.";
        if (!formData.name) newErrors.name = "Dog’s name is required.";
        if (!formData.age) newErrors.age = "Age is required.";
        if (!formData.colour) newErrors.colour = "Colour is required.";
        if (formData.colour === "other" && !formData.otherColour.trim())
            newErrors.otherColour = "Please specify the colour.";
        if (!formData.description || formData.description.length < 250)
            newErrors.description = "Description must be at least 250 characters.";
        if (formData.images.length === 0)
            newErrors.images = "Please upload at least one image.";
        if (formData.matings && formData.matings < 0)
            newErrors.matings = "Number of matings must be positive.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadImages = async (images, userId) => {
        const urls = [];
        for (const img of images) {
            const fileRef = ref(storage, `studAds/${userId}/${Date.now()}_${img.file.name}`);
            const snap = await uploadBytes(fileRef, img.file);
            urls.push(await getDownloadURL(snap.ref));
        }
        return urls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to post an advert.");
            return;
        }

        // fetch user’s saved GeoPoint & postcode
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            alert("User profile missing location data.");
            return;
        }
        const { location, postcode } = userSnap.data();

        try {
            const imageUrls = await uploadImages(formData.images, user.uid);

            // determine final colour
            const finalColour =
                formData.colour === "other"
                    ? formData.otherColour.trim()
                    : formData.colour;

            await addDoc(collection(db, "studAds"), {
                title: formData.title,
                name: formData.name,
                breed: formData.breed,
                age: formData.age,
                colour: finalColour,
                fee: formData.fee,
                height: formData.height,
                weight: formData.weight,
                fleaWormed: formData.fleaWormed,
                vacsUpToDate: formData.vacsUpToDate,
                kcRegistered: formData.kcRegistered,
                kcName: formData.kcName,
                healthTested: formData.healthTested,
                proven: formData.proven,
                healthChecks: formData.healthChecks.filter(h => h.trim() !== ""),
                facebookUrl: formData.facebookUrl,
                instagramUrl: formData.instagramUrl,
                description: formData.description,
                images: imageUrls,
                mainImageIndex: formData.mainImageIndex,
                matings: formData.matings ? Number(formData.matings) : 0,
                ownerId: user.uid,
                postcode,
                createdAt: serverTimestamp(),
                approved: false
            });

            setSuccess(
                "Your advert has been submitted successfully and is awaiting approval!"
            );
            setFormData({
                title: "",
                name: "",
                breed: "",
                age: "",
                colour: "",
                otherColour: "",
                fee: "",
                height: "",
                weight: "",
                fleaWormed: false,
                vacsUpToDate: false,
                kcRegistered: false,
                kcName: "",
                healthTested: false,
                proven: false,
                healthChecks: Array(10).fill(""),
                facebookUrl: "",
                instagramUrl: "",
                description: "",
                images: [],
                mainImageIndex: 0,
                matings: ""
            });
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Something went wrong: " + err.message);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const previews = files
            .slice(0, 10 - formData.images.length)
            .map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...previews] }));
    };

    const handleImageRemove = (idx) => {
        const updated = [...formData.images];
        URL.revokeObjectURL(updated[idx].url);
        updated.splice(idx, 1);
        setFormData(prev => ({ ...prev, images: updated }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const previews = files
            .slice(0, 10 - formData.images.length)
            .map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...previews] }));
    };

    return (
        <div className="new-advert-page">
            {success && <div className="success-message">{success}</div>}

            <div className="form-layout">
                <form
                    onSubmit={handleSubmit}
                    className="advert-form"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <h1>Create New Stud Advert</h1>

                    {/* Basic Information */}
                    <div className="form-section">
                        <div className="form-section-title">
                            {/* icon */}
                            Basic Information
                        </div>
                        <div className="form-group">
                            <label className="form-label">Advert Title</label>
                            <input
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter an attention-grabbing title"
                            />
                            {errors.title && <small className="error">{errors.title}</small>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dog Breed</label>
                            <Select
                                options={breedOptions}
                                value={breedOptions.find(o => o.value === formData.breed)}
                                onChange={opt =>
                                    handleChange({ target: { name: "breed", value: opt?.value || "" } })
                                }
                                placeholder="Search for a breed..."
                                isClearable
                                className="breed-select"
                            />
                            {errors.breed && <small className="error">{errors.breed}</small>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Dog’s Name</label>
                                <input
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your dog’s name"
                                />
                                {errors.name && <small className="error">{errors.name}</small>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Age</label>
                                <input
                                    className="form-control"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="e.g. 2 years or 18 months"
                                />
                                {errors.age && <small className="error">{errors.age}</small>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Colour</label>
                                <Select
                                    options={colourOptions}
                                    value={colourOptions.find(o => o.value === formData.colour)}
                                    onChange={opt =>
                                        setFormData(prev => ({
                                            ...prev,
                                            colour: opt?.value || "",
                                            // reset otherColour if not “other”
                                            otherColour: opt?.value === "other" ? prev.otherColour : ""
                                        }))
                                    }
                                    placeholder="Select a colour..."
                                    isClearable
                                    className="colour-select"
                                />
                                {errors.colour && <small className="error">{errors.colour}</small>}
                            </div>
                            {formData.colour === "other" && (
                                <div className="form-group">
                                    <label className="form-label">Other Colour</label>
                                    <input
                                        className="form-control"
                                        name="otherColour"
                                        value={formData.otherColour}
                                        onChange={handleChange}
                                        placeholder="Enter custom colour"
                                    />
                                    {errors.otherColour && (
                                        <small className="error">{errors.otherColour}</small>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Stud Fee (£)</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    name="fee"
                                    value={formData.fee}
                                    onChange={handleChange}
                                    placeholder="Fee amount in £"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Height</label>
                                <input
                                    className="form-control"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="Height in inches or cm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weight</label>
                                <input
                                    className="form-control"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="Weight in kg or lbs"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Number of Matings</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    name="matings"
                                    value={formData.matings}
                                    onChange={handleChange}
                                    placeholder="e.g. 2 matings"
                                />
                                {errors.matings && <small className="error">{errors.matings}</small>}
                            </div>
                        </div>
                    </div>

                    {/* Health & Registration */}
                    <div className="form-section">
                        <div className="form-section-title">
                            {/* icon */}
                            Health & Registration
                        </div>
                        <div className="checkbox-group">
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="fleaWormed" checked={formData.fleaWormed} onChange={handleChange}
                                />
                                <span>Flea & Worm Treated</span>
                            </label>
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="vacsUpToDate" checked={formData.vacsUpToDate} onChange={handleChange}
                                />
                                <span>Vaccinations Up to Date</span>
                            </label>
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="proven" checked={formData.proven} onChange={handleChange}
                                />
                                <span>Proven Stud</span>
                            </label>
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="kcRegistered"
                                    checked={formData.kcRegistered}
                                    onChange={handleChange}
                                />
                                <span>KC Registered</span>
                            </label>
                        </div>

                        {formData.kcRegistered && (
                            <div className="form-group">
                                <label className="form-label">KC Registered Name</label>
                                <input
                                    className="form-control"
                                    name="kcName"
                                    value={formData.kcName}
                                    onChange={handleChange}
                                    placeholder="Official KC registered name"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="healthTested"
                                    checked={formData.healthTested}
                                    onChange={handleChange}
                                />
                                <span>Health Tested</span>
                            </label>
                        </div>

                        {formData.healthTested && (
                            <div className="form-group">
                                <label className="form-label">Health Tests</label>
                                {formData.healthChecks.map((check, i) => (
                                    <input
                                        key={i}
                                        className="form-control"
                                        value={check}
                                        onChange={(e) => handleHealthCheckChange(i, e.target.value)}
                                        placeholder={`Health Test ${i + 1} (e.g. Hip Score)`}
                                        style={{ marginBottom: "0.5rem" }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Contact & Description */}
                    <div className="form-section">
                        <div className="form-section-title">
                            {/* icon */}
                            Contact & Description
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Facebook (Optional)</label>
                                <input
                                    className="form-control"
                                    name="facebookUrl"
                                    value={formData.facebookUrl}
                                    onChange={handleChange}
                                    placeholder="Your Facebook URL"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instagram (Optional)</label>
                                <input
                                    className="form-control"
                                    name="instagramUrl"
                                    value={formData.instagramUrl}
                                    onChange={handleChange}
                                    placeholder="Your Instagram handle"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={6}
                                placeholder="Tell potential clients about your dog’s temperament, size, qualities, etc."
                            />
                            {errors.description && <small className="error">{errors.description}</small>}
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="form-section">
                        <div className="form-section-title">
                            {/* icon */}
                            Photos
                        </div>
                        <div className="image-upload" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                            <label className="image-upload-label">Upload Photos (Max 10)</label>
                            <p>Drag and drop images here or click to browse</p>
                            <label className="file-upload-btn">
                                Browse Files
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    style={{ display: "none" }}
                                />
                            </label>
                            {errors.images && <small className="error">{errors.images}</small>}

                            {formData.images.length > 0 && (
                                <div className="preview-grid">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="preview-image-container">
                                            <div
                                                className={`preview-image-wrapper ${
                                                    formData.mainImageIndex === i ? "main-selected" : ""
                                                }`}
                                            >
                                                <img src={img.url} alt={`Preview ${i}`} />
                                            </div>
                                            <div className="image-button-row">
                                                <button
                                                    type="button"
                                                    className={`set-main-btn ${
                                                        formData.mainImageIndex === i ? "active" : ""
                                                    }`}
                                                    onClick={() =>
                                                        setFormData(prev => ({ ...prev, mainImageIndex: i }))
                                                    }
                                                >
                                                    {formData.mainImageIndex === i ? "Main" : "Set Main"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="remove-image-btn"
                                                    onClick={() => handleImageRemove(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="submit-button">
                        Submit Advert
                    </button>
                </form>

                {/* Help Panel */}
                <div className="form-help-panel">
                    <h2>Need Help?</h2>
                    <div className="help-section">
                        <h4>Advert Title & Breed</h4>
                        <p>
                            Choose a clear, specific title that highlights your dog’s best qualities. Use the breed search to find the correct match.
                        </p>
                    </div>
                    <div className="help-section">
                        <h4>Dog Details</h4>
                        <p>
                            Enter your dog’s name, age (in months or years), and colour. Being specific helps potential clients know exactly what to expect.
                        </p>
                    </div>
                    <div className="help-section">
                        <h4>Health & Registration</h4>
                        <p>
                            Dogs with proper health testing and KC registration typically attract more serious inquiries and can command higher fees.
                        </p>
                    </div>
                    <div className="help-section">
                        <h4>Description Tips</h4>
                        <p>
                            Write a detailed description (minimum 250 characters) that includes personality traits, size, temperament, and any special qualities.
                        </p>
                    </div>
                    <div className="help-section">
                        <h4>Photos</h4>
                        <p>
                            High-quality photos showcase your dog best. Include full body shots and close-ups showing features important for your breed.
                        </p>
                    </div>
                    <div className="help-section">
                        <h4>Social Links</h4>
                        <p>
                            Adding your Facebook or Instagram helps build trust and allows potential clients to connect with you more easily.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewAdvert;
