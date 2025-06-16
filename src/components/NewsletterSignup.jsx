import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPaperPlane, faCheck } from '@fortawesome/free-solid-svg-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase'; // Adjust path as needed
import './NewsletterSignup.css';

const NewsletterSignup = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setStatus('error');
            setMessage('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            // Call your existing Firebase Function
            const addNewsletterSubscriber = httpsCallable(functions, 'addNewsletterSubscriber');

            const result = await addNewsletterSubscriber({
                email: email.toLowerCase().trim()
            });

            console.log('Newsletter subscription result:', result.data);

            setStatus('success');
            setMessage('Thank you for subscribing! Welcome to our newsletter.');
            setEmail('');

            // Reset status after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');

            // Handle specific error messages from your Firebase Function
            if (error.message.includes('already subscribed') || error.message.includes('Email already subscribed')) {
                setMessage('This email is already subscribed to our newsletter.');
            } else if (error.message.includes('Valid email is required')) {
                setMessage('Please enter a valid email address.');
            } else {
                setMessage('Something went wrong. Please try again later.');
            }
        }
    };

    return (
        <section className="newsletter-section">
            <div className="newsletter-container">
                <div className="newsletter-columns">
                    {/* Left Column - Content */}
                    <div className="newsletter-left">

                        <p className="newsletter-description">
                            Get expert tips, breeding insights, and the latest pet care advice delivered straight to your inbox. Join thousands of pet lovers who trust our weekly newsletter.
                        </p>


                    </div>

                    {/* Right Column - Form */}
                    <div className="newsletter-right">
                        <form onSubmit={handleSubmit}>
                            <div className="newsletter-input-group">
                                <div className="newsletter-input-wrapper">
                                    <FontAwesomeIcon icon={faEnvelope} className="newsletter-input-icon" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address for newsletter signup"
                                        className="newsletter-input"
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`newsletter-button ${status === 'success' ? 'success' : ''}`}
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' && (
                                        <>
                                            <span className="newsletter-spinner"></span>
                                            Subscribing...
                                        </>
                                    )}

                                    {status === 'success' && (
                                        <>
                                            <FontAwesomeIcon icon={faCheck} />
                                            Subscribed!
                                        </>
                                    )}

                                    {(status === 'idle' || status === 'error') && (
                                        <>
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                            Subscribe
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Message Display */}
                        {message && (
                            <div className={`newsletter-message ${status}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NewsletterSignup;