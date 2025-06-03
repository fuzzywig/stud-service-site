import React, { useState, useEffect } from 'react';
import './AboutUs.css';

const AboutUs = () => {
    const [visibleSections, setVisibleSections] = useState({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => ({
                            ...prev,
                            [entry.target.id]: true
                        }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        const sections = document.querySelectorAll('.about__section, .about__mission, .about__team, .about__stats, .about__timeline, .about__testimonials');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    const features = [
        {
            number: '',
            title: 'Stud Advertising',
            description: 'Handlers list their studs with clear credentials, pedigrees, and any health-test history so breeders see all pertinent details upfront.'
        },
        {
            number: '',
            title: 'Centralized Hub',
            description: 'A single platform where breeders and handlers connect, share best practices, and find trusted partners without guesswork.'
        },
        {
            number: '',
            title: 'Community Support',
            description: 'Forums and Q&A threads help breeders with Kennel Club–recommended health testing, temperament evaluations, and responsible litter guidance.'
        },
        {
            number: '',
            title: 'Feature Requests',
            description: 'Users suggest new features directly from their profiles, letting the platform evolve based on real breeder and handler needs.'
        }
    ];

    return (
        <div className="about">
            {/* Hero Section */}
            <section className="about__hero">
                <div className="about__container">
                    <div className="about__hero-content">
                        <h1 className="about__title">About Us</h1>
                        <div className="about__divider"></div>
                        <p className="about__subtitle">
                            Your trusted partner for all things pets
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="about__content">
                {/* Our Story */}
                <section
                    id="story"
                    className={`about__section ${visibleSections.story ? 'about__section--visible' : ''}`}
                >
                    <div className="about__story-grid">
                        <div>
                            <h2 className="about__section-title">Our Story</h2>
                            <div className="about__section-divider"></div>
                        </div>
                        <div>
                            <p className="about__text about__text--primary">
                                <strong>Who We Are</strong>
                            </p>
                            <p className="about__text">
                                My Pet Connect is a UK‐based advertising platform founded in 2024 by a stud‐service professional
                                with over 12 years of hands-on experience. We give breeders and stud handlers a central place to
                                list their services, showcase their expertise, and connect with responsible pet owners—no missing details, no guesswork.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section
                    id="mission"
                    className={`about__section about__mission ${visibleSections.mission ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__mission-title">Our Mission</h2>
                    <p className="about__mission-text">
                        We exist to bring transparency and trust back into stud advertising. Too many platforms omit vital
                        information—health testing, handler experience, pedigree clarity—forcing breeders to chase down missing details.
                        My Pet Connect puts everything front and center so breeders and handlers can make informed, responsible decisions.
                    </p>
                </section>

                {/* What We Do */}
                <section
                    id="features"
                    className={`about__section ${visibleSections.features ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__features-title">What We Do</h2>
                    <div className="about__features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="about__feature-card">
                                {feature.number && <div className="about__feature-number">{feature.number}</div>}
                                <h3 className="about__feature-title">{feature.title}</h3>
                                <p className="about__feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Values Section */}
                <section
                    id="values"
                    className={`about__section ${visibleSections.values ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__section-title" style={{ textAlign: 'center' }}>Our Core Values</h2>
                    <div className="about__values-grid">
                        <div className="about__value-item">
                            <h3 className="about__value-title">Transparency</h3>
                            <p className="about__value-text">
                                Every key detail—pedigrees, handler experience, any available health testing—is clearly visible so breeders can decide with confidence.
                            </p>
                        </div>
                        <div className="about__value-item">
                            <h3 className="about__value-title">Responsibility</h3>
                            <p className="about__value-text">
                                We highly recommend Kennel Club and veterinary-recommended health tests—hip scores, cardiac checks, genetic panels, eye exams, and breed-specific screenings—to ensure healthy litters and stable temperaments.
                            </p>
                        </div>
                        <div className="about__value-item">
                            <h3 className="about__value-title">Community-Driven</h3>
                            <p className="about__value-text">
                                Users shape the platform via feature requests on their profiles. You ask, we build—no corporate guesswork.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Timeline Section */}
                <section
                    id="timeline"
                    className={`about__section about__timeline ${visibleSections.timeline ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>Our Journey</h2>
                    <div className="about__timeline-container">
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">2024</div>
                            <div className="about__timeline-content">
                                <h4>Founded</h4>
                                <p>Created My Pet Connect to centralize stud advertising and bring transparency back to the industry.</p>
                            </div>
                        </div>
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">Early 2025</div>
                            <div className="about__timeline-content">
                                <h4>Community Growth</h4>
                                <p>Surpassed 5,000 active handlers and 8,000 registered breeders in the UK.</p>
                            </div>
                        </div>
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">Mid 2025</div>
                            <div className="about__timeline-content">
                                <h4>Feature Expansion</h4>
                                <p>Launched dedicated sections for responsible litter guidance and Kennel Club–aligned health recommendations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section
                    id="testimonials"
                    className={`about__section about__testimonials ${visibleSections.testimonials ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>What Our Users Say</h2>
                    <div className="about__testimonials-grid">
                        <div className="about__testimonial-card">
                            <p className="about__testimonial-quote">
                                "My Pet Connect made finding the perfect stud for my golden retriever so easy.
                                The clear profiles and recommended health checks gave me complete peace of mind."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Sarah Mitchell</strong>
                                <span>Dog Breeder, Manchester</span>
                            </div>
                        </div>
                        <div className="about__testimonial-card">
                            <p className="about__testimonial-quote">
                                "As a professional handler, I appreciate how My Pet Connect highlights experience and
                                temperament. Breeders contact me knowing exactly what I offer."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Mark Davies</strong>
                                <span>Stud Handler, London</span>
                            </div>
                        </div>
                        <div className="about__testimonial-card">
                            <p className="about__testimonial-quote">
                                "The platform’s emphasis on responsible breeding—Kennel Club–recommended health tests and
                                temperament guidance—sets it apart. I’ve made valuable connections with other pet professionals."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Emma Williams</strong>
                                <span>Pet Owner, Birmingham</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;
