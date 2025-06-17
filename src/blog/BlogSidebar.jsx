import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Calendar, Tag, User, Eye, Clock, ChevronRight } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path to your Firebase config
import './BlogSidebar.css';

const BlogSidebar = ({ currentPostId = null, onSearch = null }) => {
    const [popularPosts, setPopularPosts] = useState([]);
    const [recentPosts, setRecentPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [popularTags, setPopularTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
    const [newsletterMessage, setNewsletterMessage] = useState('');

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                setLoading(true);

                // Fetch all published blog posts
                const blogsRef = collection(db, 'blogPosts');
                const publishedQuery = query(
                    blogsRef,
                    where('status', '==', 'published'),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(publishedQuery);
                const allPosts = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // Apply same admin detection logic as RecentBlogPosts
                    let isAdminPost = false;
                    if (data.isAdminPost === true) isAdminPost = true;
                    if (data.author === 'MyPetConnect') isAdminPost = true;

                    const adminAuthorNames = ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan'];
                    if (!isAdminPost && data.author && adminAuthorNames.includes(data.author)) {
                        isAdminPost = true;
                    }

                    const displayAuthor = isAdminPost ? 'MyPetConnect' : (data.author || 'Anonymous');

                    allPosts.push({
                        id: doc.id,
                        title: data.title || 'Untitled',
                        author: displayAuthor,
                        date: data.date || data.createdAt?.toDate().toLocaleDateString('en-GB') || 'No date',
                        readTime: data.readTime || '5 min read',
                        image: data.image,
                        imageAlt: data.imageAlt || '', // ADDED: Include imageAlt from database
                        excerpt: data.excerpt,
                        categories: data.categories || [],
                        views: data.views || Math.floor(Math.random() * 1000) + 100, // Use actual views or random for demo
                        slug: data.slug || doc.id,
                        createdAt: data.createdAt?.toDate() || new Date()
                    });
                });

                // Filter out current post if specified
                const filteredPosts = allPosts.filter(post => post.id !== currentPostId);

                // Get popular posts (sorted by views)
                const popularPostsData = [...filteredPosts]
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 4);
                setPopularPosts(popularPostsData);

                // Get recent posts (already sorted by createdAt desc)
                const recentPostsData = filteredPosts.slice(0, 5);
                setRecentPosts(recentPostsData);

                // Store all posts for archive generation
                window.blogSidebarAllPosts = allPosts;

                // Extract and count categories
                const categoryCount = {};
                allPosts.forEach(post => {
                    if (post.categories && Array.isArray(post.categories)) {
                        post.categories.forEach(category => {
                            categoryCount[category] = (categoryCount[category] || 0) + 1;
                        });
                    }
                });

                // Convert to array and sort by count
                const categoriesData = Object.entries(categoryCount)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8); // Show top 8 categories
                setCategories(categoriesData);

                // Create popular tags from categories (you can extend this logic)
                const tagsData = categoriesData.map(cat => ({
                    name: cat.name.toLowerCase().replace(/\s+/g, '-'),
                    count: cat.count
                }));
                setPopularTags(tagsData);

            } catch (error) {
                console.error('Error fetching sidebar data:', error);
                // Fallback to empty arrays on error
                setPopularPosts([]);
                setRecentPosts([]);
                setCategories([]);
                setPopularTags([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, [currentPostId]);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();

        if (!newsletterEmail.trim()) {
            setNewsletterMessage('Please enter your email address.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newsletterEmail)) {
            setNewsletterMessage('Please enter a valid email address.');
            return;
        }

        try {
            setNewsletterSubmitting(true);
            setNewsletterMessage('');

            // Check if email already exists
            const existingQuery = query(
                collection(db, 'newsletter'),
                where('email', '==', newsletterEmail.toLowerCase().trim())
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
                setNewsletterMessage('This email is already subscribed!');
                setNewsletterEmail('');
                return;
            }

            // Add new subscriber
            await addDoc(collection(db, 'newsletter'), {
                email: newsletterEmail.toLowerCase().trim(),
                subscribedAt: serverTimestamp(),
                status: 'active',
                source: 'blog_sidebar'
            });

            setNewsletterMessage('Successfully subscribed! Thank you!');
            setNewsletterEmail('');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setNewsletterMessage('');
            }, 3000);

        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            setNewsletterMessage('Failed to subscribe. Please try again.');
        } finally {
            setNewsletterSubmitting(false);
        }
    };
    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (onSearch && searchTerm.trim()) {
            onSearch(searchTerm.trim());
        }
    };

    const formatDate = (dateString) => {
        try {
            if (dateString instanceof Date) {
                return dateString.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Generate archive data based on actual posts
    const generateArchive = () => {
        const archive = {};
        const allPosts = window.blogSidebarAllPosts || [];

        // Group all posts by month/year
        allPosts.forEach(post => {
            const date = post.createdAt || new Date();
            const monthYear = date.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
            archive[monthYear] = (archive[monthYear] || 0) + 1;
        });

        // Convert to array and sort by date (newest first)
        return Object.entries(archive)
            .map(([month, count]) => ({
                month,
                count,
                // Create a sortable date and URL slug
                sortDate: new Date(month + ' 1'),
                slug: month.toLowerCase().replace(' ', '-')
            }))
            .sort((a, b) => b.sortDate - a.sortDate)
            .slice(0, 6); // Show last 6 months
    };

    if (loading) {
        return (
            <aside className="blogsidebar-container">
                <div className="blogsidebar-loading">
                    <div className="blogsidebar-skeleton-block"></div>
                    <div className="blogsidebar-skeleton-block"></div>
                    <div className="blogsidebar-skeleton-block"></div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="blogsidebar-container">
            {/* Search Widget */}
            {onSearch && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <Search size={18} />
                        Search Posts
                    </h3>
                    <div className="blogsidebar-search">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                            className="blogsidebar-search-input"
                        />
                        <button
                            onClick={handleSearchSubmit}
                            className="blogsidebar-search-btn"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Popular Posts */}
            {popularPosts.length > 0 && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <TrendingUp size={18} />
                        Popular Posts
                    </h3>
                    <div className="blogsidebar-popular-posts-list">
                        {popularPosts.map((post, index) => (
                            <Link
                                key={`popular-${post.id}`}
                                to={`/blog/${post.slug}`}
                                className="blogsidebar-popular-post-item"
                            >
                                <div className="blogsidebar-popular-post-image">
                                    <img
                                        src={post.image || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=60&fit=crop`}
                                        alt={post.imageAlt || post.title || 'Popular blog post thumbnail'} // FIXED: Use imageAlt from database first
                                        onError={(e) => {
                                            e.target.src = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=60&fit=crop`;
                                        }}
                                    />
                                    <span className="blogsidebar-post-rank">#{index + 1}</span>
                                </div>
                                <div className="blogsidebar-popular-post-content">
                                    <h4>{post.title}</h4>
                                    <div className="blogsidebar-popular-post-meta">
                                        <span className="blogsidebar-post-views">
                                            <Eye size={12} />
                                            {post.views} views
                                        </span>
                                        <span className="blogsidebar-post-date">
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <Calendar size={18} />
                        Recent Posts
                    </h3>
                    <div className="blogsidebar-recent-posts-list">
                        {recentPosts.map(post => (
                            <Link
                                key={`recent-${post.id}`}
                                to={`/blog/${post.slug}`}
                                className="blogsidebar-recent-post-item"
                            >
                                <div className="blogsidebar-recent-post-content">
                                    <h4>{post.title}</h4>
                                    <div className="blogsidebar-recent-post-meta">
                                        <span className="blogsidebar-post-date">
                                            <Calendar size={12} />
                                            {formatDate(post.createdAt)}
                                        </span>
                                        <span className="blogsidebar-post-read-time">
                                            <Clock size={12} />
                                            {post.readTime}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="blogsidebar-post-arrow" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <Tag size={18} />
                        Categories
                    </h3>
                    <div className="blogsidebar-categories-list">
                        {categories.map(category => (
                            <Link
                                key={`category-${category.name}`}
                                to={`/blog/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="blogsidebar-category-item"
                            >
                                <span className="blogsidebar-category-name">{category.name}</span>
                                <span className="blogsidebar-category-count">({category.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <Tag size={18} />
                        Popular Tags
                    </h3>
                    <div className="blogsidebar-tags-cloud">
                        {popularTags.map(tag => (
                            <Link
                                key={`tag-${tag.name}`}
                                to={`/blog/category/${tag.name}`}
                                className="blogsidebar-tag-item"
                                style={{
                                    fontSize: `${Math.min(1.2, 0.8 + (tag.count / 10) * 0.4)}rem`
                                }}
                            >
                                {tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Newsletter Signup */}
            <div className="blogsidebar-widget blogsidebar-newsletter-widget">
                <h3 className="blogsidebar-widget-title">
                    <User size={18} />
                    Stay Updated
                </h3>
                <div className="blogsidebar-newsletter-content">
                    <p>Get the latest pet care tips and news delivered to your inbox.</p>
                    <form className="blogsidebar-newsletter-form" onSubmit={handleNewsletterSubmit}>
                        <input
                            type="email"
                            placeholder="Your email address"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="blogsidebar-newsletter-input"
                            disabled={newsletterSubmitting}
                            required
                        />
                        <button
                            type="submit"
                            className="blogsidebar-newsletter-btn"
                            disabled={newsletterSubmitting}
                        >
                            {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
                        </button>
                    </form>
                    {newsletterMessage && (
                        <p className={`blogsidebar-newsletter-message ${
                            newsletterMessage.includes('Successfully') ? 'success' : 'error'
                        }`}>
                            {newsletterMessage}
                        </p>
                    )}
                    <p className="blogsidebar-newsletter-disclaimer">
                        We respect your privacy. Unsubscribe at any time.
                    </p>
                </div>
            </div>

            {/* Archive */}
            {recentPosts.length > 0 && (
                <div className="blogsidebar-widget">
                    <h3 className="blogsidebar-widget-title">
                        <Calendar size={18} />
                        Archive
                    </h3>
                    <div className="blogsidebar-archive-list">
                        {generateArchive().map(({ month, count, slug }) => (
                            <Link
                                key={`archive-${month}`}
                                to={`/blog/archive/${slug}`}
                                className="blogsidebar-archive-item"
                            >
                                <span>{month}</span>
                                <span className="blogsidebar-archive-count">({count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default BlogSidebar;