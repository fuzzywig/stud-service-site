import React from 'react';
import { FileText, Mail, Info, AlertCircle, Users, Ban, CheckCircle, Scale, Calendar, Shield } from 'lucide-react';
import './TermsOfServicePage.css'
import { Helmet } from "react-helmet-async";
const TermsOfServicePage = () => {
    const lastUpdated = new Date().toLocaleDateString("en-GB", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>

            <Helmet>
                <title>Terms of Service | My Pet Connect</title>
                <meta
                    name="description"
                    content="Read the My Pet Connect Terms of Service to understand the rules and regulations for using our platform."
                />
                <meta name="robots" content="noindex,nofollow" />
            </Helmet>



            <div className="terms-container">
                {/* Header */}
                <div className="terms-header">
                    <div className="terms-header-content">
                        <div className="terms-header-title-wrapper">
                            <FileText className="terms-header-icon" />
                            <h1 className="terms-header-title">TERMS OF SERVICE</h1>
                        </div>
                        <div className="terms-header-date">
                            <Calendar className="terms-header-date-icon" />
                            Last updated: {lastUpdated}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="terms-main-content">
                    {/* Introduction Card */}
                    <div className="terms-intro-card">
                        <p className="terms-intro-text">
                            These Terms of Service govern your use of <strong>MyPetConnect</strong>, a platform dedicated to responsible pet advertising and rehoming. By using our services, you agree to abide by these terms and our commitment to animal welfare.
                        </p>
                    </div>

                    {/* Summary Card */}
                    <div className="terms-summary-card">
                        <h2 className="terms-summary-title">
                            <Info className="terms-summary-icon" />
                            KEY POINTS
                        </h2>

                        <div className="terms-summary-items">
                            <div className="terms-summary-item">
                                <div className="terms-summary-item-icon-wrapper">
                                    <Users className="terms-summary-item-icon" />
                                </div>
                                <p className="terms-summary-item-title">Age Requirement</p>
                                <p className="terms-summary-item-text">You must be 18+ to use our services</p>
                            </div>
                            <div className="terms-summary-item">
                                <div className="terms-summary-item-icon-wrapper">
                                    <Shield className="terms-summary-item-icon" />
                                </div>
                                <p className="terms-summary-item-title">Animal Welfare</p>
                                <p className="terms-summary-item-text">All ads must prioritize animal well-being</p>
                            </div>
                            <div className="terms-summary-item">
                                <div className="terms-summary-item-icon-wrapper">
                                    <CheckCircle className="terms-summary-item-icon" />
                                </div>
                                <p className="terms-summary-item-title">PAAG Standards</p>
                                <p className="terms-summary-item-text">We follow Pet Advertising Advisory Group guidelines</p>
                            </div>
                            <div className="terms-summary-item">
                                <div className="terms-summary-item-icon-wrapper">
                                    <Scale className="terms-summary-item-icon" />
                                </div>
                                <p className="terms-summary-item-title">UK Law Compliance</p>
                                <p className="terms-summary-item-text">All activities must comply with UK regulations</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Introduction */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Info className="terms-section-icon" />
                            <h2 className="terms-section-title">1. INTRODUCTION</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">Welcome to MyPetConnect. By accessing or using our website, you agree to comply with and be bound by these Terms of Service.</p>
                        </div>

                        <p className="terms-text">These Terms of Service ("Terms") govern your use of the MyPetConnect website and services (collectively, the "Services"). By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>

                        <div className="terms-warning-box">
                            <AlertCircle className="terms-warning-icon" />
                            <p className="terms-warning-text">
                                <strong>Important:</strong> If you do not agree with any part of these terms, please refrain from using our services.
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Eligibility */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Users className="terms-section-icon" />
                            <h2 className="terms-section-title">2. ELIGIBILITY</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">You must meet certain requirements to use our services.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Age Requirement</p>
                            <p className="terms-text">You must be at least 18 years old to use our services. By using MyPetConnect, you represent and warrant that you meet this age requirement.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Legal Capacity</p>
                            <p className="terms-text">You must have the legal capacity to enter into binding contracts and must not be barred from receiving services under the laws of the United Kingdom or other applicable jurisdiction.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Account Responsibility</p>
                            <p className="terms-text">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                        </div>
                    </div>

                    {/* Section 3: User Responsibilities */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <CheckCircle className="terms-section-icon" />
                            <h2 className="terms-section-title">3. USER RESPONSIBILITIES</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">As a user of MyPetConnect, you agree to certain responsibilities and obligations.</p>
                        </div>

                        <p className="terms-text">When using our services, you must:</p>

                        <ul className="terms-bullet-list">
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Provide accurate, current, and complete information during registration and when posting advertisements</span>
                            </li>
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Comply with all applicable laws and regulations, including those related to animal welfare and advertising standards</span>
                            </li>
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Refrain from posting content that is unlawful, misleading, or infringes upon the rights of others</span>
                            </li>
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Ensure that any animals advertised are healthy, legally owned, and suitable for sale or rehoming</span>
                            </li>
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Maintain accurate and up-to-date contact information</span>
                            </li>
                            <li>
                                <span className="terms-bullet">•</span>
                                <span className="terms-bullet-text">Respond promptly to inquiries about your advertisements</span>
                            </li>
                        </ul>

                        <div className="terms-highlight-box">
                            <p className="terms-highlight-title">Animal Welfare Priority</p>
                            <p className="terms-text">The welfare of animals must always be your primary consideration when using our platform.</p>
                        </div>
                    </div>

                    {/* Section 4: Prohibited Activities */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Ban className="terms-section-icon" />
                            <h2 className="terms-section-title">4. PROHIBITED ACTIVITIES</h2>
                        </div>

                        <div className="terms-info-box terms-info-box-danger">
                            <p className="terms-info-subtitle">The following activities are strictly prohibited on MyPetConnect:</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">General Prohibitions</p>
                            <ul className="terms-prohibited-list">
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Offering animals for swap or exchange for other goods, services, or pets</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Advertising animals that are banned or restricted under UK law</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Posting ads for animals that have undergone illegal procedures (e.g., ear cropping, tail docking without veterinary justification)</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Offering animals for delivery via postal services, except where legally permitted</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Misrepresenting age, breed, or health status of animals</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Using the platform for puppy farming or commercial breeding without proper licensing</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Posting fraudulent or misleading advertisements</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Harassing other users or engaging in abusive behavior</span>
                                </li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Specific Animal-Related Prohibitions</p>
                            <ul className="terms-prohibited-list">
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Advertising pregnant animals for sale</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Offering live vertebrate animals as food</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Advertising farmed animals</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Offering stud animals, animals in season, or animals for 'rent' or 'loan' (except horses/donkeys for loan)</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Advertising animals specifically for working, hunting, or guarding purposes</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Offering animals before they are weaned and independent from their parents</span>
                                </li>
                            </ul>
                        </div>

                        <div className="terms-warning-box">
                            <AlertCircle className="terms-warning-icon" />
                            <p className="terms-warning-text">
                                Violation of these prohibitions may result in immediate account termination and potential legal action.
                            </p>
                        </div>
                    </div>

                    {/* Section 5: Prohibited Species */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Ban className="terms-section-icon" />
                            <h2 className="terms-section-title">5. PROHIBITED SPECIES</h2>
                        </div>

                        <div className="terms-info-box terms-info-box-danger">
                            <p className="terms-info-subtitle">The following species are prohibited from being advertised on MyPetConnect:</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Completely Prohibited Species</p>
                            <ul className="terms-prohibited-list">
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Non-human primates (all species)</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">All species scheduled under the Dangerous Wild Animals Act</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Raptors, including owls</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Anacondas, Burmese pythons, and African rock pythons</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Any species covered by GB Wildlife Trade Regulations Annex A without valid Article 10 Certificate</span>
                                </li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Reptiles with Hereditary Defects</p>
                            <p className="terms-text">The following reptile morphs are prohibited due to welfare concerns:</p>
                            <ul className="terms-prohibited-list">
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Spider morph royal pythons</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Jaguar morph carpet pythons</span>
                                </li>
                                <li>
                                    <span className="terms-bullet terms-bullet-danger">✗</span>
                                    <span className="terms-bullet-text">Enigma morph leopard geckos</span>
                                </li>
                            </ul>
                        </div>

                        <div className="terms-highlight-box">
                            <p className="terms-highlight-title">Protected Species</p>
                            <p className="terms-text">Any species listed as threatened, endangered, or protected under UK or international law cannot be advertised without proper documentation and permits.</p>
                        </div>
                    </div>

                    {/* Section 6: Advertisement Standards */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <FileText className="terms-section-icon" />
                            <h2 className="terms-section-title">6. ADVERTISEMENT STANDARDS</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">All advertisements must meet our quality and compliance standards.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Required Information</p>
                            <p className="terms-text">Every advertisement must include:</p>
                            <ul className="terms-list">
                                <li>Clear, recent photos of the actual animal being offered</li>
                                <li>The animal's age, breed, and gender</li>
                                <li>Any relevant health information, including vaccination status</li>
                                <li>The country of origin and current residence</li>
                                <li>The seller's local authority license number if applicable</li>
                                <li>Accurate pricing information</li>
                                <li>Microchipping status (required for dogs over 8 weeks and cats over 20 weeks)</li>
                                <li>For equines: confirmation of full identification (passport and microchip)</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Photo Requirements</p>
                            <ul className="terms-list">
                                <li>Photos must be of the actual animal being advertised</li>
                                <li>Images must be clear and recent (within 2 weeks)</li>
                                <li>No stock photos or misleading images</li>
                                <li>Show the animal in a safe, appropriate environment</li>
                                <li>Young animals (dogs, cats, rabbits, ferrets, chinchillas) must be photographed with their mother</li>
                                <li>Equines require photos from the front and both sides</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">PAAG Compliance</p>
                            <p className="terms-text">
                                These standards follow the Pet Advertising Advisory Group (PAAG) guidelines.
                                <a href="https://paag.org.uk/advertising-standards/" className="terms-link" target="_blank" rel="noopener noreferrer"> Learn more about PAAG standards</a>.
                            </p>
                        </div>

                        <div className="terms-highlight-box">
                            <p className="terms-highlight-title">Age and Weaning Requirements</p>
                            <p className="terms-text">No animal should be advertised for transfer to a new owner before it is weaned and no longer dependent on its parents. This is crucial for the animal's health and welfare.</p>
                        </div>
                    </div>

                    {/* Section 7: Content Ownership */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <FileText className="terms-section-icon" />
                            <h2 className="terms-section-title">7. CONTENT OWNERSHIP AND LICENSE</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">Understanding content rights and licenses on our platform.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Your Content</p>
                            <p className="terms-text">
                                You retain ownership of all content you post on MyPetConnect. However, by posting content, you grant us a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your content in connection with our services.
                            </p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">License Grant</p>
                            <p className="terms-text">This license allows us to:</p>
                            <ul className="terms-list">
                                <li>Display your advertisements on our website</li>
                                <li>Share your content across our platform</li>
                                <li>Make technical modifications necessary for display</li>
                                <li>Use your content for promotional purposes (with your consent)</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Your Warranties</p>
                            <p className="terms-text">By posting content, you warrant that:</p>
                            <ul className="terms-list">
                                <li>You own or have the right to use all content you post</li>
                                <li>Your content does not infringe any third-party rights</li>
                                <li>Your content is accurate and not misleading</li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 8: Termination */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <AlertCircle className="terms-section-icon" />
                            <h2 className="terms-section-title">8. TERMINATION</h2>
                        </div>

                        <div className="terms-info-box terms-info-box-danger">
                            <p className="terms-info-subtitle">We may suspend or terminate your access for violations of these terms.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Grounds for Termination</p>
                            <p className="terms-text">We may terminate or suspend your account immediately, without prior notice, for:</p>
                            <ul className="terms-list">
                                <li>Violation of these Terms of Service</li>
                                <li>Engaging in fraudulent or illegal activities</li>
                                <li>Posting prohibited content</li>
                                <li>Harassing other users</li>
                                <li>Creating multiple accounts to circumvent restrictions</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Effect of Termination</p>
                            <p className="terms-text">Upon termination:</p>
                            <ul className="terms-list">
                                <li>Your right to use our services will immediately cease</li>
                                <li>All your advertisements will be removed</li>
                                <li>You may not create new accounts without our permission</li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 9: Disclaimers */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Info className="terms-section-icon" />
                            <h2 className="terms-section-title">9. DISCLAIMERS AND LIMITATION OF LIABILITY</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">Important disclaimers about our services and limitations on our liability.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Platform Nature</p>
                            <p className="terms-text">
                                MyPetConnect is a platform for pet advertisements. We do not:
                            </p>
                            <ul className="terms-list">
                                <li>Guarantee the accuracy of any advertisement</li>
                                <li>Verify the quality or health of animals</li>
                                <li>Participate in transactions between users</li>
                                <li>Provide veterinary or breeding advice</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">No Warranties</p>
                            <p className="terms-text">
                                Our services are provided "as is" without any warranties, express or implied. We do not warrant that our services will be uninterrupted, error-free, or secure.
                            </p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Limitation of Liability</p>
                            <p className="terms-text">
                                To the fullest extent permitted by law, MyPetConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
                            </p>
                        </div>

                        <div className="terms-warning-box">
                            <AlertCircle className="terms-warning-icon" />
                            <p className="terms-warning-text">
                                Users are solely responsible for conducting due diligence before entering into any transactions.
                            </p>
                        </div>
                    </div>

                    {/* Section 10: Modifications */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <FileText className="terms-section-icon" />
                            <h2 className="terms-section-title">10. MODIFICATIONS TO TERMS</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">We may update these terms from time to time.</p>
                        </div>

                        <p className="terms-text">
                            We reserve the right to modify these Terms of Service at any time. When we make changes:
                        </p>

                        <ul className="terms-list">
                            <li>We will update the "Last updated" date at the top of this page</li>
                            <li>We may notify you via email or through our website</li>
                            <li>Significant changes will be highlighted</li>
                        </ul>

                        <p className="terms-text">
                            Your continued use of our services after any modifications indicates your acceptance of the updated terms. If you do not agree with the changes, you should discontinue use of our services.
                        </p>
                    </div>

                    {/* Section 11: Governing Law */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Scale className="terms-section-icon" />
                            <h2 className="terms-section-title">11. GOVERNING LAW</h2>
                        </div>

                        <div className="terms-info-box">
                            <p className="terms-info-subtitle">These terms are governed by the laws of England and Wales.</p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Jurisdiction</p>
                            <p className="terms-text">
                                These Terms of Service and any disputes arising from or relating to them shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles.
                            </p>
                        </div>

                        <div className="terms-subsection">
                            <p className="terms-subsection-title">Dispute Resolution</p>
                            <p className="terms-text">
                                Any disputes arising from these terms or your use of our services shall be resolved exclusively in the courts of England and Wales. You consent to the personal jurisdiction of these courts.
                            </p>
                        </div>
                    </div>

                    {/* Section 12: Contact */}
                    <div className="terms-section">
                        <div className="terms-section-header">
                            <Mail className="terms-section-icon" />
                            <h2 className="terms-section-title">12. CONTACT INFORMATION</h2>
                        </div>

                        <p className="terms-text">If you have any questions about these Terms of Service, please contact us:</p>

                        <div className="terms-contact-info">
                            <div className="terms-contact-item">
                                <Mail className="terms-contact-icon" />
                                <div>
                                    <p className="terms-contact-label">Email:</p>
                                    <a href="mailto:support@mypetconnect.co.uk" className="terms-link">support@mypetconnect.co.uk</a>
                                </div>
                            </div>
                        </div>

                        <div className="terms-highlight-box">
                            <p className="terms-text">
                                We aim to respond to all inquiries within 48 hours during business days.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TermsOfServicePage;