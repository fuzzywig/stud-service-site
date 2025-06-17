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
import "./AdWizard.css"; // Using same styles as AdWizard

// Define optional checkboxes - all rescue checkboxes should be optional
const RESCUE_OPTIONAL_CHECKBOXES = [
    'vaccinated',
    'microchipped',
    'fosteringAvailable',
    'withMother'
    // Add any other checkbox field names that should be optional
];

export default function AdWizardRescue({ mode }) {
    const { adId } = useParams();
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState("");      // e.g. "dogs", "cats"
    const [breedOrType, setBreedOrType] = useState(""); // e.g. "Labrador", "Sheep"
    const [formData, setFormData] = useState({});
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formFields, setFormFields] = useState([]);
    const [mainImageIndex, setMainImageIndex] = useState(null);

    // Add state for field validation
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    // Rescue-specific field configurations
    const rescueFieldConfigurations = {
        ...fieldConfigurations,
        adoptionFee: {
            type: "number",
            label: "Adoption Fee (£)",
            placeholder: "Enter adoption fee (0 if none)",
            required: true
        },
        rescueStory: {
            type: "textarea",
            label: "Rescue Story/Background",
            placeholder: "Tell this pet's story - where they came from, why they need a new home, etc.",
            required: false
        },
        specialNeeds: {
            type: "textarea",
            label: "Special Needs or Medical Conditions",
            placeholder: "Describe any ongoing medical needs, disabilities, or special care requirements",
            required: false
        },
        behavioralNotes: {
            type: "textarea",
            label: "Behavioral Notes",
            placeholder: "Describe temperament, training needs, any behavioral issues or positive traits",
            required: false
        },
        homeRequirements: {
            type: "textarea",
            label: "Ideal Home Requirements",
            placeholder: "Describe the ideal home (e.g., needs garden, no small children, experienced owner)",
            required: false
        },
        vaccinated: {
            type: "checkbox",
            label: "Fully Vaccinated",
            required: false
        },
        microchipped: {
            type: "checkbox",
            label: "Microchipped",
            required: false
        },
        goodWithCats: {
            type: "select",
            label: "Good with Cats",
            options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Unknown/Not Tested" }
            ],
            required: false
        },
        goodWithDogs: {
            type: "select",
            label: "Good with Dogs",
            options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Unknown/Not Tested" }
            ],
            required: false
        },
        goodWithChildren: {
            type: "select",
            label: "Good with Children",
            options: [
                { value: "yes", label: "Yes - All Ages" },
                { value: "older", label: "Older Children Only (12+)" },
                { value: "no", label: "No Children" },
                { value: "unknown", label: "Unknown/Not Tested" }
            ],
            required: false
        },
        energyLevel: {
            type: "select",
            label: "Energy Level",
            options: [
                { value: "low", label: "Low - Couch Potato" },
                { value: "moderate", label: "Moderate - Daily Walks" },
                { value: "high", label: "High - Very Active" }
            ],
            required: false
        },
        fosteringAvailable: {
            type: "checkbox",
            label: "Available for Fostering (Trial Period)",
            required: false
        }
    };

    // Merge all field configurations
    const allFieldConfigurations = { ...fieldConfigurations, ...rescueFieldConfigurations };

    // Helper function for image management
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.slice(0, 10 - images.length).map((file) => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setImages((prev) => [...prev, ...previews]);

        // Clear image error if images are added
        if (fieldErrors.images) {
            setFieldErrors(prev => ({ ...prev, images: null }));
        }
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

        // Add image error if no images left
        if (images.length === 1) { // Will be 0 after removal
            setFieldErrors(prev => ({ ...prev, images: 'At least one image is required' }));
        }
    };

    const handleStartOver = () => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to start over? All your data will be lost.")) {
            // Reset all form state
            setStep(1);
            setCategory("");
            setBreedOrType("");
            setFormData({});
            setImages([]);
            setFormFields([]);
            setMainImageIndex(null);
            setFieldErrors({});
        }
    };

    // Capitalize helper
    const capitalize = str =>
        str && str.length
            ? str.charAt(0).toUpperCase() + str.slice(1)
            : "";

    // Build a dynamic heading
    const getHeading = () => {
        if (!category) return "Create Rescue Listing";

        let base = `Create Rescue ${capitalize(category)} Listing`;
        if (breedOrType) base += `: ${breedOrType}`;

        return base;
    };

    // Set up form fields based on selected category
    useEffect(() => {
        if (!category) return;

        // 1) Try to find a top-level entry first
        let cfg = petCategories[category];

        // 2) If it exists but has no `fields` array, fall back to subcat logic
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

        // 3) Build field list - using sale fields as base
        const baseFields = Array.isArray(cfg.fields) ? cfg.fields : [];
        const saleExtras = cfg.fieldsForSale || [];

        // Add rescue-specific fields
        const rescueFields = [
            "adoptionFee",
            "rescueStory",
            "specialNeeds",
            "behavioralNotes",
            "homeRequirements",
            "vaccinated",
            "microchipped",
            "goodWithCats",
            "goodWithDogs",
            "goodWithChildren",
            "energyLevel",
            "fosteringAvailable"
        ];

        // Remove 'price' field if it exists and replace with adoptionFee
        const allFields = [...baseFields, ...saleExtras, ...rescueFields];
        const uniqueFields = [...new Set(allFields)].filter(field => field !== 'price');

        setFormFields(uniqueFields);
    }, [category]);

    // Load data when in edit mode
    useEffect(() => {
        if (mode === "edit" && adId) {
            (async () => {
                const snap = await getDoc(doc(db, "allListings", adId));
                if (!snap.exists()) return alert("Rescue listing not found");

                const data = snap.data();

                // Populate the wizard
                setCategory(data.category);
                setBreedOrType(data.breedOrType);

                // Build formFields
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
                const extras = cfg.fieldsForSale || [];
                const rescueFields = [
                    "adoptionFee", "rescueStory", "specialNeeds", "behavioralNotes",
                    "homeRequirements", "vaccinated", "microchipped",
                    "goodWithCats", "goodWithDogs", "goodWithChildren", "energyLevel",
                    "fosteringAvailable"
                ];

                setFormFields([...new Set([...base, ...extras, ...rescueFields])].filter(f => f !== 'price'));

                // Pre-fill form data
                setFormData(data);

                // Preload images
                setImages(data.images.map(url => ({ url, file: null })));

                // Set main image if available
                if (data.mainImageIndex !== undefined) {
                    setMainImageIndex(data.mainImageIndex);
                }

                // Jump to form step
                setStep(3);
            })();
        }
    }, [mode, adId]);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Validation function
    const validateFormFields = () => {
        const errors = {};

        // Get all fields that should be validated for current category
        const fieldsToValidate = formFields.filter(f => f !== "breed" && f !== "withMother");

        fieldsToValidate.forEach(fieldName => {
            const config = allFieldConfigurations[fieldName];
            if (!config) return;

            // Skip validation for optional checkboxes
            if (config.type === 'checkbox' && RESCUE_OPTIONAL_CHECKBOXES.includes(fieldName)) {
                return; // Skip validation - makes them optional
            }

            const isRequired = config.required === true;
            const value = formData[fieldName];

            if (isRequired) {
                // Check for empty required fields
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    errors[fieldName] = `${config.label} is required`;
                }
                // Special validation for checkboxes that are required (but not the optional ones)
                else if (config.type === 'checkbox' && !value) {
                    errors[fieldName] = `${config.label} must be selected`;
                }
            }

            // Additional validations for specific field types
            if (value) {
                if (config.type === 'number' && isNaN(parseFloat(value))) {
                    errors[fieldName] = `${config.label} must be a valid number`;
                }

                if (fieldName === 'description' && value.length < 10) {
                    errors[fieldName] = 'Description must be at least 10 characters long';
                }

                if (fieldName === 'title' && value.length < 5) {
                    errors[fieldName] = 'Title must be at least 5 characters long';
                }
            }
        });

        // Always validate images
        if (images.length === 0) {
            errors.images = 'At least one image is required';
        }

        return errors;
    };

    // Handle continue to step 4 with validation
    const handleContinueToStep4 = () => {
        const validationErrors = validateFormFields();

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);

            // Show summary alert
            const errorMessages = Object.values(validationErrors);
            alert("Please fix the following issues:\n\n• " + errorMessages.join('\n• '));

            // Scroll to first error field
            const firstErrorField = Object.keys(validationErrors)[0];
            if (firstErrorField !== 'images') {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }

            return;
        }

        // Clear any existing errors and proceed
        setFieldErrors({});
        setStep(4);
    };

    // Render form fields based on configuration with validation
    const renderField = (fieldName) => {
        const config = allFieldConfigurations[fieldName];
        if (!config) return null;

        // Override required status for optional checkboxes
        const isRequired = config.required === true && !(config.type === 'checkbox' && RESCUE_OPTIONAL_CHECKBOXES.includes(fieldName));

        const hasError = fieldErrors?.[fieldName];
        const hasValue = formData[fieldName] && formData[fieldName].toString().trim() !== '';

        // Add required class and error state
        const fieldClasses = [
            'adwizard-form-control',
            hasError ? 'error' : '',
            hasValue && isRequired ? 'valid' : ''
        ].filter(Boolean).join(' ');

        const groupClasses = [
            'adwizard-form-group',
            isRequired ? 'required' : '',
            hasValue && isRequired ? 'completed' : ''
        ].filter(Boolean).join(' ');

        if (fieldName === "availableDate" || fieldName === "dob") {
            return (
                <div className={groupClasses} key={fieldName}>
                    <label htmlFor={fieldName}>
                        {config.label}
                        {isRequired && <span className="required-asterisk"> *</span>}
                    </label>
                    <div className="adwizard-date-input-container">
                        <input
                            type="date"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
                                // Clear error when user inputs data
                                if (fieldErrors?.[fieldName]) {
                                    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                }
                            }}
                            className={fieldClasses}
                            placeholder={`Select ${config.label.toLowerCase()}`}
                            required={isRequired}
                        />
                    </div>
                    {hasError && (
                        <div className="adwizard-error-message">
                            {fieldErrors[fieldName]}
                        </div>
                    )}
                </div>
            );
        }

        switch (config.type) {
            case "text":
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        <input
                            type="text"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }));
                                if (fieldErrors?.[fieldName]) {
                                    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                }
                            }}
                            placeholder={config.placeholder || config.label}
                            className={fieldClasses}
                            required={isRequired}
                        />
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
                    </div>
                );

            case "number":
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        <input
                            type="number"
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }));
                                if (fieldErrors?.[fieldName]) {
                                    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                }
                            }}
                            placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                            className={fieldClasses}
                            min="0"
                            step={fieldName.toLowerCase().includes("price") || fieldName === "adoptionFee" ? "0.01" : "1"}
                            required={isRequired}
                        />
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
                    </div>
                );

            case "select":
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        <select
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }));
                                if (fieldErrors?.[fieldName]) {
                                    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                }
                            }}
                            className={fieldClasses}
                            required={isRequired}
                        >
                            <option value="">{`Select ${config.label.toLowerCase()}`}</option>
                            {config.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
                    </div>
                );

            case "checkbox":
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label>
                            <input
                                type="checkbox"
                                name={fieldName}
                                checked={formData[fieldName] || false}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        [fieldName]: e.target.checked
                                    }));
                                    if (fieldErrors?.[fieldName]) {
                                        setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                    }
                                }}
                                required={isRequired}
                            />{" "}
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
                    </div>
                );

            case "textarea":
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        <textarea
                            id={fieldName}
                            name={fieldName}
                            value={formData[fieldName] || ""}
                            onChange={e => {
                                setFormData(prev => ({
                                    ...prev,
                                    [fieldName]: e.target.value
                                }));
                                if (fieldErrors?.[fieldName]) {
                                    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                }
                            }}
                            placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                            required={isRequired}
                            className={fieldClasses}
                            rows={4}
                        />
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
                    </div>
                );

            case "date": {
                const raw = formData[fieldName] || "";
                const parsedDate = raw ? new Date(raw) : null;

                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                        </label>
                        <div className="react-datepicker-wrapper">
                            <div className="react-datepicker__input-container">
                                <DatePicker
                                    id={fieldName}
                                    selected={parsedDate}
                                    onChange={date => {
                                        setFormData(prev => ({
                                            ...prev,
                                            [fieldName]: date ? date.toISOString().split("T")[0] : ""
                                        }));
                                        if (fieldErrors?.[fieldName]) {
                                            setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                        }
                                    }}
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText={`Select ${config.label.toLowerCase()}`}
                                    className={fieldClasses}
                                    showMonthYearDropdown
                                    required={isRequired}
                                />
                            </div>
                        </div>
                        {hasError && (
                            <div className="adwizard-error-message">
                                {fieldErrors[fieldName]}
                            </div>
                        )}
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
            return alert("You must be logged in to post a rescue listing.");
        }

        // Final validation before submission
        const validationErrors = validateFormFields();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            alert("Please fix all required fields before submitting.");
            setStep(3); // Go back to form
            return;
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

            // 4) Prepare the rescue listing payload
            const rescueData = {
                category,
                intent: "rescue", // Always set intent as rescue
                breedOrType,
                createdAt: serverTimestamp(),
                ownerId: user.uid,
                images: allImageUrls,
                approved: false,
                expired: false,
                adopted: false, // Using adopted instead of sold for rescues
                mainImageIndex // Store the main image index
            };

            // Add all form fields
            formFields.forEach(field => {
                if (formData[field] !== undefined) {
                    rescueData[field] = formData[field];
                }
            });

            // Add location from postcode
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const postcode = formatUKPostcode(userData.postcode);

                    if (postcode) {
                        rescueData.postcode = postcode;

                        const apiKey = "pP8O9JNud0upxRnM9Fbs3w45793";
                        const response = await fetch(`https://api.getAddress.io/find/${postcode}?api-key=${apiKey}`);
                        const geo = await response.json();

                        if (geo?.latitude && geo?.longitude) {
                            rescueData.location = {
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
                await addDoc(collection(db, "allListings"), rescueData);
            } else {
                await updateDoc(doc(db, "allListings", adId), rescueData);
            }

            // Move to success step
            setStep(5);
        } catch (error) {
            console.error("Failed to submit rescue listing:", error);
            alert("There was an error submitting your rescue listing.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate progress indicator based on current step
    const renderProgressSteps = () => {
        const totalSteps = 5;
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
                    <h2 className="adwizard-subtitle">Step 1: Select Animal Category</h2>
                    <p className="adwizard-description">
                        What type of animal are you looking to rehome?
                    </p>
                    <div className="adwizard-options">
                        {["dogs", "cats"].map((cat) => (
                            <button
                                key={cat}
                                className={`adwizard-option-button ${category === cat ? "selected" : ""}`}
                                onClick={() => {
                                    setCategory(cat);
                                    setStep(2);
                                }}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Breed or Type Selection */}
            {step === 2 && category && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">
                        Step 2: Select {category === "livestock" ? "Type" : "Breed"}
                    </h2>

                    {petBreedOptions[category] ? (
                        <div className="adwizard-select-container">
                            <Select
                                value={breedOrType ? { value: breedOrType, label: breedOrType } : null}
                                options={petBreedOptions[category].map(breed => ({
                                    value: breed,
                                    label: breed
                                }))}
                                placeholder={`Select ${category === "livestock" ? "type" : "breed"} or choose "Mixed/Unknown"`}
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
                            <label htmlFor="breedOrType">{`Enter ${category === "livestock" ? "Type" : "Breed"}`}</label>
                            <input
                                type="text"
                                id="breedOrType"
                                placeholder={`Enter ${category === "livestock" ? "type" : "breed"} or "Mixed/Unknown"`}
                                value={breedOrType}
                                onChange={(e) => setBreedOrType(e.target.value)}
                                className="adwizard-form-control"
                            />
                        </div>
                    )}

                    <div className="adwizard-summary-actions">
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={() => setStep(3)}
                            disabled={!breedOrType}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Rescue Details */}
            {step === 3 && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 3: Rescue Details</h2>

                    {/* Validation Summary */}
                    {Object.keys(fieldErrors).length > 0 && (
                        <div className="adwizard-validation-summary">
                            <h4>⚠️ Please fix the following issues:</h4>
                            <ul>
                                {Object.entries(fieldErrors).map(([field, error]) => (
                                    <li key={field}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (field !== 'images') {
                                                    const element = document.getElementById(field);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        element.focus();
                                                    }
                                                }
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#b83c56',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                padding: 0,
                                                font: 'inherit'
                                            }}
                                        >
                                            {error}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Standard pet fields first (non-rescue specific) */}
                    {formFields
                        .filter(f => !["adoptionFee", "availableDate", "vaccinated",
                            "microchipped", "specialNeeds", "goodWithCats", "goodWithDogs",
                            "goodWithChildren", "energyLevel", "behavioralNotes", "rescueStory",
                            "homeRequirements", "fosteringAvailable", "breed", "price"].includes(f))
                        .map(renderField)
                    }

                    {/* Rescue Details Section - all rescue-specific fields */}
                    <div className="adwizard-section" style={{ marginTop: '2rem' }}>
                        <h3 className="adwizard-section-title">Rescue Details</h3>

                        {/* Basic Information */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Basic Information</h4>
                            {formFields
                                .filter(f => ["availableDate", "adoptionFee"].includes(f))
                                .map(renderField)
                            }
                        </div>

                        {/* Health & Medical */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Health & Medical</h4>
                            {formFields
                                .filter(f => ["vaccinated", "microchipped", "specialNeeds"].includes(f))
                                .map(renderField)
                            }
                        </div>

                        {/* Behavior & Compatibility */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Behavior & Compatibility</h4>
                            {formFields
                                .filter(f => ["behavioralNotes", "goodWithCats", "goodWithDogs", "goodWithChildren", "energyLevel"].includes(f))
                                .map(renderField)
                            }
                        </div>

                        {/* Story & Home Requirements */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Story & Home Requirements</h4>
                            {formFields
                                .filter(f => ["rescueStory", "homeRequirements", "fosteringAvailable"].includes(f))
                                .map(renderField)
                            }
                        </div>
                    </div>

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

                    {/* Image Upload Section */}
                    <div className="adwizard-image-upload">
                        <h3>Upload Photos (Max 10)</h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            marginBottom: '12px',
                            fontStyle: 'italic'
                        }}>
                            Click on any uploaded image to set it as the main image for your listing.
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
                        {fieldErrors.images && (
                            <div className="adwizard-error-message">
                                {fieldErrors.images}
                            </div>
                        )}
                    </div>

                    <div className="adwizard-summary-actions">
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(2)}>
                            Back
                        </button>
                        <button
                            className="adwizard-btn adwizard-btn-primary"
                            onClick={handleContinueToStep4}
                        >
                            Continue to Review
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Review Listing */}
            {step === 4 && (
                <div className="adwizard-step">
                    <h2 className="adwizard-subtitle">Step 4: Review Your Rescue Listing</h2>

                    <ul className="adwizard-summary-list">
                        <li><strong>Category:</strong> {category.charAt(0).toUpperCase() + category.slice(1)}</li>
                        <li><strong>Intent:</strong> Rescue/Adoption</li>
                        <li><strong>{category === "livestock" ? "Type" : "Breed"}:</strong> {breedOrType}</li>

                        {/* Group fields by section for better review */}
                        <li><strong>--- Basic Information ---</strong></li>
                        {formFields
                            .filter(field => ["name", "age", "ageUnit", "sex", "adoptionFee", "availableDate"].includes(field) && formData[field] !== undefined && formData[field] !== "")
                            .map((field) => (
                                <li key={field}>
                                    <strong>{allFieldConfigurations[field]?.label || field}:</strong>{" "}
                                    {field === "adoptionFee" ? `£${formData[field]}` :
                                        typeof formData[field] === 'boolean' ? (formData[field] ? 'Yes' : 'No') :
                                            String(formData[field])}
                                </li>
                            ))}

                        <li><strong>--- Health & Medical ---</strong></li>
                        {formFields
                            .filter(field => ["vaccinated", "microchipped", "specialNeeds"].includes(field) && formData[field] !== undefined && formData[field] !== "")
                            .map((field) => (
                                <li key={field}>
                                    <strong>{allFieldConfigurations[field]?.label || field}:</strong>{" "}
                                    {typeof formData[field] === 'boolean' ? (formData[field] ? 'Yes' : 'No') : String(formData[field])}
                                </li>
                            ))}

                        <li><strong>--- Compatibility ---</strong></li>
                        {formFields
                            .filter(field => ["goodWithCats", "goodWithDogs", "goodWithChildren", "energyLevel"].includes(field) && formData[field] !== undefined && formData[field] !== "")
                            .map((field) => (
                                <li key={field}>
                                    <strong>{allFieldConfigurations[field]?.label || field}:</strong>{" "}
                                    {String(formData[field])}
                                </li>
                            ))}

                        {(formData.rescueStory || formData.homeRequirements) && (
                            <li><strong>--- Additional Information ---</strong></li>
                        )}
                        {formData.rescueStory && (
                            <li><strong>Rescue Story:</strong> {formData.rescueStory}</li>
                        )}
                        {formData.homeRequirements && (
                            <li><strong>Home Requirements:</strong> {formData.homeRequirements}</li>
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
                        <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(3)}>
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
                            ) : "Submit Rescue Listing"}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Submission Complete */}
            {step === 5 && (
                <div className="adwizard-step adwizard-submitted">
                    <h2 className="adwizard-subtitle">Rescue Listing Submitted</h2>
                    <p>
                        Your rescue listing has been sent for approval. We'll review it as soon as possible
                        and let you know once it's live. Thank you for helping find homes for animals in need!
                    </p>
                    <div className="adwizard-summary-actions">
                        <button
                            className="adwizard-btn adwizard-btn-outline"
                            onClick={handleStartOver}
                        >
                            Create Another Listing
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