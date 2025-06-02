import React, { useState, useEffect } from "react";
import "./NewAdvert.css";
import Select from "react-select";
import { db, storage, auth } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
    petBreedOptions,
    updatedPetCategories as petCategories,
    updatedFieldConfigurations as fieldConfigurations,
} from "./data/breedOptions";

export default function NewAdvert() {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState("");      // e.g. "dogs", "cats"
    const [intent, setIntent] = useState("");          // "sale" or "stud"
    const [breedOrType, setBreedOrType] = useState(""); // e.g. "Labrador", "Sheep"
    const [formData, setFormData] = useState({});
    const [images, setImages] = useState([]);
    // track whether user wants to enter health tests
    const [healthTestsEnabled, setHealthTestsEnabled] = useState(false);
    // store up to 10 test descriptions
    // at the top of NewAdvert, alongside your other useState calls
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [healthTests, setHealthTests] = useState(Array(10).fill(""));
    const [formFields, setFormFields] = useState([]);
    const studCategories = ["dogs", "cats"];

    const [mainImageIndex, setMainImageIndex] = useState(null);
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
        }
    };

    // 1) Capitalize helper
    const capitalize = str =>
        str && str.length
            ? str.charAt(0).toUpperCase() + str.slice(1)
            : "";

    // 2) Build a dynamic heading
    const getHeading = () => {
        if (!category) return "Create New Advert";

        let base = `Create New ${capitalize(category)}`;
        if (intent === "sale")      base += " For Sale";
        else if (intent === "stud") base += " Stud";
        if (breedOrType)            base += `: ${breedOrType}`;

        return base;
    };

    useEffect(() => {
        if (!category || !intent) return;

        console.log("🔍 Looking up fields for:", category);

        // 1) Try to find a top‐level entry first
        let cfg = petCategories[category];
        console.log("→ top‐level cfg:", cfg);

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
            console.log("→ subcat fallback cfg:", cfg);
        }

        if (!cfg) {
            console.warn("⚠️ No config found for", category);
            setFormFields([]);
            return;
        }

        // 3) Build your field list
        const baseFields = Array.isArray(cfg.fields) ? cfg.fields : [];
        const saleExtras  = intent === "sale" ? cfg.fieldsForSale  || [] : [];
        const studExtras  = intent === "stud" ? cfg.fieldsForStud  || [] : [];
        const allFields   = [...baseFields, ...saleExtras, ...studExtras];

        console.log("✔️ Fields to render:", allFields);

        setFormFields([...new Set(allFields)]);
    }, [category, intent]);



    const renderField = (fieldName) => {
        const config = fieldConfigurations[fieldName];
        if (!config) return null;

        switch (config.type) {
            case "text":
                return (
                    <div className="newadvert-form-group" key={fieldName}>
                        <input
                            type="text"
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            placeholder={config.label}
                            className="newadvert-form-control"
                        />
                    </div>
                );

            case "number":
                return (
                    <div className="newadvert-form-group" key={fieldName}>
                        <input
                            type="number"
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            placeholder={config.label}
                            className="newadvert-form-control"
                            min="0"
                            step={fieldName.toLowerCase().includes("price") ? "0.01" : "1"}
                        />
                    </div>
                );

            case "select":
                return (
                    <div className="newadvert-form-group" key={fieldName}>
                        <select
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }))
                            }
                            className="newadvert-form-control"
                        >
                            <option value="">{config.label}</option>
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
                    <div className="newadvert-form-checkbox" key={fieldName}>
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
                    <div className="newadvert-form-group" key={fieldName}>
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
                            placeholder={config.placeholder}
                            required={config.required}
                            className="newadvert-form-control"
                            rows={4}
                        />
                    </div>
                );
            case "date":
                return (
                    <div className="newadvert-form-group" key={fieldName}>
                        <label htmlFor={fieldName}>{config.label}</label>
                        <input
                            type="date"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))
                            }
                            placeholder={config.placeholder}
                            required={config.required}
                            className="newadvert-form-control"
                        />
                    </div>
                );



            default:
                return null;
        }
    };
    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            return alert("You must be logged in to post an advert.");
        }

        // turn on loading state
        setIsSubmitting(true);

        try {
            // 1. Upload images
            const uploadedImageUrls = [];
            for (let img of images) {
                const imageRef = ref(storage, `adverts/${user.uid}/${Date.now()}_${img.file.name}`);
                const snap = await uploadBytes(imageRef, img.file);
                const url = await getDownloadURL(snap.ref);
                uploadedImageUrls.push(url);
            }

            // 2. Prepare your advert data
            const advertData = {
                category,
                intent,
                breedOrType,
                createdAt: serverTimestamp(),
                ownerId: user.uid,
                images: uploadedImageUrls,
                // plus any other formData fields…
            };
            formFields.forEach(field => {
                if (formData[field] !== undefined) {
                    advertData[field] = formData[field];
                }
            });
            if (healthTestsEnabled) {
                const tests = healthTests.filter(str => str.trim() !== "");
                if (tests.length) advertData.healthTests = tests;
            }

            // 3. Send to Firestore
            await addDoc(collection(db, "allListings"), advertData);

            // 4. Advance to the “Awaiting Approval” step
            setStep(6);

        } catch (error) {
            console.error("Failed to submit advert:", error);
            alert("There was an error submitting your advert.");
        } finally {
            // always turn off loading state
            setIsSubmitting(false);
        }
    };


    // Generate progress indicator based on current step
    const renderProgressSteps = () => {
        const totalSteps = 6;
        const steps = [];

        for (let i = 1; i <= totalSteps; i++) {
            let stepClass = "newadvert-progress-step";
            if (i === step) stepClass += " active";
            if (i < step) stepClass += " completed";

            steps.push(
                <div key={i} className={stepClass}>
                    {i < step ? "✓" : i}
                </div>
            );
        }

        return (
            <div className="newadvert-progress">
                {steps}
            </div>
        );
    };

    return (
        <div className="newadvert-container">
            <h1 className="newadvert-title">{getHeading()}</h1>

            {renderProgressSteps()}

            {/* Start Over button (only shown after step 1) */}
            {step > 1 && (
                <div className="newadvert-startover">
                    <button
                        className="newadvert-btn newadvert-btn-danger"
                        onClick={handleStartOver}
                    >
                        Start Over
                    </button>
                </div>
            )}

            {step === 1 && (
                <div className="newadvert-step">
                    <h2 className="newadvert-subtitle">Step 1: Select a Category</h2>
                    <div className="newadvert-options">
                        {["dogs", "cats", "livestock", "horses", "birds", "rabbits", "reptiles", "rodents", "fish", "invertebrates", "poultry"].map((cat) => (
                            <button
                                key={cat}
                                className={`newadvert-option-button ${category === cat ? "selected" : ""}`}
                                onClick={() => {
                                    setCategory(cat);
                                    if (studCategories.includes(cat)) {
                                        // this category supports both Sale and Stud → go to step 2
                                        setStep(2);
                                    } else {
                                        // sale‐only → auto‐set intent and jump straight to step 3
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

            {step === 2 && category && (
                <div className="newadvert-step">
                    <h2 className="newadvert-subtitle">Step 2: Is your listing for Sale or Stud?</h2>
                    <div className="newadvert-options">
                        {["dogs", "cats", "horses"].includes(category) && (
                            <>
                                <button
                                    className={`newadvert-option-button ${intent === 'sale' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setIntent("sale");
                                        setStep(3);
                                    }}
                                >
                                    For Sale
                                </button>
                                {category !== "horses" && (
                                    <button
                                        className={`newadvert-option-button ${intent === 'stud' ? 'selected' : ''}`}
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
                                className="newadvert-option-button"
                                onClick={() => {
                                    setIntent("sale");
                                    setStep(3);
                                }}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                    <button className="newadvert-back-button" onClick={() => setStep(1)}>← Go Back</button>
                </div>
            )}

            {step === 3 && intent && (
                <div className="newadvert-step">
                    <h2 className="newadvert-subtitle">
                        Step 3: Select a {category === "livestock" ? "Subtype" : "Breed"}
                    </h2>

                    {petBreedOptions[category] ? (
                        <div className="newadvert-select-container">
                            <Select
                                value={breedOrType ? { value: breedOrType, label: breedOrType } : null}
                                options={petBreedOptions[category].map(breed => ({
                                    value: breed,
                                    label: breed
                                }))}
                                placeholder={`Select a ${category === "livestock" ? "Subtype" : "Breed"}`}
                                onChange={(selectedOption) => setBreedOrType(selectedOption.value)}
                                className="newadvert-select"
                                classNamePrefix="newadvert-select"
                                styles={{
                                    control: (baseStyles) => ({
                                        ...baseStyles,
                                        padding: '8px',
                                        borderColor: '#e1e8ed',
                                        boxShadow: 'none'
                                    }),
                                    menu: (baseStyles) => ({
                                        ...baseStyles,
                                        zIndex: 999
                                    }),
                                    menuList: (baseStyles) => ({
                                        ...baseStyles,
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
                                    })
                                }}
                            />
                        </div>
                    ) : (
                        <div className="newadvert-form-group">
                            <input
                                type="text"
                                placeholder={`Enter ${category === "livestock" ? "Subtype" : "Breed"}`}
                                value={breedOrType}
                                onChange={(e) => setBreedOrType(e.target.value)}
                                className="newadvert-form-control"
                            />
                        </div>
                    )}

                    <div className="newadvert-summary-actions">
                        <button className="newadvert-btn newadvert-btn-outline" onClick={() => setStep(2)}>
                            ← Back
                        </button>
                        <button
                            className="newadvert-btn newadvert-btn-primary"
                            onClick={() => setStep(4)}
                            disabled={!breedOrType}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="newadvert-step">
                    <h2 className="newadvert-subtitle">Step 4: Advert Details</h2>

                    { /* …inside the JSX of step 4… */ }
                    {formFields
                        .filter(f => f !== "breed")
                        .map(renderField)
                    }

                    { /* if they tick “endangered”, show the CITES‐number field */ }
                    {formData.endangered && (
                        <>
                            <div className="newadvert-callout">
                                <strong>Why we ask: </strong>
                                UK law requires a valid CITES Article 10 certificate for trading endangered species.
                            </div>
                            {renderField("citesCertificateNumber")}
                        </>
                    )}



                    { /* then your image-upload, buttons, etc. */ }

                    {/* If the user ticked “KC registered”, show the name‐input */}
                    { formData.kcRegistered && (
                        <div className="newadvert-form-group">
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
                                className="newadvert-form-control"
                            />
                        </div>
                    )}

                    {/* Health Tests Toggle & Inputs */}
                    {((category === "dogs" || category === "cats") && intent === "stud") && (
                        <>
                            <div className="newadvert-form-checkbox">
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
                                <div className="newadvert-health-tests-container">
                                    {healthTests.map((value, idx) => (
                                        <div className="newadvert-form-group" key={idx}>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={e => {
                                                    const arr = [...healthTests];
                                                    arr[idx] = e.target.value;
                                                    setHealthTests(arr);
                                                }}
                                                placeholder={`Health Test #${idx + 1} (e.g. Hip Score, DNA…)`}
                                                className="newadvert-form-control"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className="newadvert-image-upload">
                        <h3>Upload Photos (Max 10)</h3>
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
                            <div className="newadvert-preview-grid">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`newadvert-preview-item ${mainImageIndex===idx ? 'main-image' : ''}`}
                                        onClick={() => setMainImageIndex(idx)}   // click anywhere to set main
                                    >
                                        {/* remove button */}
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={e => {
                                                e.stopPropagation();                // don’t also set main
                                                handleImageRemove(idx);
                                            }}
                                        >✕</button>

                                        {/* the actual image */}
                                        <img src={img.url} alt={`preview-${idx}`} />

                                        {/* hover overlay */}
                                        <div className="hover-overlay">
                                            {mainImageIndex === idx ? '★ Main Image' : 'Set as main'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        )}
                    </div>

                    <div className="newadvert-summary-actions">
                        <button className="newadvert-btn newadvert-btn-outline" onClick={() => setStep(3)}>
                            ← Back
                        </button>
                        <button className="newadvert-btn newadvert-btn-primary" onClick={() => setStep(5)}>
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="newadvert-step">
                    <h2 className="newadvert-subtitle">Step 5: Review Your Advert</h2>

                    <ul className="newadvert-summary-list">
                        <li><strong>Category:</strong> {category.charAt(0).toUpperCase() + category.slice(1)}</li>
                        <li><strong>Intent:</strong> {intent === "sale" ? "For Sale" : "For Stud"}</li>
                        <li><strong>{category === "livestock" ? "Subtype" : "Breed"}:</strong> {breedOrType}</li>
                        {formFields.map((field) => (
                            <li key={field}>
                                <strong>{fieldConfigurations[field]?.label || field}:</strong>{" "}
                                {formData[field] ? String(formData[field]) : "N/A"}
                            </li>
                        ))}

                        {healthTestsEnabled && healthTests.some(test => test.trim() !== "") && (
                            <li>
                                <strong>Health Tests:</strong>
                                <ul>
                                    {healthTests
                                        .filter(test => test.trim() !== "")
                                        .map((test, idx) => (
                                            <li key={idx}>{test}</li>
                                        ))}
                                </ul>
                            </li>
                        )}

                        <li>
                            <strong>Images:</strong>
                            <div className="newadvert-summary-images">
                                {images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.url}
                                        alt={`preview-${idx}`}
                                        className="newadvert-summary-thumb"
                                    />
                                ))}
                            </div>
                        </li>

                    </ul>

                    <div className="newadvert-summary-actions">
                        <button className="newadvert-btn newadvert-btn-outline" onClick={() => setStep(4)}>
                            ← Back to Edit
                        </button>
                        <button
                            className="newadvert-btn newadvert-btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? (
                                    <span className="submitting-label">
        <span className="spinner" /> Submitting…
      </span>
                                )
                                : "Submit Advert"
                            }
                        </button>

                    </div>
                </div>
            )}
            {step === 6 && (
                <div className="newadvert-step newadvert-submitted">
                    <h2 className="newadvert-subtitle">🎉 Advert Submitted</h2>
                    <p>
                        Your advert has been sent for approval. We’ll review it as soon as possible
                        and let you know once it’s live.
                    </p>
                    <div className="newadvert-summary-actions">
                        <button
                            className="newadvert-btn newadvert-btn-outline"
                            onClick={handleStartOver}
                        >
                            Create Another Advert
                        </button>
                        {/* If you have a listing overview page: */}
                        {/* <button className="newadvert-btn newadvert-btn-primary" onClick={() => navigate("/my-listings")}>
        View My Listings
      </button> */}
                    </div>
                </div>
            )}

        </div>
    );
}