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
            number: '50K+',
            title: 'Active Members',
            description: 'Join our thriving community of pet lovers and breeders'
        },
        {
            number: '15K+',
            title: 'Verified Breeders',
            description: 'All breeders are thoroughly vetted for quality and trust'
        },
        {
            number: '100K+',
            title: 'Successful Matches',
            description: 'Connecting pets with their perfect families since 2020'
        },
        {
            number: '4.8/5',
            title: 'User Rating',
            description: 'Consistently rated excellent by our community members'
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
                                <strong>Welcome to My Pet Connect</strong> — your trusted partner for all things pets.
                            </p>
                            <p className="about__text">
                                My Pet Connect was born from firsthand experience. Having provided stud services myself,
                                I quickly realised the existing platforms fell short. Key features were missing, and vital
                                information about studs was often lacking — making it hard for breeders and pet owners to
                                find exactly what they needed.
                            </p>
                            <p className="about__text">
                                Determined to do better, I created My Pet Connect to fill that gap. What began as a
                                dedicated stud service platform has since evolved into a comprehensive pet community,
                                connecting owners, breeders, and enthusiasts across a wide range of pet needs.
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
                        To offer a reliable, transparent, and feature-rich platform that serves the entire pet
                        community — from stud services and litters to pet adoption and trusted breeders. We believe
                        every pet deserves the best match, and every pet owner deserves clear, accessible information.
                    </p>
                </section>

                {/* What Sets Us Apart */}
                <section
                    id="features"
                    className={`about__section ${visibleSections.features ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__features-title">Our Achievements</h2>
                    <div className="about__features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="about__feature-card">
                                <div className="about__feature-number">{feature.number}</div>
                                <h3 className="about__feature-title">{feature.title}</h3>
                                <p className="about__feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team Section */}
                <section
                    id="team"
                    className={`about__section about__team ${visibleSections.team ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__team-title">Our Team</h2>
                    <div className="about__team-grid">
                        <div className="about__team-member">
                            <div className="about__team-image">
                                <img src="https://via.placeholder.com/300x300/f0f0f0/999999?text=Team+Member" alt="John Davidson" />
                            </div>
                            <h3 className="about__team-name">John Davidson</h3>
                            <p className="about__team-role">Founder & CEO</p>
                            <p className="about__team-bio">
                                With over 15 years experience in pet breeding and a passion for connecting
                                pet lovers, John founded My Pet Connect to revolutionize how breeders and
                                owners find each other.
                            </p>
                        </div>
                        <div className="about__team-member">
                            <div className="about__team-image">
                                <img src="https://via.placeholder.com/300x300/f0f0f0/999999?text=Team+Member" alt="Sarah Mitchell" />
                            </div>
                            <h3 className="about__team-name">Sarah Mitchell</h3>
                            <p className="about__team-role">Head of Community</p>
                            <p className="about__team-bio">
                                Sarah brings her veterinary background and love for animals to ensure our
                                community maintains the highest standards of pet welfare and breeder integrity.
                            </p>
                        </div>
                        <div className="about__team-member">
                            <div className="about__team-image">
                                <img src="https://via.placeholder.com/300x300/f0f0f0/999999?text=Team+Member" alt="David Chen" />
                            </div>
                            <h3 className="about__team-name">David Chen</h3>
                            <p className="about__team-role">Chief Technology Officer</p>
                            <p className="about__team-bio">
                                David leads our tech team in building innovative features that make pet
                                matching seamless and secure. His expertise ensures our platform stays
                                cutting-edge and user-friendly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section
                    id="stats"
                    className={`about__section about__stats ${visibleSections.stats ? 'about__section--visible' : ''}`}
                >
                    <div className="about__stats-grid">
                        <div className="about__stat-item">
                            <div className="about__stat-number">50K+</div>
                            <div className="about__stat-label">Active Members</div>
                        </div>
                        <div className="about__stat-item">
                            <div className="about__stat-number">15K+</div>
                            <div className="about__stat-label">Verified Breeders</div>
                        </div>
                        <div className="about__stat-item">
                            <div className="about__stat-number">100K+</div>
                            <div className="about__stat-label">Successful Matches</div>
                        </div>
                        <div className="about__stat-item">
                            <div className="about__stat-number">4.8/5</div>
                            <div className="about__stat-label">User Rating</div>
                        </div>
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
                            <h3 className="about__value-title">Integrity</h3>
                            <p className="about__value-text">
                                We maintain the highest standards of honesty and transparency in all our interactions.
                            </p>
                        </div>
                        <div className="about__value-item">
                            <h3 className="about__value-title">Compassion</h3>
                            <p className="about__value-text">
                                Every pet deserves love and care. We're committed to their wellbeing above all else.
                            </p>
                        </div>
                        <div className="about__value-item">
                            <h3 className="about__value-title">Innovation</h3>
                            <p className="about__value-text">
                                We continuously improve our platform to better serve the pet community's evolving needs.
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
                            <div className="about__timeline-year">2020</div>
                            <div className="about__timeline-content">
                                <h4>Founded</h4>
                                <p>Started as a simple platform for stud services</p>
                            </div>
                        </div>
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">2021</div>
                            <div className="about__timeline-content">
                                <h4>Expanded Services</h4>
                                <p>Added breeder verification and messaging features</p>
                            </div>
                        </div>
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">2023</div>
                            <div className="about__timeline-content">
                                <h4>Community Growth</h4>
                                <p>Reached 25,000 active members milestone</p>
                            </div>
                        </div>
                        <div className="about__timeline-item">
                            <div className="about__timeline-year">2024</div>
                            <div className="about__timeline-content">
                                <h4>Full Platform</h4>
                                <p>Launched comprehensive pet community features</p>
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
                                The verification process gave me complete peace of mind."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Sarah Johnson</strong>
                                <span>Dog Breeder, Manchester</span>
                            </div>
                        </div>
                        <div className="about__testimonial-card">
                            <p className="about__testimonial-quote">
                                "As a professional breeder, I appreciate the detailed profiles and messaging system.
                                It's revolutionized how I connect with potential clients."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Michael Chen</strong>
                                <span>Cat Breeder, London</span>
                            </div>
                        </div>
                        <div className="about__testimonial-card">
                            <p className="about__testimonial-quote">
                                "The platform's transparency and community features set it apart.
                                I've made valuable connections with other pet enthusiasts."
                            </p>
                            <div className="about__testimonial-author">
                                <strong>Emma Williams</strong>
                                <span>Pet Owner, Birmingham</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section
                    id="contact"
                    className={`about__section about__contact ${visibleSections.contact ? 'about__section--visible' : ''}`}
                >
                    <h2 className="about__contact-title">Get in Touch</h2>
                    <p className="about__contact-text">
                        We're here to help. Whether you have questions, feedback, or need support,
                        don't hesitate to reach out.
                    </p>
                    <a href="/contact" className="about__contact-button">
                        Contact Us
                    </a>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;