import React, { useEffect, useState } from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaChevronUp } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getPopularBreeds } from "../utils/getPopularBreeds";
import { createSlug } from '../utils/blogUtils'; // Add this import

const Footer = ({ onResetCookieConsent }) => {
    const [popularBreeds, setPopularBreeds] = useState({ dog: [], cat: [] });
    const [latestArticles, setLatestArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getPopularBreeds();
            console.log("🔥 Popular breeds loaded:", data);
            setPopularBreeds(data);
        };
        load().catch(console.error);
    }, []);

    useEffect(() => {
        const fetchLatestArticles = async () => {
            try {
                setLoadingArticles(true);

                // Query for latest published blog posts
                const q = query(
                    collection(db, 'blogPosts'),
                    where('status', '==', 'published'),
                    orderBy('createdAt', 'desc'),
                    limit(5) // Get 5 latest articles for footer
                );

                const querySnapshot = await getDocs(q);
                const articles = querySnapshot.docs.map(doc => {
                    const docData = doc.data();

                    // Generate slug if it doesn't exist
                    let slug = docData.slug;
                    if (!slug && docData.title) {
                        slug = createSlug(docData.title);
                        console.log(`Generated slug for footer article "${docData.title}": ${slug}`);
                    }

                    return {
                        id: doc.id,
                        title: docData.title,
                        date: docData.createdAt ? docData.createdAt.toDate() : new Date(),
                        categories: docData.categories || (docData.category ? [docData.category] : []),
                        slug: slug || doc.id // Fallback to document ID if no slug
                    };
                });

                setLatestArticles(articles);
                console.log("📰 Latest articles loaded:", articles);
            } catch (error) {
                console.error('Error fetching latest articles:', error);
                setLatestArticles([]);
            } finally {
                setLoadingArticles(false);
            }
        };

        fetchLatestArticles();
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateTitle = (title, maxLength = 45) => {
        if (!title) return 'Untitled Article';
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength).trim() + '...';
    };

    return (
        <footer className="mpc-footer">
            <div className="mpc-footer-content">
                <div className="mpc-footer-col">
                    <img src="https://placehold.co/120x70" alt="My Pet Connect Logo" className="mpc-footer-logo" />
                    <p>The UK's trusted pet marketplace connecting families with responsible breeders nationwide. Find puppies, kittens, and pets for sale from verified breeders, or discover rescue animals looking for loving homes. Safe, secure platform with health guarantees and breeder reviews.</p>
                    <div className="mpc-footer-social-icons">
                        <a href="https://www.facebook.com/mypetconnectuk" target="_blank" rel="noopener noreferrer">
                            <FaFacebookF />
                        </a>
                        <a href="https://www.instagram.com/mypetconnectuk/" target="_blank" rel="noopener noreferrer">
                            <FaInstagram />
                        </a>
                    </div>
                </div>

                <div className="mpc-footer-col">
                    <h4>Popular Dog Breeds</h4>
                    <ul>
                        {popularBreeds.dog.map((breed, i) => (
                            <li key={i}>
                                <Link to={`/browse?category=dogs&breed=${encodeURIComponent(breed)}`}>
                                    {breed}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mpc-footer-col">
                    <h4>Popular Cat Breeds</h4>
                    <ul>
                        {popularBreeds.cat.map((breed, i) => (
                            <li key={i}>
                                <Link to={`/browse?category=cats&breed=${encodeURIComponent(breed)}`}>
                                    {breed}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mpc-footer-col">
                    <h4>Latest Articles</h4>
                    {loadingArticles ? (
                        <ul>
                            {[...Array(3)].map((_, i) => (
                                <li key={i} className="mpc-footer-article-skeleton">
                                    <div className="mpc-footer-skeleton-line"></div>
                                    <div className="mpc-footer-skeleton-date"></div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul>
                            {latestArticles.length > 0 ? (
                                latestArticles.map((article) => (
                                    <li key={article.id} className="mpc-footer-article-item">
                                        <Link to={`/blog/${article.slug || article.id}`} className="mpc-footer-article-link">
                                            <span className="mpc-footer-article-title">
                                                {truncateTitle(article.title)}
                                            </span>
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <Link to="/blog">No articles available</Link>
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                <div className="mpc-footer-col">
                    <h4>Company & Support</h4>
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/terms-of-service">Terms of Service</Link></li>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/cookie-policy">Cookie Policy</Link></li>
                        <li><Link to="/help">FAQ</Link></li>
                        <li><Link to="/blog">Articles</Link></li>
                        <li><Link to="/breeding-guide">Breeding Guide</Link></li>
                        <li><Link to="/help?tab=ticket">Contact Us</Link></li>
                    </ul>
                </div>
            </div>

            <div className="mpc-footer-bottom">
                <div className="mpc-footer-container mpc-footer-bottom-flex">
                    <div className="mpc-footer-cookie-info">
                        © 2025 My Pet Connect. This site uses cookies to personalise content and analyse traffic.
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            onResetCookieConsent();
                        }}> Manage Cookie Preferences</a>
                    </div>

                    <div className="mpc-footer-scroll-top" onClick={scrollToTop}>
                        <FaChevronUp />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;