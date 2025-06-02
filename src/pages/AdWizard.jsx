import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { db, storage, auth } from "../firebase/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    getDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
    petBreedOptions,
    updatedPetCategories as petCategories,
    updatedFieldConfigurations as fieldConfigurations,
} from "./data/breedOptions";

// Import modernized styles
import "./AdWizard.css"; // Renamed to match the new style

export default function AdWizard({ mode }) {
    const { adId } = useParams();
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState("");      // e.g. "dogs", "cats"
    const [intent, setIntent] = useState("");          // "sale" or "stud"
    const [breedOrType, setBreedOrType] = useState(""); // e.g. "Labrador", "Sheep"
    const [formData, setFormData] = useState({});
    const [images, setImages] = useState([]);
    const [healthTestsEnabled, setHealthTestsEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [healthTests, setHealthTests] = useState(Array(10).fill(""));
    const [formFields, setFormFields] = useState([]);
    const studCategories = ["dogs", "cats"];
    const [mainImageIndex, setMainImageIndex] = useState(null);

    const navigate = useNavigate();

    // Helper function for image management
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.slice(0, 10 - images.length).map((file) => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setImages((prev) => [...prev, ...previews]);
    };

    const handleImageRemove = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        // Reset main image if it was removed
        if (mainImageIndex === idx) {
            setMainImageIndex(null);
        } else if (mainImageIndex > idx) {
            // Adjust index if we removed an image before the main one
            setMainImageIndex(mainImageIndex - 1);
        }
    };

    const handleStartOver = () => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to start over? All your data will be lost.")) {
            // Reset all form state
            setStep(1);
            setCategory("");
            setIntent("");
            setBreedOrType("");
            setFormData({});
            setImages([]);
            setHealthTestsEnabled(false);
            setHealthTests(Array(10).fill(""));
            setFormFields([]);
            setMainImageIndex(null);
        }
    };

    // Capitalize helper
    const capitalize = str =>
        str && str.length
            ? str.charAt(0).toUpperCase() + str.slice(1)
            : "";

    // Build a dynamic heading
    const getHeading = () => {
        if (!category) return "Create New Advert";

        let base = `Create New ${capitalize(category)}`;
        if (intent === "sale")      base += " For Sale";
        else if (intent === "stud") base += " Stud";
        if (breedOrType)            base += `: ${breedOrType}`;

        return base;
    };

    // Set up form fields based on selected category and intent
    useEffect(() => {
        if (!category || !intent) return;

        // 1) Try to find a top-level entry first
        let cfg = petCategories[category];

        // 2) If it exists but has no `fields` array, fall back to your old subcat logic
        if (!cfg?.fields) {
            cfg =
                petCategories.mammals?.subcategories?.[category]       ||
                petCategories.birds?.subcategories?.[category]        ||
                petCategories.reptiles?.subcategories?.[category]     ||
                petCategories.fish?.subcategories?.[category]         ||
                petCategories.invertebrates?.subcategories?.[category]||
                petCategories.livestock?.subcategories?.[category]    ||
                null;
        }

        if (!cfg) {
            console.warn("⚠️ No config found for", category);
            setFormFields([]);
            return;
        }

        // 3) Build field list
        const baseFields = Array.isArray(cfg.fields) ? cfg.fields : [];
        const saleExtras = intent === "sale" ? cfg.fieldsForSale || [] : [];
        const studExtras = intent === "stud" ? cfg.fieldsForStud || [] : [];
        const allFields = [...baseFields, ...saleExtras, ...studExtras];

        setFormFields([...new Set(allFields)]);
    }, [category, intent]);

    // Load data when in edit mode
    useEffect(() => {
        if (mode === "edit" && adId) {
            (async () => {
                const snap = await getDoc(doc(db, "allListings", adId));
                if (!snap.exists()) return alert("Advert not found");

                const data = snap.data();

                // 1) Populate the wizard
                setCategory(data.category);
                setIntent(data.intent);
                setBreedOrType(data.breedOrType);

                // 2) Build formFields exactly as your step-3 logic does
                let cfg = petCategories[data.category];
                if (!cfg?.fields) {
                    cfg =
                        petCategories.mammals?.subcategories?.[data.category]       ||
                        petCategories.birds?.subcategories?.[data.category]        ||
                        petCategories.reptiles?.subcategories?.[data.category]     ||
                        petCategories.fish?.subcategories?.[data.category]         ||
                        petCategories.invertebrates?.subcategories?.[data.category]||
                        petCategories.livestock?.subcategories?.[data.category]    ||
                        null;
                }

                const base = cfg.fields || [];
                const extras = data.intent === "sale" ? (cfg.fieldsForSale || []) : (cfg.fieldsForStud || []);
                setFormFields([...new Set([...base, ...extras])]);

                // 3) Pre-fill every form field
                setFormData(data);

                setHealthTestsEnabled(!!data.healthTests); // enable toggle if data exists
                setHealthTests(
                    Array.isArray(data.healthTests) && data.healthTests.length
                        ? [...data.healthTests, ...Array(10 - data.healthTests.length).fill("")]
                        : Array(10).fill("")
                );


                // 4) Preload images into your state
                setImages(data.images.map(url => ({ url, file: null })));

                // 5) Set main image if available
                if (data.mainImageIndex !== undefined) {
                    setMainImageIndex(data.mainImageIndex);
                }

                // 6) Jump to the right step
                setStep(4);
            })();
        }
    }, [mode, adId]);

    // Render form fields based on configuration
    const renderField = (fieldName) => {
        const config = fieldConfigurations[fieldName];
        if (!config) return null;

        if (fieldName === "availableDate" || fieldName === "dob") {
            return (
                <div className="adwizard-form-group" key={fieldName}>
                    <label htmlFor={fieldName}>{config.label}</label>
                    <div className="adwizard-date-input-container">
                        <input
                            type="date"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }))
                            }
                            className="adwizard-form-control"
                            placeholder={`Select ${config.label.toLowerCase()}`}
                        />
                    </div>
                </div>
            );
        }

        switch (config.type) {
            case "text":
                return (
                    <div className="adwizard-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <input
                            type="text"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            placeholder={config.placeholder || config.label}
                            className="adwizard-form-control"
                        />
                    </div>
                );

            case "number":
                return (
                    <div className="adwizard-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <input
                            type="number"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                            className="adwizard-form-control"
                            min="0"
                            step={fieldName.toLowerCase().includes("price") ? "0.01" : "1"}
                        />
                    </div>
                );

            case "select":
                return (
                    <div className="adwizard-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <select
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            className="adwizard-form-control"
                        >
                            <option value="">{`Select ${config.label.toLowerCase()}`}</option>
                            {config.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case "checkbox":
                return (
                    <div className="adwizard-form-checkbox" key={fieldName}>
                        <label>
                            <input
                                type="checkbox"
                                name={fieldName}
                                checked={formData[fieldName] || false}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [fieldName]: e.target.checked
                                    }))
                                }
                            />{" "}
                            {config.label}
                        </label>
                    </div>
                );
            case "textarea":
                return (
                    <div className="adwizard-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <textarea
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                            required={config.required}
                            className="adwizard-form-control"
                            rows={4}
                        />
                    </div>
                );
            case "date": {
                // pull the existing value (string like "2023-05-21")
                const raw = formData[fieldName] || "";
                // parse into a JS Date or null
                const parsedDate = raw ? new Date(raw) : null;

                return (
                    <div className="adwizard-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <div className="react-datepicker-wrapper">
                            <div className="react-datepicker__input-container">
                                <DatePicker
                                    id={fieldName}
                                    selected={parsedDate}
                                    onChange={date =>
                                        setFormData(prev => ({
                                            ...prev,
                                            // store as "YYYY-MM-DD"
                                            [fieldName]: date ? date.toISOString().split("T")[0] : ""
                                        }))
                                    }
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText={`Select ${config.label.toLowerCase()}`}
                                    className="adwizard-form-control"
                                 showMonthYearDropdown/>
                            </div>
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    function formatUKPostcode(raw) {
        if (!raw) return "";

        const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/gi, "");

        if (cleaned.length < 5 || cleaned.length > 7) return "";

        const outward = cleaned.slice(0, cleaned.length - 3);
        const inward = cleaned.slice(-3);

        return `${outward} ${inward}`;
    }


    // Handle form submission
    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            return alert("You must be logged in to post an advert.");
        }

        setIsSubmitting(true);

        try {
            // 1) Separate out already-hosted images vs new File objects
            const existing = images
                .filter(img => !img.file)
                .map(img => img.url);

            const toUpload = images.filter(img => img.file);

            // 2) Upload only the new files
            const uploaded = [];
            for (let { file } of toUpload) {
                const imageRef = ref(storage, `adverts/${user.uid}/${Date.now()}_${file.name}`);
                const snap = await uploadBytes(imageRef, file);
                uploaded.push(await getDownloadURL(snap.ref));
            }

            // 3) Merge hosted + newly uploaded URLs
            const allImageUrls = [...existing, ...uploaded];

            // 4) Prepare the advert payload
            const advertData = {
                category,
                intent,
                breedOrType,
                createdAt: serverTimestamp(),
                ownerId: user.uid,
                images: allImageUrls,
                approved: false,
                expired: false,
                sold: false,
                kcName: formData.kcName?.trim() || "",
                mainImageIndex // Store the main image index
            };

            // Add all form fields
            formFields.forEach(field => {
                if (formData[field] !== undefined) {
                    advertData[field] = formData[field];
                }
            });

            // Add health tests if enabled
            if (healthTestsEnabled) {
                const tests = healthTests.filter(str => str.trim() !== "");
                if (tests.length) advertData.healthTests = tests;
            }

            // Add location from postcode
            // Get postcode from user profile in Firestore
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const postcode = formatUKPostcode(userData.postcode);

                    if (postcode) {
                        advertData.postcode = postcode; // Save the postcode to the advert

                        const apiKey = "pP8O9JNud0upxRnM9Fbs3w45793";
                        const response = await fetch(`https://api.getAddress.io/find/${postcode}?api-key=${apiKey}`);
                        const geo = await response.json();

                        if (geo?.latitude && geo?.longitude) {
                            advertData.location = {
                                latitude: geo.latitude,
                                longitude: geo.longitude
                            };
                        } else {
                            console.warn("⚠️ Postcode lookup returned no coordinates.");
                        }
                    } else {
                        console.warn("⚠️ No postcode found in user profile.");
                    }
                } else {
                    console.warn("⚠️ User profile not found in Firestore.");
                }
            } catch (err) {
                console.error("❌ Error fetching user postcode or location:", err);
            }



            // 5) Create or update in Firestore
            if (mode === "create") {
                await addDoc(collection(db, "allListings"), advertData);
            } else {
                await updateDoc(doc(db, "allListings", adId), advertData);
            }

            // Move to success step
            setStep(6);
        } catch (error) {
            console.error("Failed to submit advert:", error);
            alert("There was an error submitting your advert.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate progress indicator based on current step
    const renderProgressSteps = () => {
        const totalSteps = 6;
        const steps = [];

        for (let i = 1; i <= totalSteps; i++) {
            let stepClass = "adwizard-progress-step";

            if (i === step) {
                stepClass += " active";
            } else if (i < step) {
                stepClass += " completed";
            }

            steps.push(
                <div key={i} className={stepClass}>
                    {i < step ? "" : i}
                </div>
            );
        }

        return (
            <div className="adwizard-progress">
                {steps}
            </div>
        );
    };

    return (
        <div className="adwizard-container">
            <h1 className="adwizard-title">{getHeading()}</h1>

            {renderProgressSteps()}

            {/* Start Over button (only shown after step 1) */}
            {step > 1 && (
                <div className="adwizard-startover">
                    <button
                        className="adwizard-btn adwizard-btn-danger"
                        onClick={handleStartOver}
                    >
                        Start Over
                    </button>
                </div>
            )}

            {/* Step 1: Category Selection */}
            {step === 1 && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 1: Select a Category</h2>
                    <div className="adwizard-options">
                        {["dogs", "cats", "livestock", "horses", "birds", "rabbits", "reptiles", "rodents", "fish", "invertebrates", "poultry"].map((cat) => (
                            <button
                                key={cat}
                                className={`adwizard-option-button ${category === cat ? "selected" : ""}`}
                                onClick={() => {
                                    setCategory(cat);
                                    if (studCategories.includes(cat)) {
                                        // this category supports both Sale and Stud → go to step 2
                                        setStep(2);
                                    } else {
                                        // sale-only → auto-set intent and jump straight to step 3
                                        setIntent("sale");
                                        setStep(3);
                                    }
                                }}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Intent Selection (Sale or Stud) */}
            {step === 2 && category && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 2: Is your listing for Sale or Stud?</h2>
                    <div className="adwizard-options">
                        {["dogs", "cats", "horses"].includes(category) && (
                            <>
                                <button
                                    className={`adwizard-option-button ${intent === 'sale' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setIntent("sale");
                                        setStep(3);
                                    }}
                                >
                                    For Sale
                                </button>
                                {category !== "horses" && (
                                    <button
                                        className={`adwizard-option-button ${intent === 'stud' ? 'selected' : ''}`}
                                        onClick={() => {
                                            setIntent("stud");
                                            setStep(3);
                                        }}
                                    >
                                        For Stud
                                    </button>
                                )}
                            </>
                        )}
                        {!["dogs", "cats", "horses"].includes(category) && (
                            <button
                                className="adwizard-option-button"
                                onClick={() => {
                                    setIntent("sale");
                                    setStep(3);
                                }}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                    <button className="adwizard-back-button" onClick={() => setStep(1)}>
                        Go Back
                    </button>
                </div>
            )}

            {/* Step 3: Breed or Type Selection */}
            {step === 3 && intent && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">
                        Step 3: Select a {category === "livestock" ? "Subtype" : "Breed"}
                    </h2>

                    {petBreedOptions[category] ? (
                        <div className="adwizard-select-container">
                            <Select
                                value={breedOrType ? { value: breedOrType, label: breedOrType } : null}
                                options={petBreedOptions[category].map(breed => ({
                                    value: breed,
                                    label: breed
                                }))}
                                placeholder={`Select a ${category === "livestock" ? "Subtype" : "Breed"}`}
                                onChange={(selectedOption) => setBreedOrType(selectedOption.value)}
                                className="adwizard-select"
                                classNamePrefix="adwizard-select"
                                styles={{
                                    control: (baseStyles) => ({
                                        ...baseStyles,
                                        padding: '10px',
                                        borderColor: '#e7ecf3',
                                        borderWidth: '2px',
                                        borderRadius: '10px',
                                        boxShadow: 'none'
                                    }),
                                    menu: (baseStyles) => ({
                                        ...baseStyles,
                                        zIndex: 999,
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                        borderRadius: '10px',
                                        overflow: 'hidden'
                                    }),
                                    menuList: (baseStyles) => ({
                                        ...baseStyles,
                                        padding: '10px 0',
                                        "&::-webkit-scrollbar": {
                                            width: "8px"
                                        },
                                        "&::-webkit-scrollbar-track": {
                                            background: "#f1f1f1",
                                            borderRadius: "4px"
                                        },
                                        "&::-webkit-scrollbar-thumb": {
                                            background: "#cbd5e0",
                                            borderRadius: "4px"
                                        },
                                        "&::-webkit-scrollbar-thumb:hover": {
                                            background: "#a0aec0"
                                        }
                                    }),
                                    option: (baseStyles, state) => ({
                                        ...baseStyles,
                                        backgroundColor: state.isSelected
                                            ? '#1c5235'
                                            : state.isFocused
                                                ? '#f0f9f4'
                                                : undefined,
                                        color: state.isSelected ? 'white' : '#334155',
                                        padding: '12px 16px',
                                        cursor: 'pointer'
                                    })
                                }}
                            />
                        </div>
                    ) : (
                        <div className="adwizard-form-group">
                            <label htmlFor="breedOrType">{`Enter ${category === "livestock" ? "Subtype" : "Breed"}`}</label>
                            <input
                                type="text"
                                id="breedOrType"
                                placeholder={`Enter ${category === "livestock" ? "Subtype" : "Breed"}`}
                                value={breedOrType}
                                onChange={(e) => setBreedOrType(e.target.value)}
                                className="adwizard-form-control"
                            />
                        </div>
                    )}

                    <div className="adwizard-summary-actions">
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(2)}>
                            Back
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={() => setStep(4)}
                            disabled={!breedOrType}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Advert Details */}
            {step === 4 && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 4: Advert Details</h2>

                    {/* Render form fields from configuration */}
                    {formFields
                        .filter(f => f !== "breed")
                        .map(renderField)
                    }

                    {/* Show CITES field if endangered is checked */}
                    {formData.endangered && (
                        <>
                            <div className="adwizard-callout">
                                <strong>Why we ask:</strong>
                                UK law requires a valid CITES Article 10 certificate for trading endangered species.
                            </div>
                            {renderField("citesCertificateNumber")}
                        </>
                    )}

                    {/* Show KC name field if KC registered is checked */}
                    {formData.kcRegistered && (
                        <div className="adwizard-form-group">
                            <label htmlFor="kcName">KC Registration Name</label>
                            <input
                                type="text"
                                id="kcName"
                                name="kcName"
                                value={formData.kcName || ""}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, kcName: e.target.value }))
                                }
                                placeholder="Enter kennel club registration name"
                                className="adwizard-form-control"
                            />
                        </div>
                    )}

                    {/* Health Tests Toggle & Inputs */}
                    {((category === "dogs" || category === "cats") && intent === "stud") && (
                        <>
                            <div className="adwizard-form-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={healthTestsEnabled}
                                        onChange={e => setHealthTestsEnabled(e.target.checked)}
                                    />{" "}
                                    Add health test details
                                </label>
                            </div>

                            {healthTestsEnabled && (
                                <div className="adwizard-health-tests-container">
                                    <div className="adwizard-callout" style={{ marginBottom: '16px' }}>
                                        <strong>Important:</strong> Only list health tests that your pet has passed or is clear for.
                                        This helps potential customers make informed decisions about breeding.
                                    </div>
                                    {healthTests.map((value, idx) => (
                                        <div className="adwizard-form-group" key={idx}>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={e => {
                                                    const arr = [...healthTests];
                                                    arr[idx] = e.target.value;
                                                    setHealthTests(arr);
                                                }}
                                                placeholder={`Health Test #${idx + 1} (e.g. Hip Score, DNA…)`}
                                                className="adwizard-form-control"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Image Upload Section */}
                    <div className="adwizard-image-upload">
                        <h3>Upload Photos (Max 10)</h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            marginBottom: '12px',
                            fontStyle: 'italic'
                        }}>
                            Click on any uploaded image to set it as the main image for your advert.
                            The main image will be displayed first and used as the thumbnail.
                        </p>
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                disabled={images.length >= 10}
                            />
                        </div>
                        {images.length > 0 && (
                            <div className="adwizard-preview-grid">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`adwizard-preview-item ${mainImageIndex === idx ? 'main-image' : ''}`}
                                        onClick={() => setMainImageIndex(idx)}
                                    >
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleImageRemove(idx);
                                            }}
                                        >✕</button>

                                        {/* Image preview */}
                                        <img src={img.url} alt={`preview-${idx}`} />

                                        {/* Hover overlay */}
                                        <div className="hover-overlay">
                                            {mainImageIndex === idx ? '★ Main Image' : 'Set as main'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="adwizard-summary-actions">
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(3)}>
                            Back
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={() => setStep(5)}
                            disabled={Object.keys(formData).length === 0 || images.length === 0}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Review Advert */}
            {step === 5 && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 5: Review Your Advert</h2>

                    <ul className="adwizard-summary-list">
                        <li><strong>Category:</strong> {category.charAt(0).toUpperCase() + category.slice(1)}</li>
                        <li><strong>Intent:</strong> {intent === "sale" ? "For Sale" : "For Stud"}</li>
                        <li><strong>{category === "livestock" ? "Subtype" : "Breed"}:</strong> {breedOrType}</li>
                        {formFields
                            .filter(field => formData[field] !== undefined && formData[field] !== "")
                            .map((field) => (
                                <li key={field}>
                                    <strong>{fieldConfigurations[field]?.label || field}:</strong>{" "}
                                    {formData[field] ?
                                        typeof formData[field] === 'boolean' ?
                                            formData[field] ? 'Yes' : 'No'
                                            : String(formData[field])
                                        : "N/A"}
                                </li>
                            ))}

                        {healthTestsEnabled && healthTests.some(test => test.trim() !== "") && (
                            <li>
                                <strong>Health Tests:</strong>
                                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                                    {healthTests
                                        .filter(test => test.trim() !== "")
                                        .map((test, idx) => (
                                            <li key={idx} style={{ marginBottom: '6px' }}>{test}</li>
                                        ))}
                                </ul>
                            </li>
                        )}

                        <li>
                            <strong>Images:</strong>
                            <div className="adwizard-summary-images">
                                {images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <img
                                            src={img.url}
                                            alt={`preview-${idx}`}
                                            className="adwizard-summary-thumb"
                                            style={{
                                                border: idx === mainImageIndex ? '3px solid #b83c56' : '1px solid #edf2f7'
                                            }}
                                        />
                                        {idx === mainImageIndex && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                background: '#b83c56',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>★</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </li>
                    </ul>

                    <div className="adwizard-summary-actions">
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(4)}>
                            Back to Edit
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="submitting-label">
                                    <span className="spinner" /> Submitting…
                                </span>
                            ) : "Submit Advert"}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 6: Submission Complete */}
            {step === 6 && (
                <div className="adwizard-step adwizard-submitted">
                    <h2 className="adwizard-subtitle">Advert Submitted</h2>
                    <p>
                        Your advert has been sent for approval. We'll review it as soon as possible
                        and let you know once it's live.
                    </p>
                    <div className="adwizard-summary-actions">
                        <button
                            className="adwizard-btn adwizard-btn-outline"
                            onClick={handleStartOver}
                        >
                            Create Another Advert
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={() => {
                                const uid = auth.currentUser?.uid;
                                if (uid) navigate(`/profile/${uid}`);
                                else alert("User not logged in");
                            }}
                        >
                            View My Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}