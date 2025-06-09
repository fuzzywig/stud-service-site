import React from 'react';
import { initGA, trackPageView } from '../utils/analytics';

function CookieConsentBanner({ showBanner, setShowBanner }) {
    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setShowBanner(false);

        // Initialize GA4
        initGA();
        trackPageView(window.location.pathname, document.title);
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            padding: '20px',
            zIndex: 1000
        }}>
            <p>We use cookies to improve your experience. Do you accept cookies?</p>
            <div>
                <button
                    onClick={handleAccept}
                    style={{ marginRight: '10px', background: 'green', color: 'white', padding: '10px' }}
                >
                    Accept
                </button>
                <button
                    onClick={handleDecline}
                    style={{ background: 'gray', color: 'white', padding: '10px' }}
                >
                    Decline
                </button>
            </div>
        </div>
    );
}

export default CookieConsentBanner;