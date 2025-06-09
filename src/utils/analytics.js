// utils/analytics.js
import ReactGA from 'react-ga4';

console.log('Analytics file loaded');

// Your actual GA4 Measurement ID
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
    try {
        if (!hasAnalyticsConsent()) {
            console.log('GA4 not initialized - no consent');
            return false;
        }

        // Use gtag if available, otherwise ReactGA
        if (window.gtag) {
            console.log('Using gtag for GA4 initialization');
            window.gtag('config', GA_MEASUREMENT_ID, {
                send_page_view: true,
                anonymize_ip: true
            });
        } else {
            console.log('Using ReactGA for GA4 initialization');
            ReactGA.initialize(GA_MEASUREMENT_ID, {
                gtagOptions: {
                    anonymize_ip: true
                }
            });
        }

        console.log('GA4 initialized successfully');
        return true;
    } catch (error) {
        console.error('GA4 initialization failed:', error);
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

        // Use gtag if available, otherwise ReactGA
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: title || document.title,
                page_location: window.location.href,
                page_path: path
            });
        } else {
            ReactGA.send({
                hitType: "pageview",
                page: path,
                title: title || document.title
            });
        }

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