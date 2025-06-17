import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
// import './BlogArchivePage.css'; // Temporarily commented out

const BlogArchivePage = () => {
    const { monthYear } = useParams(); // e.g., "june-2025"
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log('🔥 BlogArchivePage rendered, monthYear:', monthYear);

    // Parse the month-year from URL
    const parseMonthYear = (slug) => {
        console.log('📅 Parsing monthYear slug:', slug);
        const parts = slug.split('-');
        if (parts.length === 2) {
            const month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            const year = parts[1];
            const result = { month, year, display: `${month} ${year}` };
            console.log('✅ Parsed date:', result);
            return result;
        }
        console.log('❌ Invalid date format');
        return null;
    };

    const parsedDate = parseMonthYear(monthYear);

    // Function to process posts for admin detection and company display
    const processPostForDisplay = async (postData, docId) => {
        console.log('🔍 Processing archive post:', docId, 'imageAlt from DB:', postData.imageAlt);

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

        const processedPost = {
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
            imageAlt: postData.imageAlt || '', // ADDED: Include imageAlt from database
            categories: postData.categories || [],
            slug: postData.slug || docId,
            createdAt: postData.createdAt?.toDate() || new Date()
        };

        console.log('✅ Processed archive post:', docId, 'final imageAlt:', processedPost.imageAlt);
        return processedPost;
    };

    useEffect(() => {
        console.log('🔄 useEffect triggered, monthYear:', monthYear);

        const fetchArchivePosts = async () => {
            if (!parsedDate) {
                console.log('❌ No parsed date, setting error');
                setError('Invalid date format');
                setLoading(false);
                return;
            }

            try {
                console.log('🚀 Starting to fetch posts...');
                setLoading(true);
                setError(null);

                // Create date range for the month
                const startDate = new Date(`${parsedDate.month} 1, ${parsedDate.year}`);
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

                console.log('📅 Date range:', { startDate, endDate });

                const blogsRef = collection(db, 'blogPosts');
                const q = query(
                    blogsRef,
                    where('status', '==', 'published'),
                    where('createdAt', '>=', Timestamp.fromDate(startDate)),
                    where('createdAt', '<=', Timestamp.fromDate(endDate)),
                    orderBy('createdAt', 'desc')
                );

                console.log('🔍 Executing Firestore query...');
                const querySnapshot = await getDocs(q);
                console.log('📊 Query results:', querySnapshot.size, 'documents');

                const archivePosts = [];

                // Process each post to determine admin status and display properties
                for (const docSnap of querySnapshot.docs) {
                    const postData = docSnap.data();
                    console.log('📄 Processing post:', docSnap.id, postData.title);

                    const processedPost = await processPostForDisplay(postData, docSnap.id);
                    archivePosts.push(processedPost);
                }

                console.log('✅ Archive posts processed:', archivePosts.length);
                setPosts(archivePosts);
            } catch (err) {
                console.error('💥 Error fetching archive posts:', err);
                setError('Failed to load posts for this archive.');
            } finally {
                console.log('🏁 Setting loading to false');
                setLoading(false);
            }
        };

        fetchArchivePosts();
    }, [monthYear]); // ✅ Only depend on monthYear, not parsedDate

    console.log('🎯 Render state:', { loading, error, postsCount: posts.length, parsedDate });

    if (loading) {
        console.log('⏳ Rendering loading state');
        return (
            <div style={{ padding: '20px', textAlign: 'center', background: 'white', minHeight: '50vh' }}>
                <h2>Loading archive for {monthYear}...</h2>
                <p>Fetching posts from Firestore...</p>
            </div>
        );
    }

    if (error || !parsedDate) {
        console.log('❌ Rendering error state');
        return (
            <div style={{ padding: '20px', background: 'white', minHeight: '50vh' }}>
                <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <ArrowLeft size={16} />
                    Back to Blog
                </Link>
                <h1>Error</h1>
                <p>{error || 'Invalid archive date'}</p>
                <p><strong>Debug info:</strong></p>
                <ul>
                    <li>monthYear param: {monthYear}</li>
                    <li>parsedDate: {JSON.stringify(parsedDate)}</li>
                    <li>error: {error}</li>
                </ul>
            </div>
        );
    }

    console.log('✅ Rendering main content');
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', background: 'white', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '40px' }}>
                <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none', color: '#0066cc' }}>
                    <ArrowLeft size={16} />
                    Back to Blog
                </Link>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '4px 12px', background: '#f0f8ff', borderRadius: '20px', fontSize: '14px' }}>
                        <Calendar size={16} />
                        Archive
                    </div>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>{parsedDate.display}</h1>
                    <p style={{ margin: '0', fontSize: '1.1rem', color: '#666' }}>
                        {posts.length} {posts.length === 1 ? 'article' : 'articles'} published in {parsedDate.display}
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div>
                {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9f9f9', borderRadius: '12px' }}>
                        <Calendar size={48} style={{ color: '#ccc', marginBottom: '20px' }} />
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>No articles found</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#666' }}>No articles were published in {parsedDate.display}.</p>
                        <Link to="/blog" style={{ display: 'inline-block', padding: '10px 20px', background: '#0066cc', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
                            Browse All Articles
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                style={{
                                    display: 'flex',
                                    gap: '20px',
                                    padding: '20px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: 'white'
                                }}
                                onClick={() => window.location.href = `/blog/${post.slug}`}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                                {/* Post Image */}
                                <div style={{ flexShrink: 0 }}>
                                    <img
                                        src={post.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&auto=format'}
                                        alt={post.imageAlt || post.title || 'Blog archive post image'} // FIXED: Use imageAlt from database first, then title as fallback
                                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                </div>

                                {/* Post Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '600', lineHeight: '1.4' }}>
                                            {post.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                                            <span>
                                                {post.createdAt.toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <span>•</span>
                                            <span>{post.readTime}</span>
                                        </div>
                                    </div>

                                    <p style={{ margin: '0 0 15px 0', color: '#555', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                        {post.excerpt}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#666' }}>
                                            <User size={14} />
                                            <span>{post.author}</span>
                                        </div>

                                        {post.categories.length > 0 && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {post.categories.slice(0, 2).map((category, index) => (
                                                    <span key={index} style={{
                                                        padding: '2px 8px',
                                                        background: '#e6f3ff',
                                                        color: '#0066cc',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {category}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogArchivePage;