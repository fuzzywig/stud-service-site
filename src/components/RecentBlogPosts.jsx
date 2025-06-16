import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import './RecentBlogPosts.css';

const RecentBlogPosts = () => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to process posts for admin detection and company display
    const processPostForDisplay = async (postData, docId) => {
        let isAdminPost = false;
        let displayAuthor = postData.author || 'Anonymous';
        let companyName = null;

        // Method 1: Direct flag
        if (postData.isAdminPost === true) {
            isAdminPost = true;
            console.log('✅ Admin post detected via isAdminPost flag');
        }

        // Method 2: Author name check for any admin names
        const adminAuthorNames = ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan', 'Company', 'Info'];
        if (postData.author && adminAuthorNames.includes(postData.author)) {
            isAdminPost = true;
            console.log('✅ Admin post detected via author name:', postData.author);
        }

        // Method 3: Check if authorId exists and fetch user data
        if (postData.authorId) {
            try {
                console.log('🔍 Fetching user data for authorId:', postData.authorId);

                // Strategy 1: Check adminUsers collection by document ID
                const adminUserDoc = await getDoc(doc(db, 'adminUsers', postData.authorId));
                if (adminUserDoc.exists()) {
                    const userData = adminUserDoc.data();
                    console.log('👤 Admin user data found by document ID:', userData);
                    if (!isAdminPost) {
                        isAdminPost = true;
                        console.log('✅ Admin post detected via adminUsers collection');
                    }
                    companyName = userData.company || 'MyPetConnect';
                    console.log('📊 Company name set to:', companyName);
                } else {
                    // Strategy 2: Check adminUsers collection by uid field
                    const adminUserQuery = query(
                        collection(db, 'adminUsers'),
                        where('uid', '==', postData.authorId)
                    );
                    const adminUserSnapshot = await getDocs(adminUserQuery);

                    if (!adminUserSnapshot.empty) {
                        const userData = adminUserSnapshot.docs[0].data();
                        console.log('👤 Admin user data found by uid field:', userData);
                        if (!isAdminPost) {
                            isAdminPost = true;
                            console.log('✅ Admin post detected via adminUsers collection (uid search)');
                        }
                        companyName = userData.company || 'MyPetConnect';
                        console.log('📊 Company name set to:', companyName);
                    } else {
                        // Strategy 3: Check regular users collection by document ID
                        const userDoc = await getDoc(doc(db, 'users', postData.authorId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log('👤 User data found by document ID:', userData);
                            if (userData.isAdmin === true) {
                                if (!isAdminPost) {
                                    isAdminPost = true;
                                    console.log('✅ Admin post detected via user isAdmin flag');
                                }
                                companyName = userData.company || 'MyPetConnect';
                                console.log('📊 Company name set to:', companyName);
                            }
                        } else {
                            // Strategy 4: Check regular users collection by uid field
                            const userQuery = query(
                                collection(db, 'users'),
                                where('uid', '==', postData.authorId)
                            );
                            const userSnapshot = await getDocs(userQuery);

                            if (!userSnapshot.empty) {
                                const userData = userSnapshot.docs[0].data();
                                console.log('👤 User data found by uid field:', userData);
                                if (userData.isAdmin === true) {
                                    if (!isAdminPost) {
                                        isAdminPost = true;
                                        console.log('✅ Admin post detected via user isAdmin flag (uid search)');
                                    }
                                    companyName = userData.company || 'MyPetConnect';
                                    console.log('📊 Company name set to:', companyName);
                                }
                            } else {
                                console.log('❌ No user document found in either collection for authorId:', postData.authorId);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('❌ Could not fetch author user data:', error);
            }
        }

        // Set display values based on admin status
        if (isAdminPost) {
            displayAuthor = companyName || 'MyPetConnect';
        }

        return {
            id: docId,
            title: postData.title || 'Untitled',
            excerpt: postData.excerpt || 'No excerpt available',
            author: displayAuthor,
            originalAuthor: postData.author, // Keep original for reference
            isAdminPost: isAdminPost,
            companyName: companyName,
            date: postData.date || postData.createdAt?.toDate().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) || 'No date',
            readTime: postData.readTime || '5 min read',
            image: postData.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&auto=format',
            category: postData.categories?.[0] || 'General',
            categories: postData.categories || [postData.categories?.[0] || 'General'],
            slug: postData.slug || docId,
            status: postData.status,
            views: postData.views || 0
        };
    };

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                setLoading(true);

                const blogsRef = collection(db, 'blogPosts');
                const q = query(
                    blogsRef,
                    orderBy('createdAt', 'desc'),
                    limit(20) // Fetch more posts to account for filtering
                );

                const querySnapshot = await getDocs(q);
                const posts = [];

                // Process each post to determine admin status and display properties
                for (const docSnap of querySnapshot.docs) {
                    const postData = docSnap.data();

                    // Only include published posts
                    if (postData.status === 'published') {
                        // Check if post has "Dog Breed Guides" in categories
                        const categories = postData.categories || [];
                        const hasDogBreedGuides = categories.some(cat =>
                            cat && cat.toString().toLowerCase().includes('dog breed guides')
                        );

                        // Skip posts with "Dog Breed Guides" category
                        if (!hasDogBreedGuides) {
                            const processedPost = await processPostForDisplay(postData, docSnap.id);
                            posts.push(processedPost);

                            // Stop when we have 4 posts to display
                            if (posts.length >= 4) {
                                break;
                            }
                        }
                    }
                }

                setBlogPosts(posts);
                setError(null);
                console.log('✅ Processed recent blog posts (excluding Dog Breed Guides):', posts);
            } catch (err) {
                console.error('Error fetching blog posts:', err);
                setError('Failed to load blog posts');
                setBlogPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPosts();
    }, []);

    if (loading) {
        return (
            <section className="blog-section">
                <div className="blog-section__container">
                    <div className="blog-section__header">
                        <div className="blog-section__badge">
                            Latest Insights
                        </div>
                        <h2 className="blog-section__title">
                            New Articles & Updates
                        </h2>
                        <p className="blog-section__description">
                            Stay updated with the latest trends, insights, and best practices from our expert team
                        </p>
                    </div>
                    <div className="blog-section__grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="blog-card">
                                <div className="blog-card__image-container">
                                    <div className="blog-card__image" style={{backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        Loading...
                                    </div>
                                </div>
                                <div className="blog-card__content">
                                    <div className="blog-card__title" style={{backgroundColor: '#f3f4f6', height: '1.5rem', borderRadius: '0.25rem'}}></div>
                                    <div className="blog-card__excerpt" style={{backgroundColor: '#f3f4f6', height: '3rem', borderRadius: '0.25rem', marginTop: '0.5rem'}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="blog-section">
                <div className="blog-section__container">
                    <div className="blog-section__header">
                        <div className="blog-section__badge">
                            Latest Insights
                        </div>
                        <h2 className="blog-section__title">
                            New Articles & Updates
                        </h2>
                        <p className="blog-section__description">
                            {error}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (blogPosts.length === 0) {
        return (
            <section className="blog-section">
                <div className="blog-section__container">
                    <div className="blog-section__header">
                        <div className="blog-section__badge">
                            Latest Insights
                        </div>
                        <h2 className="blog-section__title">
                            New Articles & Updates
                        </h2>
                        <p className="blog-section__description">
                            No blog posts available at the moment. Check back soon!
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="blog-section">
            <div className="blog-section__container">
                <div className="blog-section__header">
                    <h2 className="blog-section__title">
                        New Articles & Updates
                    </h2>
                    <p className="blog-section__description">
                        Stay updated with the latest trends, insights, and best practices from our expert team
                    </p>
                </div>

                <div className="blog-section__grid">
                    {blogPosts.map((post) => (
                        <article
                            key={post.id}
                            className="blog-card"
                            onClick={() => {
                                // Navigate to blog post - you can customize this URL structure
                                window.location.href = `/blog/${post.slug}`;
                            }}
                        >
                            <div className="blog-card__image-container">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="blog-card__image"
                                />
                                <div className="blog-card__category">
                                    {post.category}
                                </div>
                            </div>

                            <div className="blog-card__content">
                                <h3 className="blog-card__title">
                                    {post.title}
                                </h3>

                                {/* Categories */}
                                <div className="blog-card__categories">
                                    {/* Show first 2 categories, or fallback to the single category we stored */}
                                </div>

                                <p className="blog-card__excerpt">
                                    {post.excerpt}
                                </p>

                                <div className="blog-card__meta">
                                    <div className="blog-card__meta-left">
                                        <div className="blog-card__meta-item">
                                            <User className="w-4 h-4" />
                                            <span>{post.author}</span>
                                        </div>
                                        <div className="blog-card__meta-item">
                                            <Calendar className="w-4 h-4" />
                                            <span>{post.date}</span>
                                        </div>
                                    </div>
                                    <span className="blog-card__read-time">{post.readTime}</span>
                                </div>

                                <button className="blog-card__read-more">
                                    <span>Read Article</span>
                                    <ArrowRight className="blog-card__read-more-icon" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="blog-section__cta-container">
                    <button
                        className="blog-section__cta-button"
                        onClick={() => window.location.href = '/blog'}
                    >
                        <span>View All Articles</span>
                        <ArrowRight className="blog-section__cta-icon" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RecentBlogPosts;