import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Mail, MapPin, Phone, Calendar, Info } from 'lucide-react';
import { Helmet } from "react-helmet-async";
import './PrivacyPolicyPage.css'
const PrivacyPolicyPage = () => {
    const [expandedSections, setExpandedSections] = useState({});
    const lastUpdated = "May 29, 2025";

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const sections = [
        {
            id: 'info-collect',
            title: '1. WHAT INFORMATION DO WE COLLECT?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-title">Personal information you disclose to us</p>
                        <p className="privacy-info-subtitle">In Short: We collect personal information that you provide to us.</p>
                    </div>

                    <p className="privacy-text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">Personal Information Provided by You:</p>
                        <ul className="privacy-list">
                            <li>Names</li>
                            <li>Phone numbers</li>
                            <li>Email addresses</li>
                            <li>Mailing addresses</li>
                            <li>Usernames</li>
                            <li>Passwords</li>
                            <li>Contact preferences</li>
                            <li>Contact or authentication data</li>
                            <li>Billing addresses</li>
                            <li>Debit/credit card numbers</li>
                        </ul>
                    </div>

                    <div className="privacy-highlight-box">
                        <p className="privacy-highlight-title">Sensitive Information</p>
                        <p className="privacy-text">We do not process sensitive information.</p>
                    </div>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">Google API</p>
                        <p className="privacy-text">Our use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'info-use',
            title: '2. HOW DO WE PROCESS YOUR INFORMATION?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes only with your prior explicit consent.</p>
                    </div>

                    <p className="privacy-subsection-title">We process your personal information for a variety of reasons, including:</p>

                    <ul className="privacy-bullet-list">
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To facilitate account creation and authentication</strong> and otherwise manage user accounts</span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To deliver and facilitate delivery of services</strong> to the user</span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To respond to user inquiries</strong> and offer support to users</span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To send administrative information</strong> to you</span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To enable user-to-user communications</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To request feedback</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To send marketing and promotional communications</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To deliver targeted advertising</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To protect our Services</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To identify usage trends</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To determine effectiveness of marketing campaigns</strong></span>
                        </li>
                        <li>
                            <span className="privacy-bullet">•</span>
                            <span className="privacy-bullet-text"><strong>To save or protect an individual's vital interest</strong></span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'legal-bases',
            title: '3. WHAT LEGAL BASES DO WE RELY ON?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law.</p>
                    </div>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">If you are located in the EU or UK:</p>
                        <ul className="privacy-simple-list">
                            <li>• <strong>Consent:</strong> We may process your information if you have given us permission</li>
                            <li>• <strong>Performance of a Contract:</strong> When necessary to fulfil our contractual obligations</li>
                            <li>• <strong>Legitimate Interests:</strong> When reasonably necessary to achieve our legitimate business interests</li>
                            <li>• <strong>Legal Obligations:</strong> Where necessary for compliance with our legal obligations</li>
                            <li>• <strong>Vital Interests:</strong> To protect your vital interests or those of a third party</li>
                        </ul>
                    </div>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">If you are located in Canada:</p>
                        <p className="privacy-text">We may process your information if you have given us specific permission (express consent) or where your permission can be inferred (implied consent).</p>
                    </div>
                </div>
            )
        },
        {
            id: 'who-share',
            title: '4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We may share information in specific situations described in this section and/or with the following categories of third parties.</p>
                    </div>

                    <p className="privacy-subsection-title">We may share your data with third-party vendors and service providers who perform services for us, including:</p>

                    <ul className="privacy-list">
                        <li>Cloud Computing Services</li>
                        <li>Data Storage Service Providers</li>
                        <li>Data Analytics Services</li>
                        <li>User Account Registration & Authentication Services</li>
                        <li>Website Hosting Service Providers</li>
                        <li>Communication & Collaboration Tools</li>
                        <li>Performance Monitoring Tools</li>
                        <li>Sales & Marketing Tools</li>
                    </ul>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">We may also share your information in the following situations:</p>
                        <ul className="privacy-simple-list">
                            <li>• <strong>Business Transfers:</strong> In connection with mergers, sales, or acquisitions</li>
                            <li>• <strong>Google Maps Platform APIs:</strong> When using location services</li>
                            <li>• <strong>Other Users:</strong> When you share information publicly on the Services</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'cookies',
            title: '5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We may use cookies and other tracking technologies to collect and store your information.</p>
                    </div>

                    <p className="privacy-text">We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. These help us maintain security, prevent crashes, fix bugs, save preferences, and assist with basic site functions.</p>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">Google Analytics</p>
                        <p className="privacy-text">We may share your information with Google Analytics to track and analyse the use of the Services. You can opt out by visiting <a href="https://tools.google.com/dlpage/gaoptout" className="privacy-link" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a>.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'intl-transfers',
            title: '6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We may transfer, store, and process your information in countries other than your own.</p>
                    </div>

                    <p className="privacy-text">Our servers are located in the United States and United Kingdom. If you are accessing our Services from outside these locations, your information may be transferred to and processed in these countries.</p>

                    <p className="privacy-text">We have implemented measures to protect your personal information, including using the European Commission's Standard Contractual Clauses for transfers between our group companies and third-party providers.</p>
                </div>
            )
        },
        {
            id: 'info-retain',
            title: '7. HOW LONG DO WE KEEP YOUR INFORMATION?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
                    </div>

                    <p className="privacy-text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. We will retain your information for the period of time in which users have an account with us.</p>
                </div>
            )
        },
        {
            id: 'info-safe',
            title: '8. HOW DO WE KEEP YOUR INFORMATION SAFE?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We aim to protect your personal information through a system of organisational and technical security measures.</p>
                    </div>

                    <p className="privacy-text">We have implemented appropriate technical and organisational security measures designed to protect your personal information. However, no electronic transmission over the Internet can be guaranteed to be 100% secure. You should only access the Services within a secure environment.</p>
                </div>
            )
        },
        {
            id: 'minors',
            title: '9. DO WE COLLECT INFORMATION FROM MINORS?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: We do not knowingly collect data from or market to children under 18 years of age.</p>
                    </div>

                    <p className="privacy-text">We do not knowingly collect, solicit data from, or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.</p>
                </div>
            )
        },
        {
            id: 'privacy-rights',
            title: '10. WHAT ARE YOUR PRIVACY RIGHTS?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: Depending on your location, you have rights that allow you greater access to and control over your personal information.</p>
                    </div>

                    <p className="privacy-text">In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right to:</p>

                    <ul className="privacy-list">
                        <li>Request access and obtain a copy of your personal information</li>
                        <li>Request rectification or erasure</li>
                        <li>Restrict the processing of your personal information</li>
                        <li>Data portability</li>
                        <li>Not be subject to automated decision-making</li>
                        <li>Object to the processing of your personal information</li>
                    </ul>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">Withdrawing your consent:</p>
                        <p className="privacy-text">You have the right to withdraw your consent at any time by contacting us.</p>
                    </div>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">Account Information:</p>
                        <p className="privacy-text">If you would like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'dnt',
            title: '11. CONTROLS FOR DO-NOT-TRACK FEATURES',
            content: (
                <div className="privacy-section-content">
                    <p className="privacy-text">Most web browsers include a Do-Not-Track (DNT) feature. No uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals.</p>
                </div>
            )
        },
        {
            id: 'us-laws',
            title: '12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have additional rights regarding your personal information.</p>
                    </div>

                    <p className="privacy-subsection-title">Your rights include:</p>
                    <ul className="privacy-list">
                        <li>Right to know whether we are processing your personal data</li>
                        <li>Right to access your personal data</li>
                        <li>Right to correct inaccuracies</li>
                        <li>Right to request deletion</li>
                        <li>Right to obtain a copy of your personal data</li>
                        <li>Right to non-discrimination</li>
                        <li>Right to opt out of targeted advertising</li>
                    </ul>

                    <div className="privacy-subsection">
                        <p className="privacy-subsection-title">How to Exercise Your Rights:</p>
                        <p className="privacy-text">To exercise these rights, you can visit <a href="http://www.mypetconnect.co.uk/profile" className="privacy-link" target="_blank">http://www.mypetconnect.co.uk/profile</a> or contact us using the details below.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'updates',
            title: '13. DO WE MAKE UPDATES TO THIS NOTICE?',
            content: (
                <div className="privacy-section-content">
                    <div className="privacy-info-box">
                        <p className="privacy-info-subtitle">In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
                    </div>

                    <p className="privacy-text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Revised' date at the top of this Privacy Notice.</p>
                </div>
            )
        },
        {
            id: 'contact',
            title: '14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?',
            content: (
                <div className="privacy-section-content">
                    <p className="privacy-text">If you have questions or comments about this notice, you may contact us:</p>

                    <div className="privacy-contact-info">
                        <div className="privacy-contact-item">
                            <Mail className="privacy-contact-icon" />
                            <div>
                                <p className="privacy-contact-label">Email:</p>
                                <a href="mailto:support@mypetconnect.co.uk" className="privacy-link">support@mypetconnect.co.uk</a>
                            </div>
                        </div>

                        <div className="privacy-contact-item">
                            <MapPin className="privacy-contact-icon" />
                            <div>
                                <p className="privacy-contact-label">Address:</p>
                                <p className="privacy-text">
                                    My Pet Connect<br />
                                    29 Claters Close<br />
                                    Retford, DN22 6QE<br />
                                    United Kingdom
                                </p>
                            </div>
                        </div>

                        <div className="privacy-uk-rep">
                            <p className="privacy-subsection-title">UK Representative:</p>
                            <p className="privacy-text">
                                Gavin Oxley Bryan<br />
                                Email: <a href="mailto:gavin@mypetconnect.co.uk" className="privacy-link">gavin@mypetconnect.co.uk</a><br />
                                Phone: <a href="tel:07973419511" className="privacy-link">07973419511</a>
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'review-data',
            title: '15. HOW CAN YOU REVIEW, UPDATE, OR DELETE YOUR DATA?',
            content: (
                <div className="privacy-section-content">
                    <p className="privacy-text">Based on the applicable laws of your country or state of residence, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information.</p>

                    <p className="privacy-text">To request to review, update, or delete your personal information, please visit: <a href="http://www.mypetconnect.co.uk/profile" className="privacy-link" target="_blank">http://www.mypetconnect.co.uk/profile</a></p>
                </div>
            )
        }
    ];

    return (
        <>

            <Helmet>
                <title>Privacy Policy | My Pet Connect</title>
                <meta
                    name="description"
                    content="Learn how My Pet Connect collects, uses, and safeguards your personal information in our Privacy Policy."
                />
                <meta name="robots" content="noindex,nofollow" />
            </Helmet>



            <div className="privacy-policy-container">
                {/* Header */}
                <div className="privacy-header">
                    <div className="privacy-header-content">
                        <div className="privacy-header-title-wrapper">
                            <Shield className="privacy-header-icon" />
                            <h1 className="privacy-header-title">PRIVACY POLICY</h1>
                        </div>
                        <div className="privacy-header-date">
                            <Calendar className="privacy-header-date-icon" />
                            Last updated: {lastUpdated}
                        </div>
                    </div>
                </div>

                {/* Introduction */}
                <div className="privacy-main-content">
                    <div className="privacy-intro-card">
                        <p className="privacy-intro-text">
                            This Privacy Notice for <strong>My Pet Connect</strong> ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:
                        </p>
                        <ul className="privacy-intro-list">
                            <li>Visit our website at <a href="http://www.mypetconnect.co.uk" className="privacy-link" target="_blank" rel="noopener noreferrer">http://www.mypetconnect.co.uk</a>, or any website of ours that links to this Privacy Notice</li>
                            <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                        </ul>
                        <div className="privacy-warning-box">
                            <p className="privacy-warning-text">
                                <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at support@mypetconnect.co.uk.
                            </p>
                        </div>
                    </div>

                    {/* Summary of Key Points */}
                    <div className="privacy-summary-card">
                        <h2 className="privacy-summary-title">
                            <Info className="privacy-summary-icon" />
                            SUMMARY OF KEY POINTS
                        </h2>
                        <p className="privacy-summary-intro">
                            This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
                        </p>

                        <div className="privacy-summary-items">
                            <div className="privacy-summary-item">
                                <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific categories of third parties.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
                            </div>
                            <div className="privacy-summary-item">
                                <p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by visiting <a href="http://www.mypetconnect.co.uk/profile" className="privacy-link" target="_blank">http://www.mypetconnect.co.uk/profile</a>, or by contacting us.</p>
                            </div>
                        </div>
                    </div>

                    {/* Table of Contents */}
                    <div className="privacy-toc-card">
                        <h2 className="privacy-toc-title">TABLE OF CONTENTS</h2>
                        <ol className="privacy-toc-list">
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className="privacy-toc-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Sections */}
                    <div className="privacy-sections">
                        {sections.map((section) => (
                            <div key={section.id} id={section.id} className="privacy-section-card">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="privacy-section-header"
                                >
                                    <h2 className="privacy-section-title">{section.title}</h2>
                                    {expandedSections[section.id] ? (
                                        <ChevronUp className="privacy-section-icon" />
                                    ) : (
                                        <ChevronDown className="privacy-section-icon" />
                                    )}
                                </button>
                                {expandedSections[section.id] && (
                                    <div className="privacy-section-content-wrapper">
                                        <div className="privacy-section-divider"></div>
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

export default PrivacyPolicyPage;