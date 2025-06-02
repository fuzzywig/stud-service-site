// src/pages/EditStud.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage, auth } from "../firebase/firebase";
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import Select from "react-select";
import { breedOptions } from "../components/breedOptions.js";
import "./NewAdvert.css";

export default function EditStud() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        name: "",
        breed: "",
        age: "",
        colour: "",
        fee: "",
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
        // images holds objects: { file: File, url: preview } or { file: null, url: existingUrl }
        images: []
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");

    // load existing advert
    useEffect(() => {
        (async () => {
            const snap = await getDoc(doc(db, "studAds", id));
            if (!snap.exists()) {
                alert("Advert not found");
                return navigate(-1);
            }
            const data = snap.data();
            setFormData({
                title: data.title || "",
                name: data.name || "",
                breed: data.breed || "",
                age: data.age || "",
                colour: data.colour || "",
                fee: data.fee || "",
                fleaWormed: data.fleaWormed || false,
                vacsUpToDate: data.vacsUpToDate || false,
                kcRegistered: data.kcRegistered || false,
                kcName: data.kcName || "",
                healthTested: data.healthTested || false,
                proven: data.proven || false,
                height: data.height || "",
                weight: data.weight || "",
                matings: data.matings || "",
                mainImageIndex: data.mainImageIndex || 0,
                healthChecks: data.healthChecks?.concat(Array(10 - (data.healthChecks?.length || 0)).fill("")) || Array(10).fill(""),
                facebookUrl: data.facebookUrl || "",
                instagramUrl: data.instagramUrl || "",
                description: data.description || "",
                images: (data.images || []).map(url => ({ file: null, url }))
            });
            setLoading(false);
        })();
    }, [id, navigate]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(f => ({
            ...f,
            [name]: type === "checkbox" ? checked : value
        }));
        setErrors(e => ({ ...e, [name]: "" }));
    };

    const handleHealthCheckChange = (index, value) => {
        const hc = [...formData.healthChecks];
        hc[index] = value;
        setFormData(f => ({ ...f, healthChecks: hc }));
    };

    const handleImageChange = e => {
        const files = Array.from(e.target.files);
        const previews = files
            .slice(0, 10 - formData.images.length)
            .map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(f => ({ ...f, images: [...f.images, ...previews] }));
    };

    const handleImageRemove = idx => {
        const imgs = [...formData.images];
        URL.revokeObjectURL(imgs[idx].url);
        imgs.splice(idx, 1);
        setFormData(f => ({ ...f, images: imgs }));
    };

    const handleDrop = e => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const previews = files
            .slice(0, 10 - formData.images.length)
            .map(file => ({ file, url: URL.createObjectURL(file) }));
        setFormData(f => ({ ...f, images: [...f.images, ...previews] }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.title) errs.title = "Advert title is required.";
        if (!formData.breed) errs.breed = "Breed is required.";
        if (!formData.name) errs.name = "Dog's name is required.";
        if (!formData.age) errs.age = "Age is required.";
        if (!formData.description || formData.description.length < 250)
            errs.description = "Description must be at least 250 characters.";
        if (formData.images.length === 0)
            errs.images = "Please keep at least one image.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const uploadNewImages = async (images) => {
        const urls = [];
        const userId = auth.currentUser.uid;
        for (const img of images.filter(i => i.file)) {
            const fileRef = ref(
                storage,
                `studAds/${userId}/${Date.now()}_${img.file.name}`
            );
            const snap = await uploadBytes(fileRef, img.file);
            urls.push(await getDownloadURL(snap.ref));
        }
        return urls;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            // Separate existing vs new
            const existing = formData.images
                .filter(i => !i.file)
                .map(i => i.url);
            const newUrls = await uploadNewImages(formData.images);
            const finalImages = [...existing, ...newUrls];

            await updateDoc(doc(db, "studAds", id), {
                title: formData.title,
                name: formData.name,
                breed: formData.breed,
                age: formData.age,
                colour: formData.colour,
                fee: formData.fee,
                height: formData.height,
                weight: formData.weight,
                matings: formData.matings,
                fleaWormed: formData.fleaWormed,
                vacsUpToDate: formData.vacsUpToDate,
                kcRegistered: formData.kcRegistered,
                kcName: formData.kcName,
                healthTested: formData.healthTested,
                proven: formData.proven,
                healthChecks: formData.healthChecks.filter(h => h.trim()),
                facebookUrl: formData.facebookUrl,
                instagramUrl: formData.instagramUrl,
                description: formData.description,
                images: finalImages,
                mainImageIndex: formData.mainImageIndex,
                updatedAt: serverTimestamp()
            });

            setSuccess("Your advert has been updated successfully!");
            setTimeout(() => {
                navigate(`/stud-details/${id}`);
            }, 1500);
        } catch (err) {
            console.error("Update failed:", err);
            alert("Something went wrong: " + err.message);
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading advert...</p>
        </div>
    );

    return (
        <div className="new-advert-page">
            {success && <div className="success-message">{success}</div>}
            <div className="form-layout">
                <form onSubmit={handleSubmit} className="advert-form" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                    <h1>Create New Stud Advert</h1>

                    <div className="form-section">
                        <div className="form-section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
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
                                value={breedOptions.find(option => option.value === formData.breed)}
                                onChange={(selectedOption) => handleChange({ target: { name: "breed", value: selectedOption?.value || "" } })}
                                placeholder="Search for a breed..."
                                isClearable
                                className="breed-select"
                            />
                            {errors.breed && <small className="error">{errors.breed}</small>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Dog's Name</label>
                                <input
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your dog's name"
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
                                <input
                                    className="form-control"
                                    name="colour"
                                    value={formData.colour}
                                    onChange={handleChange}
                                    placeholder="Dog's colour or markings"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stud Fee</label>
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
                            </div>

                        </div>

                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                            </svg>
                            Health & Registration
                        </div>

                        <div className="checkbox-group">
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="fleaWormed"
                                    checked={formData.fleaWormed}
                                    onChange={handleChange}
                                />
                                <span>Flea & Worm Treated</span>
                            </label>
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="vacsUpToDate"
                                    checked={formData.vacsUpToDate}
                                    onChange={handleChange}
                                />
                                <span>Vaccinations Up to Date</span>
                            </label>
                            <label className="styled-checkbox">
                                <input
                                    type="checkbox"
                                    name="proven"
                                    checked={formData.proven}
                                    onChange={handleChange}
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
                                    type="text"
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
                                {formData.healthChecks.slice(0, 10).map((check, i) => (
                                    <input
                                        key={i}
                                        className="form-control"
                                        type="text"
                                        placeholder={`Health Test ${i + 1} (e.g. Hip Score, DNA Test)`}
                                        value={check}
                                        onChange={(e) => handleHealthCheckChange(i, e.target.value)}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 7V4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v3"></path>
                                <path d="M3 7h18"></path>
                                <path d="M10 16h4"></path>
                                <rect width="18" height="14" x="3" y="7" rx="2"></rect>
                            </svg>
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
                                rows="6"
                                placeholder="Tell potential clients about your dog's temperament, size, qualities, and any other information that will help them decide."
                            />
                            {errors.description && <small className="error">{errors.description}</small>}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                <circle cx="9" cy="9" r="2"></circle>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
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
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {errors.images && <small className="error">{errors.images}</small>}

                            {formData.images.length > 0 && (
                                <div className="preview-grid">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="preview-image-container">
                                            <div className={`preview-image-wrapper ${formData.mainImageIndex === i ? "main-selected" : ""}`}>
                                                <img src={img.url} alt={`Preview ${i}`} />
                                            </div>
                                            <div className="image-button-row">
                                                <button
                                                    type="button"
                                                    className={`set-main-btn ${formData.mainImageIndex === i ? "active" : ""}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, mainImageIndex: i }))}
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

                    <button type="submit" className="submit-button">Submit Advert</button>
                </form>

                <div className="form-help-panel">
                    <h2>Need Help?</h2>

                    <div className="help-section">
                        <h4>Advert Title & Breed</h4>
                        <p>Choose a clear, specific title that highlights your dog's best qualities. Use the breed search to find the correct match.</p>
                    </div>

                    <div className="help-section">
                        <h4>Dog Details</h4>
                        <p>Enter your dog's name, age (in months or years), and colour. Being specific helps potential clients know exactly what to expect.</p>
                    </div>

                    <div className="help-section">
                        <h4>Health & Registration</h4>
                        <p>Dogs with proper health testing and KC registration typically attract more serious inquiries and can command higher fees.</p>
                    </div>

                    <div className="help-section">
                        <h4>Description Tips</h4>
                        <p>Write a detailed description (minimum 250 characters) that includes personality traits, size, temperament, and any special qualities.</p>
                    </div>

                    <div className="help-section">
                        <h4>Photos</h4>
                        <p>High-quality photos showcase your dog best. Include full body shots and close-ups showing features important for your breed.</p>
                    </div>

                    <div className="help-section">
                        <h4>Social Links</h4>
                        <p>Adding your Facebook or Instagram helps build trust and allows potential clients to connect with you more easily.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}