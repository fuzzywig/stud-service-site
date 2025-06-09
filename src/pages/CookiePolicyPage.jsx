// components/CookieConsentBanner.js
import React, { useState } from 'react';
import { initGA, trackPageView } from '../utils/analytics';
import { Cookie, Settings, ChevronDown, ChevronUp } from 'lucide-react';

function CookieConsentBanner({ showBanner, setShowBanner }) {
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        necessary: true, // Always true, can't be disabled
        analytics: true,
        marketing: false,
        functional: true
    });

    const handleAcceptAll = () => {
        const allAccepted = {
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true
        };

        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
        setShowBanner(false);

        // Initialize GA4 since analytics are accepted
        initGA();
        trackPageView(window.location.pathname, document.title);

        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { consent: 'accepted', preferences: allAccepted }
        }));
    };

    const handleSavePreferences = () => {
        const finalPreferences = { ...preferences, necessary: true };

        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('cookiePreferences', JSON.stringify(finalPreferences));
        setShowBanner(false);

        // Initialize GA4 only if analytics are accepted
        if (finalPreferences.analytics) {
            initGA();
            trackPageView(window.location.pathname, document.title);
        }

        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { consent: 'custom', preferences: finalPreferences }
        }));
    };

    const handleDeclineAll = () => {
        const declined = {
            necessary: true, // Can't disable necessary cookies
            analytics: false,
            marketing: false,
            functional: false
        };

        localStorage.setItem('cookieConsent', 'declined');
        localStorage.setItem('cookiePreferences', JSON.stringify(declined));
        setShowBanner(false);

        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { consent: 'declined', preferences: declined }
        }));
    };

    const handlePreferenceChange = (type) => {
        if (type === 'necessary') return; // Can't change necessary cookies

        setPreferences(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    if (!showBanner) return null;

    return (
        <div className="cookie-consent-banner">
            <div className="cookie-banner-content">
                <div className="cookie-banner-header">
                    <Cookie className="cookie-banner-icon" />
                    <h3 className="cookie-banner-title">Cookie Preferences</h3>
                </div>

                <p className="cookie-banner-description">
                    We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                    You can choose which cookies you're comfortable with.
                </p>

                {showSettings && (
                    <div className="cookie-settings-panel">
                        <div className="cookie-preference-item">
                            <div className="cookie-preference-header">
                                <div>
                                    <h4>Necessary Cookies</h4>
                                    <p>Essential for basic site functionality</p>
                                </div>
                                <label className="cookie-toggle">
                                    <input
                                        type="checkbox"
                                        checked={true}
                                        disabled
                                    />
                                    <span className="cookie-toggle-slider disabled"></span>
                                </label>
                            </div>
                        </div>

                        <div className="cookie-preference-item">
                            <div className="cookie-preference-header">
                                <div>
                                    <h4>Analytics Cookies</h4>
                                    <p>Help us understand how you use our site (Google Analytics)</p>
                                </div>
                                <label className="cookie-toggle">
                                    <input
                                        type="checkbox"
                                        checked={preferences.analytics}
                                        onChange={() => handlePreferenceChange('analytics')}
                                    />
                                    <span className="cookie-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="cookie-preference-item">
                            <div className="cookie-preference-header">
                                <div>
                                    <h4>Functional Cookies</h4>
                                    <p>Remember your preferences and settings</p>
                                </div>
                                <label className="cookie-toggle">
                                    <input
                                        type="checkbox"
                                        checked={preferences.functional}
                                        onChange={() => handlePreferenceChange('functional')}
                                    />
                                    <span className="cookie-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="cookie-preference-item">
                            <div className="cookie-preference-header">
                                <div>
                                    <h4>Marketing Cookies</h4>
                                    <p>Used for targeted advertising and social media features</p>
                                </div>
                                <label className="cookie-toggle">
                                    <input
                                        type="checkbox"
                                        checked={preferences.marketing}
                                        onChange={() => handlePreferenceChange('marketing')}
                                    />
                                    <span className="cookie-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="cookie-banner-actions">
                    <div className="cookie-banner-buttons">
                        <button
                            onClick={handleDeclineAll}
                            className="cookie-btn cookie-btn-decline"
                        >
                            Decline All
                        </button>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="cookie-btn cookie-btn-settings"
                        >
                            <Settings size={16} />
                            Customize
                            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showSettings ? (
                            <button
                                onClick={handleSavePreferences}
                                className="cookie-btn cookie-btn-save"
                            >
                                Save Preferences
                            </button>
                        ) : (
                            <button
                                onClick={handleAcceptAll}
                                className="cookie-btn cookie-btn-accept"
                            >
                                Accept All
                            </button>
                        )}
                    </div>

                    <a href="/cookie-policy" className="cookie-policy-link">
                        Read our Cookie Policy
                    </a>
                </div>
            </div>
        </div>
    );
}

export default CookieConsentBanner;