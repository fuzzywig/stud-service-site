import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import SEO from "../components/SEO";
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

// Define optional checkboxes at component level to avoid redeclaration
const OPTIONAL_CHECKBOXES = [
    // 'withMother' removed - this should be required
    'vaccinated',
    'microchipped',
    'wormed',
    'fleaTreated',
    'neutered',
    'kcRegistered',
    'healthChecked'
];

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
    const studCategories = ["dogs", "cats", "horses"];
    const [mainImageIndex, setMainImageIndex] = useState(null);
    const [litterWithMotherIndex, setLitterWithMotherIndex] = useState(null);

    // Add state for field validation
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    // Function to calculate ready to leave date (8 weeks from date of birth)
    const calculateReadyToLeaveDate = (dob) => {
        console.log('🔧 calculateReadyToLeaveDate called with:', dob);
        if (!dob) {
            console.log('🔧 No dob provided, returning empty');
            return "";
        }

        try {
            const dobDate = new Date(dob);
            console.log('🔧 Parsed DOB:', dobDate);
            const readyToLeave = new Date(dobDate);
            readyToLeave.setDate(dobDate.getDate() + 56); // Add 56 days (8 weeks)
            console.log('🔧 Calculated ready date:', readyToLeave);

            // Format as YYYY-MM-DD for input[type="date"]
            const result = readyToLeave.toISOString().split('T')[0];
            console.log('🔧 Formatted result:', result);
            return result;
        } catch (error) {
            console.error('🔧 Error in calculateReadyToLeaveDate:', error);
            return "";
        }
    };

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

        // Reset litter with mother image if it was removed
        if (litterWithMotherIndex === idx) {
            setLitterWithMotherIndex(null);
        } else if (litterWithMotherIndex > idx) {
            // Adjust index if we removed an image before the litter with mother one
            setLitterWithMotherIndex(litterWithMotherIndex - 1);
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
            setLitterWithMotherIndex(null);
            setFieldErrors({});
        }
    };

    // SendGrid email function
    const sendAdvertSubmittedEmail = async (userData, advertData, user) => {
        try {
            console.log('📧 =================================');
            console.log('📧 STARTING USER EMAIL SEND');
            console.log('📧 userData:', userData);
            console.log('📧 advertData:', advertData);
            console.log('📧 user:', user);
            console.log('📧 =================================');

            // ✅ UPDATED: Include intent and conditional petName
            const emailPayload = {
                userEmail: userData.email,
                userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Pet Lover',
                title: advertData.title || `${advertData.breedOrType} ${advertData.intent === 'stud' ? 'Stud Service' : 'For Sale'}`,
                intent: advertData.intent,
                breedOrType: advertData.breedOrType

            };

            // ✅ Only include petName if it's a stud service
            if (advertData.intent === 'stud') {
                emailPayload.petName = advertData.name || advertData.breedOrType || 'Your Pet';
            }

            console.log('📧 SENDING TO URL: https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-submitted-email');
            console.log('📧 Updated email payload:', emailPayload);

            const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-submitted-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailPayload),
            });

            console.log('📧 Response status:', response.status);
            console.log('📧 Response ok:', response.ok);

            const result = await response.json();
            console.log('📧 Response body:', result);

            if (response.ok) {
                console.log('✅ USER EMAIL SENT SUCCESSFULLY:', result);
            } else {
                console.error('❌ USER EMAIL FAILED:', result);
            }
        } catch (error) {
            console.error('❌ USER EMAIL ERROR:', error);
        }
    };

    // Admin notification email function - Updated for your server
    const sendAdminAlert = async (advertData, userEmail, advertId) => {
        try {
            console.log('👮 =================================');
            console.log('👮 STARTING ADMIN ALERT EMAIL SEND');
            console.log('👮 advertData:', advertData);
            console.log('👮 userEmail:', userEmail);
            console.log('👮 advertId:', advertId);
            console.log('👮 =================================');

            // Get current user details
            const user = auth.currentUser;
            if (!user) {
                console.error('👮 No authenticated user found');
                return;
            }

            // Fetch user data from Firestore
            let userData = {};
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    userData = userSnap.data();
                }
            } catch (error) {
                console.error('👮 Error fetching user data:', error);
            }

            // Generate risk flags
            const riskFlags = getRiskFlags(advertData, userData);

            // ✅ Generate title if not provided - same logic as in your form
            const title = advertData.title || `${advertData.breedOrType} ${advertData.intent === 'stud' ? 'Stud Service' : 'For Sale'}`;

            const adminEmailPayload = {
                // Admin email configuration
                adminEmail: 'gavinoxley@gmail.com', // Your admin email

                // ✅ NEW: Quick Details fields (now required by server)
                advertId: advertId,
                userEmail: userEmail,
                userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Pet Lover',
                title: title,
                intent: advertData.intent, // Server will format this as "For Sale" or "For Stud"
                breedOrType: advertData.breedOrType,

                // User information (existing)
                userPhone: userData.phoneNumber || 'Not provided',
                userPostcode: userData.postcode || 'Not provided',
                userId: user.uid,

                // Advert information (existing)
                petName: advertData.name || advertData.breedOrType || 'Unknown',
                advertType: advertData.intent === 'stud' ? 'For Stud' : 'For Sale',
                categoryName: advertData.category.charAt(0).toUpperCase() + advertData.category.slice(1),
                price: advertData.price || advertData.fee || 'Not specified',
                description: advertData.description || 'No description provided',
                imageCount: advertData.images ? advertData.images.length : 0,

                // Additional details for admin review (existing)
                submissionDate: new Date().toLocaleString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),

                // Health and safety flags for admin attention (existing)
                healthTests: advertData.healthTests || [],
                kcRegistered: advertData.kcRegistered || false,
                vaccinated: advertData.vaccinated || false,
                microchipped: advertData.microchipped || false,
                withMother: advertData.withMother || false,

                // Age information (important for compliance) (existing)
                dateOfBirth: advertData.dob || 'Not provided',
                availableDate: advertData.availableDate || 'Not provided',

                // Location info (existing)
                postcode: advertData.postcode || 'Not available',

                // Quick action links for admin (updated URLs)
                adminPanelUrl: `https://mypetconnect.co.uk/admin/view-advert/${advertId}`, // ✅ Main admin review URL
                directApproveUrl: `https://mypetconnect.co.uk/admin/approve/${advertId}`,
                directRejectUrl: `https://mypetconnect.co.uk/admin/reject/${advertId}`,
                userProfileUrl: `https://mypetconnect.co.uk/profile/${user.uid}`,
                advertPreviewUrl: `https://mypetconnect.co.uk/advert-details/${advertId}`,

                // Risk assessment flags (existing)
                riskFlags: riskFlags,

                // Summary for quick admin decision (existing)
                quickSummary: `${advertData.category.toUpperCase()} | ${advertData.breedOrType} | ${advertData.intent.toUpperCase()} | £${advertData.price || advertData.fee || 'TBC'}`
            };

            console.log('👮 SENDING ADMIN ALERT TO URL: https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-admin-alert-email');
            console.log('👮 Admin email payload:', adminEmailPayload);
            console.log('👮 ✅ NEW FIELDS ADDED:', {
                title: title,
                intent: advertData.intent,
                breedOrType: advertData.breedOrType
            });

            const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-admin-alert-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminEmailPayload),
            });

            console.log('👮 Admin alert response status:', response.status);
            console.log('👮 Admin alert response ok:', response.ok);

            const result = await response.json();
            console.log('👮 Admin alert response body:', result);

            if (response.ok) {
                console.log('✅ ADMIN ALERT EMAIL SENT SUCCESSFULLY:', result);
            } else {
                console.error('❌ ADMIN ALERT EMAIL FAILED:', result);
                // Log the failure but don't block the user's submission
            }
        } catch (error) {
            console.error('❌ ADMIN ALERT EMAIL ERROR:', error);
            // Log the error but don't block the user's submission
        }
    };

// Helper function to identify potential risk flags for admin attention
    const getRiskFlags = (advertData, userData) => {
        const flags = [];

        // Age-related flags
        if (advertData.dob) {
            const dobDate = new Date(advertData.dob);
            const ageInWeeks = Math.floor((Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

            if (ageInWeeks < 8 && advertData.intent === 'sale') {
                flags.push('UNDER_8_WEEKS - Pet listed for sale before 8 weeks old');
            }

            if (ageInWeeks < 0) {
                flags.push('FUTURE_DOB - Date of birth is in the future');
            }
        }

        // Price-related flags
        const price = parseFloat(advertData.price || advertData.fee || 0);
        if (price > 5000) {
            flags.push('HIGH_PRICE - Price exceeds £5,000');
        }
        if (price < 50 && advertData.intent === 'sale' && ['dogs', 'cats'].includes(advertData.category)) {
            flags.push('SUSPICIOUSLY_LOW_PRICE - Very low price for dogs/cats');
        }

        // Health flags
        if (!advertData.vaccinated && advertData.intent === 'sale') {
            flags.push('UNVACCINATED - Pet not vaccinated');
        }

        // User flags
        if (!userData.phoneNumber) {
            flags.push('NO_PHONE - User has no phone number');
        }

        // Image flags
        if (!advertData.images || advertData.images.length === 0) {
            flags.push('NO_IMAGES - No images uploaded');
        }

        // Description flags
        if (!advertData.description || advertData.description.length < 20) {
            flags.push('POOR_DESCRIPTION - Very short or missing description');
        }

        return flags;
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

                // Set litter with mother image if available
                if (data.litterWithMotherIndex !== undefined) {
                    setLitterWithMotherIndex(data.litterWithMotherIndex);
                }

                // 6) Jump to the right step
                setStep(4);
            })();
        }
    }, [mode, adId]);

    // Auto-calculate availableDate when dob changes (for cats and dogs)
    useEffect(() => {
        if ((category === "dogs" || category === "cats") && formData.dob && !formData.availableDate) {
            console.log('🔄 useEffect: Auto-calculating availableDate from dob:', formData.dob);
            const calculatedDate = calculateReadyToLeaveDate(formData.dob);
            console.log('🔄 useEffect: Calculated date:', calculatedDate);

            if (calculatedDate) {
                console.log('🔄 useEffect: Updating availableDate to:', calculatedDate);
                setFormData(prev => ({
                    ...prev,
                    availableDate: calculatedDate
                }));
            }
        }
    }, [formData.dob, category]); // Only depend on dob and category

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [step]);

    // Validation function
    const validateFormFields = () => {
        const errors = {};

        // Get all fields that should be validated for current category/intent
        const fieldsToValidate = formFields.filter(f => f !== "breed");

        fieldsToValidate.forEach(fieldName => {
            const config = fieldConfigurations[fieldName];
            if (!config) return;

            // Skip validation for optional checkboxes
            if (config.type === 'checkbox' && OPTIONAL_CHECKBOXES.includes(fieldName)) {
                return;
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

    // Handle continue to step 5 with validation
    const handleContinueToStep5 = () => {
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
        setStep(5);
    };

    // Render form fields based on configuration with validation
    const renderField = (fieldName) => {
        console.log('🎨 renderField called for:', fieldName);

        const config = fieldConfigurations[fieldName];
        if (!config) {
            console.log('🎨 No config found for field:', fieldName);
            return null;
        }

        // Override required status for optional checkboxes
        const isRequired = config.required === true && !(config.type === 'checkbox' && OPTIONAL_CHECKBOXES.includes(fieldName));

        // Debug logging for checkboxes
        if (config.type === 'checkbox') {
            console.log(`🔍 Checkbox ${fieldName}: originally required=${config.required}, in optional list=${OPTIONAL_CHECKBOXES.includes(fieldName)}, final isRequired=${isRequired}`);
        }

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

        console.log('🎨 Field type for', fieldName, ':', config.type);
        console.log('🎨 Type check:', `"${config.type}" === "date"`, config.type === "date");

        switch (config.type) {
            case "text":
                console.log('🎨 Rendering text field for:', fieldName);
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
                            step={fieldName.toLowerCase().includes("price") ? "0.01" : "1"}
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
                const isDateOfBirth = fieldName === "dob";
                const isAvailableDate = fieldName === "availableDate";
                const isAutoCalculated = isAvailableDate && (category === "dogs" || category === "cats");

                // Format date for display in text field
                const formatDateForDisplay = (dateString) => {
                    if (!dateString) return "";
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                };
                return (
                    <div className={groupClasses} key={fieldName}>
                        <label htmlFor={fieldName}>
                            {config.label}
                            {isRequired && <span className="required-asterisk"> *</span>}
                            {isAutoCalculated && (
                                <span className="field-note"> (Auto-calculated from date of birth - UK law requires 8 weeks minimum)</span>
                            )}
                        </label>
                        <div className="adwizard-date-input-container">
                            {isAutoCalculated ? (
                                // Read-only text field for auto-calculated available date
                                <input
                                    type="text"
                                    id={fieldName}
                                    name={fieldName}
                                    value={formData.dob && formData.availableDate ? formatDateForDisplay(formData.availableDate) : ""}
                                    readOnly
                                    className={`${fieldClasses} auto-calculated-field`}
                                    placeholder="Will be calculated from date of birth"
                                />
                            ) : (
                                // Regular date picker for other date fields
                                <input
                                    type="date"
                                    id={fieldName}
                                    name={fieldName}
                                    value={formData[fieldName] || ""}
                                    onChange={(e) => {
                                        const newValue = e.target.value;

                                        setFormData((prev) => {
                                            const updated = {
                                                ...prev,
                                                [fieldName]: newValue
                                            };

                                            // Auto-calculate available date for cats and dogs
                                            if (isDateOfBirth && (category === "dogs" || category === "cats")) {
                                                const readyDate = calculateReadyToLeaveDate(newValue);
                                                if (readyDate) {
                                                    updated.availableDate = readyDate;
                                                }
                                            }

                                            return updated;
                                        });

                                        if (fieldErrors?.[fieldName]) {
                                            setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
                                        }
                                    }}
                                    className={fieldClasses}
                                    placeholder={`Select ${config.label.toLowerCase()}`}
                                    required={isRequired}
                                />
                            )}
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
                console.log('🚨 DEFAULT case hit for field:', fieldName, 'with type:', config.type);
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

        // Final validation before submission
        const validationErrors = validateFormFields();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            alert("Please fix all required fields before submitting.");
            setStep(4); // Go back to form
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
                mainImageIndex, // Store the main image index
                litterWithMotherIndex // Store the litter with mother image index
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
            let userData = null; // Store userData for email use later
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    userData = userSnap.data();
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
            let docRef;
            if (mode === "create") {
                docRef = await addDoc(collection(db, "allListings"), advertData);

                // 🚨 Send admin alert for new ads
                if (userData && userData.email) {
                    try {
                        await sendAdminAlert(advertData, userData.email, docRef.id);
                    } catch (adminEmailError) {
                        console.error('Failed to send admin alert:', adminEmailError);
                        // Don't block the submission if admin email fails
                    }
                }

                // Send creation confirmation email using SendGrid template
                if (userData && userData.email) {
                    try {
                        await sendAdvertSubmittedEmail(userData, advertData, user);
                    } catch (emailError) {
                        console.error('Failed to send creation email:', emailError);
                    }
                }
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

    // Check if we should show the "with mum" option - only for sale intent
    const shouldShowWithMumOption = intent === "sale" && (category === "dogs" || category === "cats");

    return (
        <>
            <SEO
                title="Create Your Pet Advert – Ad Wizard | My Pet Connect"
                description="Effortlessly craft and publish new pet listings with our Ad Wizard. Add photos, set pricing, and reach local buyers for stud services, puppies, kittens, and more in minutes."
            />

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
                                Upload your images, then use the buttons below each image to:
                                <br />• Click the <strong>⭐ star</strong> to set the main image (thumbnail)
                                {shouldShowWithMumOption && (
                                    <span><br />• Click the <strong>👩‍👧‍👦 family icon</strong> to mark an image showing the litter with mum</span>
                                )}
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
                                            className={`adwizard-preview-item ${mainImageIndex === idx ? 'main-image' : ''} ${litterWithMotherIndex === idx ? 'litter-with-mother' : ''}`}
                                        >
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                className="remove-btn"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleImageRemove(idx);
                                                }}
                                                title="Remove image"
                                            >✕</button>

                                            {/* Image preview */}
                                            <img src={img.url} alt={`preview-${idx}`} />

                                            {/* Image controls - always visible */}
                                            <div className="image-controls" style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                left: '8px',
                                                right: '8px',
                                                display: 'flex',
                                                gap: '8px',
                                                justifyContent: 'center'
                                            }}>
                                                {/* Main image button */}
                                                <button
                                                    type="button"
                                                    className="control-btn"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setMainImageIndex(idx);
                                                    }}
                                                    title="Set as main image"
                                                    style={{
                                                        background: mainImageIndex === idx ? '#b83c56' : 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '6px 8px',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    ⭐ {mainImageIndex === idx ? 'Main' : 'Set Main'}
                                                </button>

                                                {/* Litter with mum button (only for dogs/cats and sale intent) */}
                                                {shouldShowWithMumOption && (
                                                    <button
                                                        type="button"
                                                        className="control-btn"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setLitterWithMotherIndex(litterWithMotherIndex === idx ? null : idx);
                                                        }}
                                                        title="Mark as litter with mum"
                                                        style={{
                                                            background: litterWithMotherIndex === idx ? '#10b981' : 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '6px 8px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}
                                                    >
                                                        👩‍👧‍👦 {litterWithMotherIndex === idx ? 'With Mum' : 'Set Mum'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Status indicators at top */}
                                            {(mainImageIndex === idx || litterWithMotherIndex === idx) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px'
                                                }}>
                                                    {mainImageIndex === idx && (
                                                        <span style={{
                                                            background: '#b83c56',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}>★</span>
                                                    )}
                                                    {litterWithMotherIndex === idx && (
                                                        <span style={{
                                                            background: '#10b981',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}>👩‍👧‍👦</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Additional guidance for dogs/cats sales only */}
                            {shouldShowWithMumOption && images.length > 0 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: '#f0f9ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    color: '#1e40af'
                                }}>
                                    <strong>💡 Tip:</strong> Including a photo of the litter with their mum helps build trust with potential buyers and shows responsible breeding practices.
                                </div>
                            )}

                            {fieldErrors.images && (
                                <div className="adwizard-error-message">
                                    {fieldErrors.images}
                                </div>
                            )}
                        </div>

                        <div className="adwizard-summary-actions">
                            <button className="adwizard-btn adwizard-btn-outline" onClick={() => setStep(3)}>
                                Back
                            </button>
                            <button
                                className="adwizard-btn adwizard-btn-primary"
                                onClick={handleContinueToStep5}
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
                                                    border: idx === mainImageIndex ? '3px solid #b83c56' :
                                                        idx === litterWithMotherIndex ? '3px solid #10b981' :
                                                            '1px solid #edf2f7'
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
                                            {idx === litterWithMotherIndex && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}>👩‍👧‍👦</span>
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
        </>
    );
}