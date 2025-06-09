// utils/analytics.js
import ReactGA from 'react-ga4';

console.log('Analytics file loaded');

// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-N966Z6R5QJ';

// Check if user has consented to analytics
const hasAnalyticsConsent = () => {
    try {
        const consent = localStorage.getItem('cookieConsent');

        console.log('Cookie consent:', consent);

        // Handle simple 'accepted' string
        if (consent === 'accepted') return true;

        // Handle JSON object with detailed preferences
        if (consent && consent !== 'declined') {
            try {
                const parsedConsent = JSON.parse(consent);
                return parsedConsent.analytics === true;
            } catch {
                // If it's not JSON, check if it's just 'accepted'
                return consent === 'accepted';
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking consent:', error);
        return false;
    }
};

// Initialize GA4 - safe version
export const initGA = () => {
    console.log('initGA called');

    // Always initialize the script for detection
    ReactGA.initialize(GA_MEASUREMENT_ID, {
        gtagOptions: {
            send_page_view: false, // Disable automatic tracking
            anonymize_ip: true
        }
    });

    // Only enable tracking if consent given
    if (hasAnalyticsConsent()) {
        console.log('GA4 tracking enabled with consent');
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
        return true;
    } else {
        console.log('GA4 loaded but tracking disabled - no consent');
        return false;
    }
};

// Track page views - safe version
export const trackPageView = (path, title) => {
    console.log('trackPageView called:', path, title);
    try {
        if (!hasAnalyticsConsent()) {
            console.log('Page tracking skipped - no consent');
            return;
        }

        ReactGA.send({
            hitType: "pageview",
            page: path,
            title: title || document.title
        });
        console.log('Page view tracked');
    } catch (error) {
        console.error('GA4 page tracking failed:', error);
    }
};

// Track events - safe version
export const trackEvent = (action, category, label, value) => {
    console.log('trackEvent called:', action, category, label, value);
    try {
        if (!hasAnalyticsConsent()) {
            return;
        }

        ReactGA.event({
            action: action,
            category: category,
            label: label,
            value: value,
        });
    } catch (error) {
        console.error('GA4 event tracking failed:', error);
    }
};