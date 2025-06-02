import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cookie, Mail, Info } from 'lucide-react';
import './CookiePolicyPage.css'
const CookiePolicyPage = () => {
    const [expandedSections, setExpandedSections] = useState({});
    const lastUpdated = new Date().toLocaleDateString("en-GB", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const sections = [
        {
            id: 'what-are-cookies',
            title: '1. WHAT ARE COOKIES?',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">Cookies are small text files placed on your device when you visit a website. They help the site function properly, enhance your experience, and provide insights into how the site is used.</p>
                    </div>

                    <p className="cookie-policy-text">When you visit our website, we may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences, or your device and is mostly used to make the site work as you expect it to.</p>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">How Cookies Work</p>
                        <p className="cookie-policy-text">Cookies are created when your browser loads a particular website. The website sends information to the browser which then creates a text file. Every time the user goes back to the same website, the browser retrieves and sends this file to the website's server.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'types-of-cookies',
            title: '2. TYPES OF COOKIES WE USE',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">We use different types of cookies for various purposes to improve your experience on our website.</p>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Necessary Cookies</p>
                        <div className="cookie-policy-highlight-box cookie-policy-highlight-necessary">
                            <p className="cookie-policy-text">These cookies are essential for basic functionality such as page navigation and secure login. Our site cannot function properly without them.</p>
                            <p className="cookie-policy-badge">Always Active</p>
                        </div>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Analytics Cookies</p>
                        <div className="cookie-policy-highlight-box">
                            <p className="cookie-policy-text">These cookies help us understand how visitors interact with the site by collecting anonymous data. For example, we may use Google Analytics to monitor traffic and usage patterns.</p>
                            <ul className="cookie-policy-list">
                                <li>Page views and navigation paths</li>
                                <li>Time spent on pages</li>
                                <li>Browser and device information</li>
                                <li>Geographic location (country level)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Marketing Cookies</p>
                        <div className="cookie-policy-highlight-box">
                            <p className="cookie-policy-text">These cookies are used to deliver personalised adverts and measure the effectiveness of advertising campaigns. They may be set by us or third-party providers whose services we have added to our pages.</p>
                        </div>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Functional Cookies</p>
                        <div className="cookie-policy-highlight-box">
                            <p className="cookie-policy-text">These cookies enable enhanced functionality and personalisation, such as:</p>
                            <ul className="cookie-policy-list">
                                <li>Remembering your preferences and settings</li>
                                <li>Remembering login details</li>
                                <li>Providing enhanced, more personal features</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'cookie-control',
            title: '3. HOW YOU CAN CONTROL COOKIES',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">You have the right to decide whether to accept or reject cookies (except necessary cookies).</p>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Cookie Banner</p>
                        <p className="cookie-policy-text">When you first visit our site, you can choose which cookies you'd like to accept via our cookie banner. You can change your preferences at any time by clearing your browser cookies and revisiting our site.</p>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Browser Settings</p>
                        <p className="cookie-policy-text">Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may impact your overall user experience.</p>
                        <ul className="cookie-policy-list">
                            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                            <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
                        </ul>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Opt-out Links</p>
                        <p className="cookie-policy-text">You can opt out of being tracked by Google Analytics across all websites by visiting: <a href="https://tools.google.com/dlpage/gaoptout" className="cookie-policy-link" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a></p>
                    </div>
                </div>
            )
        },
        {
            id: 'third-party-cookies',
            title: '4. THIRD-PARTY COOKIES',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service and deliver advertisements.</p>
                    </div>

                    <p className="cookie-policy-text">We may use third-party services that set their own cookies, including:</p>

                    <ul className="cookie-policy-bullet-list">
                        <li>
                            <span className="cookie-policy-bullet">•</span>
                            <span className="cookie-policy-bullet-text"><strong>Google Analytics</strong> - For website analytics and performance monitoring</span>
                        </li>
                        <li>
                            <span className="cookie-policy-bullet">•</span>
                            <span className="cookie-policy-bullet-text"><strong>Google Maps</strong> - For location services and map functionality</span>
                        </li>
                        <li>
                            <span className="cookie-policy-bullet">•</span>
                            <span className="cookie-policy-bullet-text"><strong>Social Media Platforms</strong> - For social sharing features</span>
                        </li>
                    </ul>

                    <p className="cookie-policy-text">These providers have their own privacy policies which you should review. We do not control these third-party cookies and they are not covered by our Cookie Policy.</p>
                </div>
            )
        },
        {
            id: 'cookie-duration',
            title: '5. HOW LONG DO COOKIES LAST?',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">Cookie duration depends on the type of cookie and can be either session or persistent cookies.</p>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Session Cookies</p>
                        <p className="cookie-policy-text">These are temporary cookies that remain in your browser until you close it. They are then automatically deleted.</p>
                    </div>

                    <div className="cookie-policy-subsection">
                        <p className="cookie-policy-subsection-title">Persistent Cookies</p>
                        <p className="cookie-policy-text">These cookies remain in your browser for a set period of time specified in the cookie. They are activated each time you visit the website that created that particular cookie.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'changes-to-policy',
            title: '6. CHANGES TO THIS POLICY',
            content: (
                <div className="cookie-policy-section-content">
                    <div className="cookie-policy-info-box">
                        <p className="cookie-policy-info-subtitle">We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons.</p>
                    </div>

                    <p className="cookie-policy-text">When we make changes to this Cookie Policy, we will update the "Last updated" date at the top of this policy. We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.</p>

                    <p className="cookie-policy-text">If we make material changes to this policy, we may notify you through our website or by other means to give you the opportunity to review the changes before they become effective.</p>
                </div>
            )
        },
        {
            id: 'contact-us',
            title: '7. CONTACT US',
            content: (
                <div className="cookie-policy-section-content">
                    <p className="cookie-policy-text">If you have any questions about this Cookie Policy or our use of cookies, you can contact us:</p>

                    <div className="cookie-policy-contact-info">
                        <div className="cookie-policy-contact-item">
                            <Mail className="cookie-policy-contact-icon" />
                            <div>
                                <p className="cookie-policy-contact-label">Email:</p>
                                <a href="mailto:support@mypetconnect.co.uk" className="cookie-policy-link">support@mypetconnect.co.uk</a>
                            </div>
                        </div>
                    </div>

                    <div className="cookie-policy-highlight-box">
                        <p className="cookie-policy-text">You can also manage your cookie preferences at any time by clicking the cookie settings button in the footer of our website.</p>
                    </div>
                </div>
            )
        }
    ];

    return (
        <>


            <div className="cookie-policy-container">
                {/* Header */}
                <div className="cookie-policy-header">
                    <div className="cookie-policy-header-content">
                        <div className="cookie-policy-header-title-wrapper">
                            <Cookie className="cookie-policy-header-icon" />
                            <h1 className="cookie-policy-header-title">COOKIE POLICY</h1>
                        </div>
                        <div className="cookie-policy-header-date">
                            Last updated: {lastUpdated}
                        </div>
                    </div>
                </div>

                {/* Introduction */}
                <div className="cookie-policy-main-content">
                    <div className="cookie-policy-intro-card">
                        <p className="cookie-policy-intro-text">
                            This Cookie Policy explains how <strong>MyPetConnect.co.uk</strong> ("we", "us", or "our") uses cookies and similar technologies when you visit our website. By using our website, you consent to the use of cookies in accordance with this policy.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="cookie-policy-summary-card">
                        <h2 className="cookie-policy-summary-title">
                            <Info className="cookie-policy-summary-icon" />
                            KEY INFORMATION
                        </h2>

                        <div className="cookie-policy-summary-items">
                            <div className="cookie-policy-summary-item">
                                <p><strong>What are cookies?</strong> Small text files that websites place on your device to store information.</p>
                            </div>
                            <div className="cookie-policy-summary-item">
                                <p><strong>Why do we use them?</strong> To improve your experience, analyze site usage, and deliver relevant content.</p>
                            </div>
                            <div className="cookie-policy-summary-item">
                                <p><strong>Your control:</strong> You can manage cookie preferences through our cookie banner or your browser settings.</p>
                            </div>
                            <div className="cookie-policy-summary-item">
                                <p><strong>Essential cookies:</strong> Some cookies are necessary for the site to function and cannot be disabled.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="cookie-policy-sections">
                        {sections.map((section) => (
                            <div key={section.id} id={section.id} className="cookie-policy-section-card">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="cookie-policy-section-header"
                                >
                                    <h2 className="cookie-policy-section-title">{section.title}</h2>
                                    {expandedSections[section.id] ? (
                                        <ChevronUp className="cookie-policy-section-icon" />
                                    ) : (
                                        <ChevronDown className="cookie-policy-section-icon" />
                                    )}
                                </button>
                                {expandedSections[section.id] && (
                                    <div className="cookie-policy-section-content-wrapper">
                                        <div className="cookie-policy-section-divider"></div>
                                        {section.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CookiePolicyPage;