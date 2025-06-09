// components/CookieSettings.js
import React, { useState, useEffect } from 'react';
import { Cookie, Save, RotateCcw } from 'lucide-react';
import { initGA, trackPageView } from '../utils/analytics';

function CookieSettings() {
    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Load existing preferences
        const cookiePreferences = localStorage.getItem('cookiePreferences');
        if (cookiePreferences) {
            const parsed = JSON.parse(cookiePreferences);
            setPreferences(parsed);
        }
    }, []);

    const handlePreferenceChange = (type) => {
        if (type === 'necessary') return; // Can't change necessary cookies

        setPreferences(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleSave = () => {
        const finalPreferences = { ...preferences, necessary: true };

        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('cookiePreferences', JSON.stringify(finalPreferences));

        // Initialize/reinitialize GA4 based on new preferences
        if (finalPreferences.analytics) {
            initGA();
            trackPageView(window.location.pathname, document.title);
        }

        // Dispatch event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { consent: 'custom', preferences: finalPreferences }
        }));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        localStorage.removeItem('cookieConsent');
        localStorage.removeItem('cookiePreferences');
        setPreferences({
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
        });

        // Reload page to show cookie banner again
        window.location.reload();
    };

    return (
        <div className="cookie-settings">
            <div className="cookie-settings-header">
                <Cookie className="cookie-settings-icon" />
                <h3>Cookie Settings</h3>
            </div>

            <p className="cookie-settings-description">
                Manage your cookie preferences below. Changes will take effect immediately.
            </p>

            <div className="cookie-settings-categories">
                <div className="cookie-category">
                    <div className="cookie-category-header">
                        <div>
                            <h4>Necessary Cookies</h4>
                            <p>Essential for basic site functionality and security</p>
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
                    <div className="cookie-category-details">
                        <small>These cookies are required for the website to function and cannot be switched off.</small>
                    </div>
                </div>

                <div className="cookie-category">
                    <div className="cookie-category-header">
                        <div>
                            <h4>Analytics Cookies</h4>
                            <p>Help us understand how visitors interact with our website</p>
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
                    <div className="cookie-category-details">
                        <small>
                            Used for Google Analytics to collect anonymous data about page visits,
                            popular content, and site usage patterns.
                        </small>
                    </div>
                </div>

                <div className="cookie-category">
                    <div className="cookie-category-header">
                        <div>
                            <h4>Functional Cookies</h4>
                            <p>Remember your preferences and enhance functionality</p>
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
                    <div className="cookie-category-details">
                        <small>
                            These cookies remember your settings and preferences to provide
                            a more personalized experience.
                        </small>
                    </div>
                </div>

                <div className="cookie-category">
                    <div className="cookie-category-header">
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
                    <div className="cookie-category-details">
                        <small>
                            These cookies may be set by advertising partners to build a profile
                            of your interests and show relevant ads.
                        </small>
                    </div>
                </div>
            </div>

            <div className="cookie-settings-actions">
                <button
                    onClick={handleSave}
                    className={`cookie-settings-btn save ${saved ? 'saved' : ''}`}
                >
                    <Save size={16} />
                    {saved ? 'Saved!' : 'Save Preferences'}
                </button>

                <button
                    onClick={handleReset}
                    className="cookie-settings-btn reset"
                >
                    <RotateCcw size={16} />
                    Reset & Show Banner
                </button>
            </div>
        </div>
    );
}

export default CookieSettings;