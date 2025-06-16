import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path to your Firebase config
import { Calendar, ArrowRight, User, Tag, ArrowLeft } from 'lucide-react';
import './BlogCategory.css'; // You'll need to create this CSS file

const BlogCategoryPage = () => {
    const { categoryName } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Decode the category name from URL
    const decodedCategory = decodeURIComponent(categoryName).replace(/-/g, ' ');

    // Capitalize first letter of each word for display
    const displayCategory = decodedCategory
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

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

        // Method 3: Check if authorId exists and fetch user data (always do this for admin posts to get company name)
        if (postData.authorId) {
            try {
                console.log('🔍 Fetching user data for authorId:', postData.authorId);

                // Check adminUsers collection first
                const adminUserDoc = await getDoc(doc(db, 'adminUsers', postData.authorId));
                if (adminUserDoc.exists()) {
                    const userData = adminUserDoc.data();
                    console.log('👤 Admin user data found:', userData);
                    if (!isAdminPost) {
                        isAdminPost = true;
                        console.log('✅ Admin post detected via adminUsers collection');
                    }
                    // Store the company name for later use
                    companyName = userData.company || 'MyPetConnect';
                    console.log('📊 Company name set to:', companyName);
                } else {
                    // Fallback: check regular users collection
                    const userDoc = await getDoc(doc(db, 'users', postData.authorId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('👤 User data found:', userData);
                        if (userData.isAdmin === true) {
                            if (!isAdminPost) {
                                isAdminPost = true;
                                console.log('✅ Admin post detected via user isAdmin flag');
                            }
                            companyName = userData.company || 'MyPetConnect';
                            console.log('📊 Company name set to:', companyName);
                        } else {
                            console.log('❌ User is not admin, isAdmin:', userData.isAdmin);
                        }
                    } else {
                        console.log('❌ No user document found in either collection for authorId:', postData.authorId);
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
            image: postData.image,
            categories: postData.categories || [],
            slug: postData.slug || docId,
            createdAt: postData.createdAt?.toDate() || new Date()
        };
    };

    useEffect(() => {
        const fetchCategoryPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Query posts that contain this category
                const blogsRef = collection(db, 'blogPosts');
                const q = query(
                    blogsRef,
                    where('status', '==', 'published'),
                    where('categories', 'array-contains', displayCategory),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const categoryPosts = [];

                // Process each post to determine admin status and display properties
                for (const docSnap of querySnapshot.docs) {
                    const postData = docSnap.data();
                    const processedPost = await processPostForDisplay(postData, docSnap.id);
                    categoryPosts.push(processedPost);
                }

                setPosts(categoryPosts);
                console.log('✅ Processed category posts:', categoryPosts);
            } catch (err) {
                console.error('Error fetching category posts:', err);
                setError('Failed to load posts for this category.');
            } finally {
                setLoading(false);
            }
        };

        if (displayCategory) {
            fetchCategoryPosts();
        }
    }, [displayCategory]);

    if (loading) {
        return (
            <div className="blog-category-page">
                <div className="blog-category-container">
                    <div className="blog-category-header">
                        <div className="blog-category-loading">
                            <div className="blog-category-skeleton-title"></div>
                            <div className="blog-category-skeleton-subtitle"></div>
                        </div>
                    </div>
                    <div className="blog-category-content">
                        <div className="blog-category-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="blog-category-card-skeleton">
                                    <div className="blog-category-card-image-skeleton"></div>
                                    <div className="blog-category-card-content-skeleton">
                                        <div className="blog-category-card-title-skeleton"></div>
                                        <div className="blog-category-card-excerpt-skeleton"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="blog-category-page">
                <div className="blog-category-container">
                    <div className="blog-category-header">
                        <Link to="/blog" className="blog-category-back-link">
                            <ArrowLeft size={16} />
                            Back to Blog
                        </Link>
                        <h1 className="blog-category-title">Error</h1>
                        <p className="blog-category-subtitle">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-category-page">
            <div className="blog-category-container">
                {/* Header */}
                <div className="blog-category-header">
                    <Link to="/blog" className="blog-category-back-link">
                        <ArrowLeft size={16} />
                        Back to Blog
                    </Link>
                    <div className="blog-category-title-section">
                        <div className="blog-category-badge">
                            <Tag size={16} />
                            Category
                        </div>
                        <h1 className="blog-category-title">{displayCategory}</h1>
                        <p className="blog-category-subtitle">
                            {posts.length} {posts.length === 1 ? 'article' : 'articles'} in this category
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="blog-category-content">
                    {posts.length === 0 ? (
                        <div className="blog-category-empty">
                            <Tag size={48} />
                            <h3>No articles found</h3>
                            <p>There are no published articles in the "{displayCategory}" category yet.</p>
                            <Link to="/blog" className="blog-category-empty-link">
                                Browse All Articles
                            </Link>
                        </div>
                    ) : (
                        <div className="blog-category-grid">
                            {posts.map((post) => (
                                <article
                                    key={post.id}
                                    className="blog-category-card"
                                    onClick={() => window.location.href = `/blog/${post.slug}`}
                                >
                                    {/* Image */}
                                    <div className="blog-category-card-image-container">
                                        <img
                                            src={post.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&auto=format'}
                                            alt={post.title}
                                            className="blog-category-card-image"
                                        />
                                        <div className="blog-category-card-read-time">
                                            {post.readTime}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="blog-category-card-content">
                                        <h3 className="blog-category-card-title">
                                            {post.title}
                                        </h3>

                                        <p className="blog-category-card-excerpt">
                                            {post.excerpt}
                                        </p>

                                        {/* Categories */}
                                        <div className="blog-category-card-categories">
                                            {post.categories.slice(0, 2).map((category, index) => (
                                                <span key={index} className="blog-category-card-category-tag">
                                                    {category}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Meta Information */}
                                        <div className="blog-category-card-meta">
                                            <div className="blog-category-card-meta-left">
                                                <div className="blog-category-card-meta-item">
                                                    <User size={14} />
                                                    <span>{post.author}</span>
                                                </div>
                                                <div className="blog-category-card-meta-item">
                                                    <Calendar size={14} />
                                                    <span>{post.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogCategoryPage;