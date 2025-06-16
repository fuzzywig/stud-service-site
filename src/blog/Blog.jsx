import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Search, Calendar, Clock, User, Tag, Filter, Heart, Share2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import BlogSidebar from './BlogSidebar';
import { createSlug } from '../utils/blogUtils';
import './Blog.css';

export default function Blog() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const postsPerPage = 6;

    // Function to detect admin posts and set proper author display
    const processPostForDisplay = async (post) => {
        let isAdminPost = false;
        let displayAuthor = post.author || 'Unknown Author';
        let displayInitials = getAuthorInitials(post.author);
        let companyName = null;

        // Method 1: Direct flag
        if (post.isAdminPost === true) {
            isAdminPost = true;
            console.log('✅ Admin post detected via isAdminPost flag');
        }

        // Method 2: Author name check for any admin names
        const adminAuthorNames = ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan', 'Company', 'Info'];
        if (post.author && adminAuthorNames.includes(post.author)) {
            isAdminPost = true;
            console.log('✅ Admin post detected via author name:', post.author);
        }

        // Method 3: Check if authorId exists and fetch user data (always do this for admin posts to get company name)
        if (post.authorId) {
            try {
                console.log('🔍 Fetching user data for authorId:', post.authorId);

                // Check adminUsers collection first
                const adminUserDoc = await getDoc(doc(db, 'adminUsers', post.authorId));
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
                    const userDoc = await getDoc(doc(db, 'users', post.authorId));
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
                        console.log('❌ No user document found in either collection for authorId:', post.authorId);
                    }
                }
            } catch (error) {
                console.log('❌ Could not fetch author user data:', error);
            }
        }

        // Set display values based on admin status
        if (isAdminPost) {
            displayAuthor = companyName || 'MyPetConnect';
            // Generate initials from company name
            displayInitials = companyName
                ? companyName.split(' ').map(word => word[0]).join('').toUpperCase()
                : 'MPC';
        }

        return {
            ...post,
            isAdminPost,
            displayAuthor,
            displayInitials,
            companyName,
            // Preserve the slug that was generated in fetchPosts
            slug: post.slug || post.id
        };
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);

                let q = collection(db, 'blogPosts');

                switch (sortBy) {
                    case 'oldest':
                        q = query(q, orderBy('createdAt', 'asc'));
                        break;
                    case 'views':
                        q = query(q, orderBy('views', 'desc'));
                        break;
                    default:
                        q = query(q, orderBy('createdAt', 'desc'));
                }

                const querySnapshot = await getDocs(q);
                const data = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
                    const docData = docSnapshot.data();
                    const { id: _, ...cleanDocData } = docData;

                    // Generate SEO-friendly slug if it doesn't exist
                    let slug = docData.slug;
                    if (!slug && docData.title) {
                        slug = createSlug(docData.title);
                        console.log(`Generated slug for "${docData.title}": ${slug}`);

                        // Save the slug back to the database
                        try {
                            const docRef = doc(db, 'blogPosts', docSnapshot.id);
                            await updateDoc(docRef, { slug: slug });
                            console.log(`✅ Saved slug to database: ${slug}`);
                        } catch (error) {
                            console.error('❌ Error saving slug:', error);
                        }
                    }

                    return {
                        id: docSnapshot.id,
                        ...cleanDocData,
                        slug: slug || docSnapshot.id,
                        date: docData.createdAt ? docData.createdAt.toDate().toLocaleDateString() : docData.date,
                        views: docData.views || 0
                    };
                }));

                // Filter for published posts only
                const publishedPosts = data.filter(post => post.status === 'published');

                // Process each post to determine admin status and display properties
                const processedPosts = await Promise.all(
                    publishedPosts.map(post => processPostForDisplay(post))
                );

                // Validation and debugging
                processedPosts.forEach((post, index) => {
                    if (!post.id || post.id === '') {
                        console.warn(`Post ${index} has invalid ID:`, post.id, post);
                    }
                    if (!post.slug) {
                        console.warn(`Post ${index} has no slug:`, post.title, post);
                    }
                });

                setPosts(processedPosts);
                console.log('Fetched and processed posts:', processedPosts);

                // Log SEO URLs for debugging
                console.log('SEO URLs:', processedPosts.map(post => ({
                    title: post.title,
                    url: `/blog/${post.slug}`,
                    fallbackUrl: `/blog/${post.id}`
                })));

            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [sortBy]);

    // Updated to use the new unified categories system
    const allTags = React.useMemo(() => {
        const tags = posts
            .flatMap(post => {
                // Check both old tags and new categories
                const oldTags = post.tags && Array.isArray(post.tags) ? post.tags : [];
                const newCategories = post.categories && Array.isArray(post.categories) ? post.categories : [];
                return [...oldTags, ...newCategories];
            })
            .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => tag.trim());

        const uniqueTags = [...new Set(tags)].sort();
        console.log('Processed tags:', uniqueTags);
        return uniqueTags;
    }, [posts]);

    const allCategories = React.useMemo(() => {
        const categories = posts
            .flatMap(post => {
                // Check both old category and new categories
                const oldCategory = post.category ? [post.category] : [];
                const newCategories = post.categories && Array.isArray(post.categories) ? post.categories : [];
                return [...oldCategory, ...newCategories];
            })
            .filter(category => category && typeof category === 'string' && category.trim().length > 0)
            .map(category => category.trim());

        const uniqueCategories = [...new Set(categories)].sort();
        console.log('Processed categories:', uniqueCategories);
        return uniqueCategories;
    }, [posts]);

    // Updated filter logic for unified categories
    const filteredPosts = posts.filter(post => {
        const matchesCategory = !selectedCategory ||
            post.category === selectedCategory ||
            (Array.isArray(post.categories) && post.categories.includes(selectedCategory));

        const matchesTag = !selectedTag ||
            (Array.isArray(post.tags) && post.tags.includes(selectedTag)) ||
            (Array.isArray(post.categories) && post.categories.includes(selectedTag));

        const matchesSearch = !searchTerm ||
            post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesTag && matchesSearch;
    });

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

    const truncateExcerpt = (text, maxLength = 150) => {
        if (!text) return 'No excerpt available';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getAuthorInitials = (authorName) => {
        if (!authorName) return 'A';
        return authorName.split(' ').map(name => name[0]).join('').toUpperCase();
    };

    const handleLike = (postId, e) => {
        e.preventDefault();
        setLikedPosts(prev => {
            const newLiked = new Set(prev);
            if (newLiked.has(postId)) {
                newLiked.delete(postId);
            } else {
                newLiked.add(postId);
            }
            return newLiked;
        });
    };

    const handleShare = (post, e) => {
        e.preventDefault();
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.excerpt,
                url: window.location.origin + `/blog/${post.slug || post.id}`
            });
        } else {
            navigator.clipboard.writeText(`${post.title} - ${window.location.origin}/blog/${post.slug || post.id}`);
            alert('Link copied to clipboard!');
        }
    };

    const handlePostClick = async (postId) => {
        try {
            const postRef = doc(db, 'blogPosts', postId);
            await updateDoc(postRef, {
                views: increment(1)
            });

            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId
                        ? { ...post, views: (post.views || 0) + 1 }
                        : post
                )
            );
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    };

    const handleSidebarSearch = (searchQuery) => {
        setSearchTerm(searchQuery);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSelectedCategory('');
        setSelectedTag('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const PostSkeleton = () => (
        <div className="bloglisting-card bloglisting-skeleton">
            <div className="bloglisting-skeleton-image"></div>
            <div className="bloglisting-content">
                <div className="bloglisting-skeleton-title"></div>
                <div className="bloglisting-skeleton-text"></div>
                <div className="bloglisting-skeleton-text bloglisting-short"></div>
                <div className="bloglisting-skeleton-meta"></div>
            </div>
        </div>
    );

    return (
        <div className="bloglisting-container">
            <div className="bloglisting-layout">
                <main className="bloglisting-main">
                    <header className="bloglisting-header">
                        <h1 className="bloglisting-heading">Our Latest Blog Posts</h1>
                        <p className="bloglisting-subtitle">
                            Discover insights, tips, and stories from our experts
                        </p>
                    </header>

                    <div className="bloglisting-controls">
                        <div className="bloglisting-search-wrapper">
                            <Search className="bloglisting-search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bloglisting-search-input"
                            />
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            className="bloglisting-filter-toggle"
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            aria-label="Toggle filters"
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {filtersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <div className={`bloglisting-filters-wrapper ${filtersExpanded ? 'bloglisting-expanded' : ''}`}>
                            <div className="bloglisting-filter-group">
                                <Filter className="bloglisting-filter-icon" size={16} />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bloglisting-filter-select"
                                >
                                    <option value="">All Categories</option>
                                    {allCategories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bloglisting-filter-group">
                                <Tag className="bloglisting-filter-icon" size={16} />
                                <select
                                    value={selectedTag}
                                    onChange={(e) => {
                                        setSelectedTag(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bloglisting-filter-select"
                                >
                                    <option value="">All Tags</option>
                                    {allTags.map(tag => (
                                        <option key={tag} value={tag}>
                                            {tag}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bloglisting-filter-group">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bloglisting-filter-select"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="views">Most Viewed</option>
                                </select>
                            </div>

                            {(selectedCategory || selectedTag || searchTerm) && (
                                <button onClick={resetFilters} className="bloglisting-reset-filters-btn">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {!loading && (
                        <div className="bloglisting-results-summary">
                            {filteredPosts.length === 0 ? (
                                <div className="bloglisting-no-results">
                                    <p>No posts found matching your criteria.</p>
                                    <button onClick={resetFilters} className="bloglisting-reset-filters-btn">
                                        Show All Posts
                                    </button>
                                </div>
                            ) : (
                                <p>
                                    Showing {currentPosts.length} of {filteredPosts.length} posts
                                    {(selectedCategory || selectedTag || searchTerm) && ' (filtered)'}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="bloglisting-posts-container">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <PostSkeleton key={index} />
                            ))
                        ) : currentPosts.length === 0 ? (
                            <div className="bloglisting-no-posts">
                                <p>No posts to display.</p>
                            </div>
                        ) : (
                            <>
                                {/* Featured Post - Most Recent */}
                                {currentPosts.length > 0 && (
                                    <div className="bloglisting-featured-post">
                                        {(() => {
                                            const post = currentPosts[0];
                                            const postImage = post.image && !post.image.includes('via.placeholder.com')
                                                ? post.image
                                                : `https://placehold.co/1200x400?text=${encodeURIComponent(post.title || 'Blog Post')}`;

                                            const displayCategories = post.categories && Array.isArray(post.categories) && post.categories.length > 0
                                                ? post.categories
                                                : post.category ? [post.category] : [];

                                            return (
                                                <div className="bloglisting-featured-card">
                                                    <Link
                                                        to={`/blog/${post.slug || post.id}`}
                                                        className="bloglisting-featured-link"
                                                        onClick={() => handlePostClick(post.id)}
                                                    >
                                                        <div className="bloglisting-featured-image-wrapper">
                                                            <img
                                                                src={postImage}
                                                                alt={post.title || 'Featured blog post'}
                                                                className="bloglisting-featured-image"
                                                                onError={(e) => {
                                                                    e.target.src = `https://placehold.co/1200x400?text=${encodeURIComponent('Featured Post')}`;
                                                                }}
                                                            />
                                                            {displayCategories.length > 0 && (
                                                                <span className="bloglisting-featured-category-badge">
                                                                    {displayCategories[0]}
                                                                </span>
                                                            )}
                                                            <div className="bloglisting-featured-overlay">
                                                                <span className="bloglisting-featured-label">Latest Article</span>
                                                            </div>
                                                        </div>

                                                        <div className="bloglisting-featured-content">
                                                            <h2 className="bloglisting-featured-title">{post.title || 'Untitled Post'}</h2>

                                                            <p className="bloglisting-featured-excerpt">
                                                                {truncateExcerpt(post.excerpt, 200)}
                                                                {post.excerpt && post.excerpt.length > 200 && (
                                                                    <span className="bloglisting-read-more"> Read more...</span>
                                                                )}
                                                            </p>

                                                            {displayCategories.length > 0 && (
                                                                <div className="bloglisting-featured-tag-list">
                                                                    {displayCategories.slice(0, 4).map((category, index) => (
                                                                        <span key={`${post.id}-featured-category-${index}`} className="bloglisting-featured-tag-badge">
                                                                            {category}
                                                                        </span>
                                                                    ))}
                                                                    {displayCategories.length > 4 && (
                                                                        <span className="bloglisting-featured-tag-badge bloglisting-more">+{displayCategories.length - 4}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="bloglisting-featured-meta">
                                                                <div className="bloglisting-featured-author-info">
                                                                    <div className="bloglisting-featured-author-avatar">
                                                                        {post.displayInitials}
                                                                    </div>
                                                                    <span className="bloglisting-featured-author-name">{post.displayAuthor}</span>
                                                                </div>

                                                                <div className="bloglisting-featured-post-details">
                                                                    <span className="bloglisting-featured-post-date">
                                                                        <Calendar size={16} />
                                                                        {formatDate(post.date)}
                                                                    </span>
                                                                    <span className="bloglisting-featured-read-time">
                                                                        <Clock size={16} />
                                                                        {post.readTime || '5 min read'}
                                                                    </span>
                                                                    <span className="bloglisting-featured-view-count">
                                                                        <Eye size={16} />
                                                                        {post.views || 0} views
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>

                                                    <div className="bloglisting-featured-actions">
                                                        <button
                                                            onClick={(e) => handleShare(post, e)}
                                                            className="bloglisting-featured-action-btn bloglisting-featured-share-btn"
                                                            title="Share this post"
                                                        >
                                                            <Share2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Regular Posts Grid - 2 columns */}
                                {currentPosts.length > 1 && (
                                    <div className="bloglisting-grid">
                                        {currentPosts.slice(1).map((post) => {
                                            const postImage = post.image && !post.image.includes('via.placeholder.com')
                                                ? post.image
                                                : `https://placehold.co/800x400?text=${encodeURIComponent(post.title || 'Blog Post')}`;

                                            const displayCategories = post.categories && Array.isArray(post.categories) && post.categories.length > 0
                                                ? post.categories
                                                : post.category ? [post.category] : [];

                                            return (
                                                <div key={post.id} className="bloglisting-card">
                                                    <Link
                                                        to={`/blog/${post.slug || post.id}`}
                                                        className="bloglisting-card-link"
                                                        onClick={() => handlePostClick(post.id)}
                                                    >
                                                        <div className="bloglisting-image-wrapper">
                                                            <img
                                                                src={postImage}
                                                                alt={post.title || 'Blog post image'}
                                                                className="bloglisting-image"
                                                                onError={(e) => {
                                                                    e.target.src = `https://placehold.co/800x400?text=${encodeURIComponent('Blog Post')}`;
                                                                }}
                                                            />
                                                            {displayCategories.length > 0 && (
                                                                <span className="bloglisting-category-badge">{displayCategories[0]}</span>
                                                            )}
                                                        </div>

                                                        <div className="bloglisting-content">
                                                            <h2 className="bloglisting-title">{post.title || 'Untitled Post'}</h2>

                                                            <p className="bloglisting-excerpt">
                                                                {truncateExcerpt(post.excerpt)}
                                                                {post.excerpt && post.excerpt.length > 150 && (
                                                                    <span className="bloglisting-read-more"> Read more...</span>
                                                                )}
                                                            </p>

                                                            {displayCategories.length > 0 && (
                                                                <div className="bloglisting-tag-list">
                                                                    {displayCategories.slice(0, 3).map((category, index) => (
                                                                        <span key={`${post.id}-category-${index}`} className="bloglisting-tag-badge">
                                                                            {category}
                                                                        </span>
                                                                    ))}
                                                                    {displayCategories.length > 3 && (
                                                                        <span className="bloglisting-tag-badge bloglisting-more">+{displayCategories.length - 3}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                                                                <div className="bloglisting-tag-list">
                                                                    {post.tags.slice(0, 3).map((tag, index) => (
                                                                        <span key={`${post.id}-tag-${index}`} className="bloglisting-tag-badge">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                    {post.tags.length > 3 && (
                                                                        <span className="bloglisting-tag-badge bloglisting-more">+{post.tags.length - 3}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="bloglisting-meta">
                                                                <div className="bloglisting-author-info">
                                                                    <div className="bloglisting-author-avatar">
                                                                        {post.displayInitials}
                                                                    </div>
                                                                    <span className="bloglisting-author-name">{post.displayAuthor}</span>
                                                                </div>

                                                                <div className="bloglisting-post-details">
                                                                    <span className="bloglisting-post-date">
                                                                        <Calendar size={14} />
                                                                        {formatDate(post.date)}
                                                                    </span>
                                                                    <span className="bloglisting-read-time">
                                                                        <Clock size={14} />
                                                                        {post.readTime || '5 min read'}
                                                                    </span>
                                                                    <span className="bloglisting-view-count">
                                                                        <Eye size={14} />
                                                                        {post.views || 0} views
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>

                                                    <div className="bloglisting-actions">
                                                        <button
                                                            onClick={(e) => handleShare(post, e)}
                                                            className="bloglisting-action-btn bloglisting-share-btn"
                                                            title="Share this post"
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!loading && filteredPosts.length > postsPerPage && (
                        <div className="bloglisting-pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bloglisting-pagination-btn"
                            >
                                Previous
                            </button>

                            <div className="bloglisting-pagination-info">
                                Page {currentPage} of {totalPages}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="bloglisting-pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <BlogSidebar onSearch={handleSidebarSearch} />
            </div>
        </div>
    );
}