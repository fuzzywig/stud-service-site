import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO component to inject meta tags into document head
 * @param {string} title - Page title (will be appended with site name)
 * @param {string} description - Meta description for the page
 * @param {string} [lang] - HTML lang attribute (defaults to 'en')
 */
export default function SEO({ title, description, lang = 'en' }) {
    const siteName = 'My Pet Connect';
    const fullTitle = `${title} | ${siteName}`;

    return (
        <Helmet htmlAttributes={{ lang }}>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {/* Open Graph tags */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content={lang} />
            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
}

SEO.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    lang: PropTypes.string,
};
