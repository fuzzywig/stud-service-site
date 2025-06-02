import React, { useState } from 'react';
import './BreedingGuide.css';

export default function BreedingGuide() {
    const [activeSection, setActiveSection] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const sections = [
        {
            title: "Is Breeding Right for You?",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
            ),
            content: (
                <>
                    <p className="breeding-guide__text">
                        Before embarking on the breeding journey, consider whether you're doing this to
                        improve the breed, or simply to produce puppies. Breeding is a serious
                        responsibility that requires time, knowledge, and long-term commitment.
                    </p>
                    <div className="breeding-guide__checklist">
                        <div className="breeding-guide__checklist-item">
                            <svg viewBox="0 0 24 24" className="breeding-guide__check-icon">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Do you understand breed standards and genetics?</span>
                        </div>
                        <div className="breeding-guide__checklist-item">
                            <svg viewBox="0 0 24 24" className="breeding-guide__check-icon">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Can you afford potential veterinary care and puppy rearing costs?</span>
                        </div>
                        <div className="breeding-guide__checklist-item">
                            <svg viewBox="0 0 24 24" className="breeding-guide__check-icon">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Are you prepared to keep puppies until suitable homes are found?</span>
                        </div>
                    </div>
                </>
            )
        },
        {
            title: "Pre-Breeding Health Checks",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M12 2l.324 1.001a11 11 0 0 0 6.675 6.675L20 10l-1.001.324a11 11 0 0 0-6.675 6.675L12 18l-.324-1.001a11 11 0 0 0-6.675-6.675L4 10l1.001-.324A11 11 0 0 0 11.676 3.001L12 2zm0 2.472A13 13 0 0 1 7.528 9 13 13 0 0 1 12 13.472 13 13 0 0 1 16.472 9 13 13 0 0 1 12 4.472zM20 12l.18.555a7 7 0 0 0 4.265 4.265L25 17l-.555.18a7 7 0 0 0-4.265 4.265L20 22l-.18-.555a7 7 0 0 0-4.265-4.265L15 17l.555-.18a7 7 0 0 0 4.265-4.265L20 12z"/>
                </svg>
            ),
            content: (
                <>
                    <p className="breeding-guide__text">Ensure both the dam and stud:</p>
                    <div className="breeding-guide__health-cards">
                        <div className="breeding-guide__health-card">
                            <svg viewBox="0 0 24 24" className="breeding-guide__card-icon">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                            </svg>
                            <p>Fully vaccinated and wormed</p>
                        </div>
                        <div className="breeding-guide__health-card">
                            <svg viewBox="0 0 24 24" className="breeding-guide__card-icon">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
                            </svg>
                            <p>Breed-specific health and genetic testing completed</p>
                        </div>
                        <div className="breeding-guide__health-card">
                            <svg viewBox="0 0 24 24" className="breeding-guide__card-icon">
                                <path d="M4.5 10.5C4.5 12.9853 6.51472 15 9 15C11.4853 15 13.5 12.9853 13.5 10.5C13.5 8.01472 11.4853 6 9 6C6.51472 6 4.5 8.01472 4.5 10.5ZM11.5 10.5C11.5 11.8807 10.3807 13 9 13C7.61929 13 6.5 11.8807 6.5 10.5C6.5 9.11929 7.61929 8 9 8C10.3807 8 11.5 9.11929 11.5 10.5Z"/>
                            </svg>
                            <p>Sound temperament and overall fitness</p>
                        </div>
                    </div>
                </>
            )
        },
        {
            title: "Understanding the Heat Cycle",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
            ),
            content: (
                <>
                    <p className="breeding-guide__text">The female's heat cycle includes four phases:</p>
                    <div className="breeding-guide__cycle-timeline">
                        <div className="breeding-guide__cycle-phase">
                            <div className="breeding-guide__cycle-header">
                                <h4>🩸 Proestrus</h4>
                                <span className="breeding-guide__cycle-duration">7-10 days</span>
                            </div>
                            <div className="breeding-guide__cycle-details">
                                <p><strong>Characteristics:</strong></p>
                                <ul>
                                    <li>Swollen vulva</li>
                                    <li>Bloody vaginal discharge</li>
                                    <li>Attracts males but not receptive</li>
                                </ul>
                                <p><strong>Hormones:</strong> Rising estrogen levels</p>
                                <p><strong>Behavior:</strong> Restless, possibly nervous</p>
                            </div>
                        </div>
                        <div className="breeding-guide__cycle-phase breeding-guide__cycle-phase--active">
                            <div className="breeding-guide__cycle-header">
                                <h4>🔥 Estrus</h4>
                                <span className="breeding-guide__cycle-duration">10-14 days</span>
                            </div>
                            <div className="breeding-guide__cycle-details">
                                <p><strong>Characteristics:</strong></p>
                                <ul>
                                    <li>Reduced vulvar swelling</li>
                                    <li>Lighter discharge color</li>
                                    <li>Receptive to males, "flagging"</li>
                                </ul>
                                <p><strong>Hormones:</strong> Estrogen drops, progesterone rises</p>
                                <p><strong>Behavior:</strong> Actively seeks males, ovulation occurs</p>
                            </div>
                        </div>
                        <div className="breeding-guide__cycle-phase">
                            <div className="breeding-guide__cycle-header">
                                <h4>Diestrus</h4>
                                <span className="breeding-guide__cycle-duration">~60 days</span>
                            </div>
                            <p>Follows mating or ovulation</p>
                        </div>
                        <div className="breeding-guide__cycle-phase">
                            <div className="breeding-guide__cycle-header">
                                <h4>Anestrus</h4>
                                <span className="breeding-guide__cycle-duration">~4 months</span>
                            </div>
                            <p>Rest period before next cycle</p>
                        </div>
                    </div>
                </>
            )
        },
        {
            title: "Mating Process",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ),
            content: (
                <div className="breeding-guide__info-box">
                    <p className="breeding-guide__text">
                        Mating should always be supervised. Natural mating is preferred where possible, but artificial insemination may be used when necessary, provided it is carried out by a qualified veterinarian.
                    </p>
                    <div className="breeding-guide__tip">
                        <svg viewBox="0 0 24 24" className="breeding-guide__tip-icon">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <p>Always consult with a veterinarian for guidance on the best approach for your specific breed.</p>
                    </div>
                </div>
            )
        },
        {
            title: "Pregnancy & Whelping",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M9 2v2h6V2h2v2h1c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h1V2h2zm9 18V8H6v12h12zM8 10h8v2H8v-2zm0 4h5v2H8v-2z"/>
                </svg>
            ),
            content: (
                <div className="breeding-guide__pregnancy-grid">
                    <div className="breeding-guide__pregnancy-card">
                        <svg viewBox="0 0 24 24" className="breeding-guide__pregnancy-icon">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        <h4>Gestation Period</h4>
                        <p>Approximately 63 days</p>
                    </div>
                    <div className="breeding-guide__pregnancy-card">
                        <svg viewBox="0 0 24 24" className="breeding-guide__pregnancy-icon">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <h4>Nutrition</h4>
                        <p>Feed diet appropriate for pregnant dogs</p>
                    </div>
                    <div className="breeding-guide__pregnancy-card">
                        <svg viewBox="0 0 24 24" className="breeding-guide__pregnancy-icon">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                        <h4>Whelping Space</h4>
                        <p>Prepare clean, quiet area</p>
                    </div>
                    <div className="breeding-guide__pregnancy-card">
                        <svg viewBox="0 0 24 24" className="breeding-guide__pregnancy-icon">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                        </svg>
                        <h4>Veterinary Care</h4>
                        <p>Schedule regular check-ups</p>
                    </div>
                </div>
            )
        },
        {
            title: "Caring for Newborn Puppies",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 11 5.5 13 7.5 16.5 4l-.5 4zm1 9.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-9 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
            ),
            content: (
                <div className="breeding-guide__puppy-care">
                    <div className="breeding-guide__care-item">
                        <svg viewBox="0 0 24 24" className="breeding-guide__care-icon">
                            <path d="M13 5.08A7 7 0 0 1 19 12v10h-2v-3h-2v3h-2v-3h-2v3H9v-3H7v3H5V12a7 7 0 0 1 6-6.92V3h2v2.08z"/>
                        </svg>
                        <div>
                            <h4>Temperature Control</h4>
                            <p>Keep the area warm and draft-free</p>
                        </div>
                    </div>
                    <div className="breeding-guide__care-item">
                        <svg viewBox="0 0 24 24" className="breeding-guide__care-icon">
                            <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3z"/>
                        </svg>
                        <div>
                            <h4>Feeding & Weight</h4>
                            <p>Ensure puppies feed well and gain weight</p>
                        </div>
                    </div>
                    <div className="breeding-guide__care-item">
                        <svg viewBox="0 0 24 24" className="breeding-guide__care-icon">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <div>
                            <h4>Health Monitoring</h4>
                            <p>Watch for signs of illness in dam and pups</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Rehoming & Finding Suitable Homes",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
            ),
            content: (
                <div className="breeding-guide__rehoming">
                    <div className="breeding-guide__rehoming-step">
                        <div className="breeding-guide__step-number">1</div>
                        <div>
                            <h4>Screen Buyers</h4>
                            <p>Carefully evaluate potential owners</p>
                        </div>
                    </div>
                    <div className="breeding-guide__rehoming-step">
                        <div className="breeding-guide__step-number">2</div>
                        <div>
                            <h4>Provide Support</h4>
                            <p>Share information and guidance with new owners</p>
                        </div>
                    </div>
                    <div className="breeding-guide__rehoming-step">
                        <div className="breeding-guide__step-number">3</div>
                        <div>
                            <h4>Stay Connected</h4>
                            <p>Maintain contact for follow-up care</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Ongoing Breeder Responsibility",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="breeding-guide__icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            content: (
                <div className="breeding-guide__responsibilities">
                    <div className="breeding-guide__responsibility-card">
                        <h4>Don't Overbreed</h4>
                        <p>Give the dam adequate rest between litters</p>
                    </div>
                    <div className="breeding-guide__responsibility-card">
                        <h4>Retirement Planning</h4>
                        <p>Know when to retire dogs from breeding</p>
                    </div>
                    <div className="breeding-guide__responsibility-card">
                        <h4>Continuous Learning</h4>
                        <p>Stay updated with best practices</p>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="breeding-guide">
            <div className="breeding-guide__hero">
                <h1 className="breeding-guide__title">Responsible Breeding Guide</h1>
                <p className="breeding-guide__subtitle">Your comprehensive guide to ethical dog breeding</p>
            </div>

            <div className="breeding-guide__container">
                {/* Mobile Menu Toggle */}
                <button
                    className="breeding-guide__mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <svg viewBox="0 0 24 24" className="breeding-guide__toggle-icon">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                    Menu
                </button>

                {/* Navigation */}
                <nav className={`breeding-guide__nav ${mobileMenuOpen ? 'breeding-guide__nav--open' : ''}`}>
                    <div className="breeding-guide__nav-header">
                        <h3>Contents</h3>
                        <button
                            className="breeding-guide__nav-close"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    {sections.map((section, index) => (
                        <button
                            key={index}
                            className={`breeding-guide__nav-item ${activeSection === index ? 'breeding-guide__nav-item--active' : ''}`}
                            onClick={() => {
                                setActiveSection(index);
                                setMobileMenuOpen(false);
                            }}
                        >
                            <span className="breeding-guide__nav-icon">{section.icon}</span>
                            <span className="breeding-guide__nav-number">{index + 1}</span>
                            <span className="breeding-guide__nav-title">{section.title}</span>
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <main className="breeding-guide__content">
                    <div className="breeding-guide__section">
                        <div className="breeding-guide__section-header">
                            <span className="breeding-guide__section-icon">{sections[activeSection].icon}</span>
                            <h2 className="breeding-guide__section-title">{sections[activeSection].title}</h2>
                        </div>
                        <div className="breeding-guide__section-content">
                            {sections[activeSection].content}
                        </div>
                    </div>

                    <div className="breeding-guide__navigation">
                        <button
                            className="breeding-guide__nav-button breeding-guide__nav-button--prev"
                            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                            disabled={activeSection === 0}
                        >
                            <svg viewBox="0 0 24 24" className="breeding-guide__button-icon">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                            Previous
                        </button>
                        <div className="breeding-guide__progress">
                            <div
                                className="breeding-guide__progress-bar"
                                style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
                            />
                        </div>
                        <button
                            className="breeding-guide__nav-button breeding-guide__nav-button--next"
                            onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                            disabled={activeSection === sections.length - 1}
                        >
                            Next
                            <svg viewBox="0 0 24 24" className="breeding-guide__button-icon">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                </main>
            </div>

            <footer className="breeding-guide__footer">
                <div className="breeding-guide__footer-container">
                    <h3 className="breeding-guide__footer-title">Need More Information?</h3>

                    <p className="breeding-guide__footer-text">
                        Breeding dogs is a rewarding but serious responsibility. Whether you're just starting out or looking to refine your practices, it's important to have the right knowledge and support. For further guidance on ethical and responsible breeding, we recommend exploring resources from organisations such as The Kennel Club (UK) or speaking directly with your local vet, who can advise on health testing, care during pregnancy, and postnatal support.
                    </p>

                    <div className="breeding-guide__footer-highlights">
                        <div className="breeding-guide__footer-highlight">
                            <svg viewBox="0 0 24 24" className="breeding-guide__footer-highlight-icon">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                            </svg>
                            <span>Health First</span>
                        </div>
                        <div className="breeding-guide__footer-highlight">
                            <svg viewBox="0 0 24 24" className="breeding-guide__footer-highlight-icon">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>Ethical Practices</span>
                        </div>
                        <div className="breeding-guide__footer-highlight">
                            <svg viewBox="0 0 24 24" className="breeding-guide__footer-highlight-icon">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span>Lifelong Support</span>
                        </div>
                    </div>

                    <div className="breeding-guide__footer-reminder">
                        <svg viewBox="0 0 24 24" className="breeding-guide__footer-reminder-icon">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <p>
                            <strong>Please remember:</strong> Responsible breeding should always prioritise the health, temperament, and welfare of both the parents and their puppies. Every decision you make as a breeder contributes to the future of the breed — let's ensure it's a positive one.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}