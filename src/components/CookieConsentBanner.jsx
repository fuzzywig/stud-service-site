import React, { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import "./CookieConsentBanner.css"

const CookieConsentBanner = ({ showBanner, setShowBanner }) => {
    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
    });

    const [showDetails, setShowDetails] = React.useState(false);


    useEffect(() => {
        const consentData = localStorage.getItem('cookieConsent');
        if (!consentData) {
            setShowBanner(true);
        } else {
            try {
                const savedPreferences = JSON.parse(consentData);
                setPreferences(savedPreferences);
            } catch (e) {
                setShowBanner(true);
            }
        }
    }, [setShowBanner]);

    if (!showBanner) return null;


    const handleAcceptAll = () => {
        const allAccepted = {
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
        setShowBanner(false);
        // Trigger any analytics/marketing scripts here
        loadConsentedScripts(allAccepted);
    };

    const handleAcceptSelected = () => {
        const consentData = {
            ...preferences,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        setShowBanner(false);
        // Trigger only consented scripts
        loadConsentedScripts(consentData);
    };

    const handleRejectAll = () => {
        const rejected = {
            necessary: true, // Necessary cookies can't be rejected
            analytics: false,
            marketing: false,
            functional: false,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('cookieConsent', JSON.stringify(rejected));
        setShowBanner(false);
    };

    const loadConsentedScripts = (consent) => {
        // This is where you would initialize your analytics, marketing tools, etc.
        if (consent.analytics) {
            // Initialize Google Analytics, etc.
            console.log('Analytics cookies enabled');
        }
        if (consent.marketing) {
            // Initialize marketing tools
            console.log('Marketing cookies enabled');
        }
        if (consent.functional) {
            // Initialize functional cookies
            console.log('Functional cookies enabled');
        }
    };

    const togglePreference = (type) => {
        if (type === 'necessary') return; // Can't toggle necessary cookies
        setPreferences(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    if (!showBanner) return null;

    return (
        <>
            <div className="cookie-consent-overlay" />
            <div className="cookie-consent-container">
                <div className="cookie-consent-content">
                    <div className="cookie-consent-header">
                        <div className="cookie-consent-title-wrapper">
                            <Cookie className="cookie-consent-icon" />
                            <h2 className="cookie-consent-title">Cookie Consent</h2>
                        </div>
                        <button
                            onClick={handleRejectAll}
                            className="cookie-consent-close"
                            aria-label="Close cookie banner"
                        >
                            <X className="cookie-consent-close-icon" />
                        </button>
                    </div>

                    <p className="cookie-consent-description">
                        We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                        By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                        <a href="/privacy-policy" className="cookie-consent-link">Privacy Policy</a> to learn more.
                    </p>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="cookie-consent-toggle-details"
                    >
                        Cookie Settings
                        {showDetails ? (
                            <ChevronUp className="cookie-consent-toggle-icon" />
                        ) : (
                            <ChevronDown className="cookie-consent-toggle-icon" />
                        )}
                    </button>

                    {showDetails && (
                        <div className="cookie-consent-details">
                            <div className="cookie-consent-category">
                                <div className="cookie-consent-category-header">
                                    <div className="cookie-consent-category-title">
                                        Necessary Cookies
                                        <span className="cookie-consent-category-badge">Always Active</span>
                                    </div>
                                    <div
                                        className="cookie-consent-toggle cookie-consent-toggle-active cookie-consent-toggle-disabled"
                                    >
                                        <div className="cookie-consent-toggle-slider" />
                                    </div>
                                </div>
                                <p className="cookie-consent-category-description">
                                    These cookies are essential for the website to function properly. They enable basic functions like page navigation and access to secure areas.
                                </p>
                            </div>

                            <div className="cookie-consent-category">
                                <div className="cookie-consent-category-header">
                                    <div className="cookie-consent-category-title">
                                        Analytics Cookies
                                    </div>
                                    <div
                                        className={`cookie-consent-toggle ${preferences.analytics ? 'cookie-consent-toggle-active' : ''}`}
                                        onClick={() => togglePreference('analytics')}
                                    >
                                        <div className="cookie-consent-toggle-slider" />
                                    </div>
                                </div>
                                <p className="cookie-consent-category-description">
                                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                                </p>
                            </div>

                            <div className="cookie-consent-category">
                                <div className="cookie-consent-category-header">
                                    <div className="cookie-consent-category-title">
                                        Marketing Cookies
                                    </div>
                                    <div
                                        className={`cookie-consent-toggle ${preferences.marketing ? 'cookie-consent-toggle-active' : ''}`}
                                        onClick={() => togglePreference('marketing')}
                                    >
                                        <div className="cookie-consent-toggle-slider" />
                                    </div>
                                </div>
                                <p className="cookie-consent-category-description">
                                    These cookies are used to track visitors across websites to display ads that are relevant and engaging for individual users.
                                </p>
                            </div>

                            <div className="cookie-consent-category">
                                <div className="cookie-consent-category-header">
                                    <div className="cookie-consent-category-title">
                                        Functional Cookies
                                    </div>
                                    <div
                                        className={`cookie-consent-toggle ${preferences.functional ? 'cookie-consent-toggle-active' : ''}`}
                                        onClick={() => togglePreference('functional')}
                                    >
                                        <div className="cookie-consent-toggle-slider" />
                                    </div>
                                </div>
                                <p className="cookie-consent-category-description">
                                    These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="cookie-consent-actions">
                        <button
                            onClick={handleRejectAll}
                            className="cookie-consent-button cookie-consent-button-reject"
                        >
                            Reject All
                        </button>
                        <button
                            onClick={handleAcceptSelected}
                            className="cookie-consent-button cookie-consent-button-secondary"
                        >
                            Accept Selected
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="cookie-consent-button cookie-consent-button-primary"
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CookieConsentBanner;