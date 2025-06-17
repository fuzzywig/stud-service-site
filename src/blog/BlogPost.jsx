import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Calendar, Clock, Tag, Heart, Share2, Eye, ArrowLeft, Facebook, Twitter, Mail } from 'lucide-react';
import BlogSidebar from './BlogSidebar';
import SEO from "../components/SEO";
import "./BlogPost.css";
import "./BlogSidebar.css";

export default function BlogPost() {
    const { slug } = useParams();
    const [user, loading_auth] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState(null);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    // Dynamic SEO function
    const getSEOData = () => {
        if (!post) {
            return {
                title: "Blog Post | My Pet Connect",
                description: "Read the latest insights, tips, and stories about pet breeding, care, and connecting with fellow pet enthusiasts on My Pet Connect."
            };
        }

        // Create title using the article title
        const seoTitle = `${post.title} | My Pet Connect Blog`;

        // Create description from excerpt or content
        let description = '';

        if (post.excerpt) {
            // Use excerpt if available
            description = post.excerpt;
        } else if (post.content) {
            // Extract plain text from content and truncate
            const plainText = post.content
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
                .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
                .replace(/## (.*?)(?=\n|$)/g, '$1') // Remove markdown headers
                .replace(/### (.*?)(?=\n|$)/g, '$1')
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .trim();

            // Truncate to around 155 characters for optimal SEO
            description = plainText.length > 155
                ? plainText.substring(0, 152) + '...'
                : plainText;
        }

        // Fallback description if no content available
        if (!description.trim()) {
            description = `Read "${post.title}" on My Pet Connect blog. Discover insights, tips, and stories about pet breeding, care, and connecting with fellow pet enthusiasts.`;
        }

        // Ensure description doesn't exceed 160 characters (SEO best practice)
        if (description.length > 160) {
            description = description.substring(0, 157) + '...';
        }

        return {
            title: seoTitle,
            description: description
        };
    };

    // Get the dynamic SEO data
    const { title: seoTitle, description: seoDescription } = getSEOData();

    // Guest-compatible view tracking function
    const trackView = async (postId) => {
        try {
            await addDoc(collection(db, 'blogViews'), {
                postId: postId,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent.substring(0, 100),
            });
            console.log('📊 View tracked successfully');
        } catch (error) {
            console.log('View tracking failed (normal for guests):', error.message);
        }
    };

    // Fetch user profile when user changes
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                try {
                    // Check adminUsers collection instead of users
                    const userDoc = await getDoc(doc(db, 'adminUsers', user.uid));
                    if (userDoc.exists()) {
                        setUserProfile({ ...userDoc.data(), isAdmin: true });
                        console.log('✅ Admin user profile loaded:', userDoc.data());
                    } else {
                        // Fallback: check regular users collection
                        const regularUserDoc = await getDoc(doc(db, 'users', user.uid));
                        if (regularUserDoc.exists()) {
                            setUserProfile(regularUserDoc.data());
                            console.log('✅ Regular user profile loaded:', regularUserDoc.data());
                        } else {
                            console.log('❌ No user profile found in adminUsers or users collections');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setUserProfile(null);
            }
        };

        if (!loading_auth) {
            fetchUserProfile();
        }
    }, [user, loading_auth]);

    const fetchComments = async (postId) => {
        try {
            setCommentsLoading(true);
            console.log('🔍 Fetching comments for post:', postId);

            const commentsRef = collection(db, 'blogPosts', postId, 'comments');
            console.log('📁 Comments reference created:', commentsRef.path);

            console.log('🔍 Executing simple comments query...');
            const commentsSnapshot = await getDocs(commentsRef);
            console.log('📊 Simple query result - docs found:', commentsSnapshot.docs.length);

            if (commentsSnapshot.docs.length === 0) {
                console.log('ℹ️ No comments found - this is normal for new posts');
                setComments([]);
                return;
            }

            const commentsData = await Promise.all(commentsSnapshot.docs.map(async (docSnap) => {
                const commentData = docSnap.data();
                console.log('📝 Processing comment doc:', docSnap.id, commentData);

                let displayName = commentData.name || 'Anonymous';
                let isAdminComment = false;

                // Check if this comment is from an admin user by userId
                if (commentData.userId) {
                    try {
                        // Check adminUsers collection first
                        const adminUserDoc = await getDoc(doc(db, 'adminUsers', commentData.userId));
                        if (adminUserDoc.exists()) {
                            isAdminComment = true;
                            const adminData = adminUserDoc.data();
                            // Use company field from adminUsers document, fallback to "Company"
                            const companyName = adminData.company || 'Company';
                            if (commentData.name !== companyName) {
                                displayName = companyName;
                            }
                            console.log('✅ Admin comment detected in adminUsers:', commentData.userId, 'displaying as:', displayName);
                        } else {
                            // Fallback: check regular users collection
                            const userDoc = await getDoc(doc(db, 'users', commentData.userId));
                            if (userDoc.exists() && userDoc.data().isAdmin === true) {
                                isAdminComment = true;
                                const userData = userDoc.data();
                                const companyName = userData.company || 'Company';
                                if (commentData.name !== companyName) {
                                    displayName = companyName;
                                }
                                console.log('✅ Admin comment detected in users collection:', commentData.userId, 'displaying as:', displayName);
                            }
                        }
                    } catch (error) {
                        console.log('Could not fetch commenter user data:', error);
                    }
                }

                // Check if stored name is already "Company" or other admin names
                const adminNames = ['Admin', 'Administrator', 'MyPetConnect', 'Gavin Oxley-Bryan', 'Company', 'Info'];
                if (commentData.name && adminNames.includes(commentData.name)) {
                    isAdminComment = true;
                    displayName = 'MyPetConnect'; // Use MyPetConnect for legacy admin names
                    console.log('✅ Admin comment detected via stored name:', commentData.name, '-> MyPetConnect');
                }

                return {
                    id: docSnap.id,
                    ...commentData,
                    displayName,
                    isAdminComment,
                    createdAt: commentData.createdAt?.toDate() || new Date()
                };
            }));

            // Sort by date in JavaScript since we removed orderBy
            commentsData.sort((a, b) => b.createdAt - a.createdAt);

            setComments(commentsData);
            console.log(`✅ Loaded ${commentsData.length} comments for post ${postId}`);
            console.log('📋 Comment names:', commentsData.map(c => `${c.id}: "${c.displayName}" (stored: "${c.name}", isAdmin: ${c.isAdminComment})`));
        } catch (error) {
            console.error('❌ Error fetching comments:', error);
            console.error('Error details:', error.code, error.message);
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Add this debugging version of your useEffect to see what's happening
    // Replace your post fetching useEffect with this FINAL corrected version
    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                console.log('🚀 Starting to fetch post with slug:', slug);

                let postDoc = null;
                let postId = null;

                // First try to find by slug
                const slugQuery = query(
                    collection(db, 'blogPosts'),
                    where('slug', '==', slug),
                    where('status', '==', 'published')
                );

                const slugSnapshot = await getDocs(slugQuery);

                if (!slugSnapshot.empty) {
                    postDoc = slugSnapshot.docs[0];
                    postId = postDoc.id; // Get the actual document ID from Firestore
                    console.log('✅ Post found by slug. Document ID:', postId);
                } else {
                    console.log('🔄 Slug not found, trying as ID...');
                    const docRef = doc(db, 'blogPosts', slug);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists() && docSnap.data().status === 'published') {
                        postDoc = docSnap;
                        postId = docSnap.id; // Get the actual document ID from Firestore
                        console.log('✅ Post found by ID (fallback). Document ID:', postId);
                    }
                }

                if (postDoc && postId) {
                    const postData = postDoc.data();
                    console.log('📄 Raw post data:', postData);
                    console.log('🆔 Actual Document ID:', postId);

                    // IMPORTANT: Remove the 'id' field from postData if it exists (it's often empty)
                    const { id: _, ...cleanPostData } = postData;
                    console.log('🧹 Cleaned post data (removed empty id field):', cleanPostData);

                    // Check if this is an admin post
                    let isAdminPost = false;

                    if (postData.isAdminPost === true) {
                        isAdminPost = true;
                        console.log('✅ Admin post detected via isAdminPost flag');
                    }

                    const adminAuthorNames = ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan', 'Company', 'Info'];
                    if (postData.author && adminAuthorNames.includes(postData.author)) {
                        isAdminPost = true;
                        console.log('✅ Admin post detected via author name:', postData.author);
                    }

                    // Fetch user data if needed
                    if (postData.authorId) {
                        try {
                            const adminUserDoc = await getDoc(doc(db, 'adminUsers', postData.authorId));
                            if (adminUserDoc.exists()) {
                                const userData = adminUserDoc.data();
                                if (!isAdminPost) {
                                    isAdminPost = true;
                                    console.log('✅ Admin post detected via adminUsers collection');
                                }
                                cleanPostData.companyName = userData.company || 'MyPetConnect';
                            } else {
                                const userDoc = await getDoc(doc(db, 'users', postData.authorId));
                                if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    if (userData.isAdmin === true) {
                                        if (!isAdminPost) {
                                            isAdminPost = true;
                                            console.log('✅ Admin post detected via user isAdmin flag');
                                        }
                                        cleanPostData.companyName = userData.company || 'MyPetConnect';
                                    }
                                }
                            }
                        } catch (error) {
                            console.log('❌ Could not fetch author user data:', error);
                        }
                    }

                    // Create the full post object - ALWAYS use the actual document ID first
                    const fullPost = {
                        id: postId, // CRITICAL: Use the actual Firestore document ID
                        ...cleanPostData, // Then spread the cleaned data (without the empty id field)
                        isAdminPost,
                        date: postData.createdAt ? postData.createdAt.toDate().toLocaleDateString() : postData.date,
                        views: postData.views || 0,
                        likes: postData.likes || 0
                    };

                    // Final validation
                    if (!fullPost.id || fullPost.id === '') {
                        console.error('❌ Final post object still has empty/missing ID:', fullPost);
                        setPost(null);
                        setCommentsLoading(false);
                        return;
                    }

                    console.log('📄 Final post object created:', {
                        id: fullPost.id,
                        title: fullPost.title,
                        likes: fullPost.likes,
                        idType: typeof fullPost.id,
                        idLength: fullPost.id.length
                    });

                    setPost(fullPost);
                    setLikeCount(fullPost.likes);

                    // Check if user has already liked this post
                    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
                    setHasLiked(likedPosts.includes(fullPost.id));

                    await trackView(fullPost.id);
                    console.log('🔄 About to fetch comments for post:', fullPost.id);
                    await fetchComments(fullPost.id);
                    await fetchRelatedPosts(fullPost);
                } else {
                    console.log('❌ Post not found');
                    setPost(null);
                    setCommentsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                setPost(null);
                setCommentsLoading(false);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            console.log('👀 slug exists, calling fetchPost:', slug);
            fetchPost();
        } else {
            console.log('❌ No slug provided');
            setLoading(false);
            setCommentsLoading(false);
        }
    }, [slug]);

    const fetchRelatedPosts = async (currentPost) => {
        try {
            const categoryQuery = currentPost.categories && currentPost.categories.length > 0
                ? currentPost.categories[0]
                : currentPost.category;

            if (!categoryQuery) return;

            const q = query(
                collection(db, 'blogPosts'),
                where('categories', 'array-contains', categoryQuery),
                where('status', '==', 'published'),
                limit(4)
            );

            const querySnapshot = await getDocs(q);
            const related = querySnapshot.docs
                .map(doc => {
                    const docData = doc.data();
                    const { id: _, ...cleanDocData } = docData;
                    return {
                        id: doc.id,
                        ...cleanDocData
                    };
                })
                .filter(p => p.id !== currentPost.id);
            setRelatedPosts(related.slice(0, 3));
        } catch (error) {
            console.error('Error fetching related posts:', error);
        }
    };

    // Replace your handleLike function with this heavily debugged version
    const handleLike = async () => {
        console.log('🚀 handleLike called');
        console.log('📊 Current state when like clicked:', {
            post: post,
            postExists: !!post,
            postId: post?.id,
            postIdType: typeof post?.id,
            postIdLength: post?.id?.length,
            postIdIsEmpty: post?.id === '',
            postIdIsUndefined: post?.id === undefined,
            postIdIsNull: post?.id === null,
            postKeys: post ? Object.keys(post) : 'no post',
            likeCount: likeCount,
            hasLiked: hasLiked
        });

        // Add comprehensive validation
        if (!post) {
            console.log('❌ No post object available');
            alert('Error: No post data available. Please refresh the page.');
            return;
        }

        if (!post.id) {
            console.log('❌ Post ID is missing:', post);
            console.log('❌ Post object structure:', JSON.stringify(post, null, 2));
            alert('Error: Post ID is missing. Please refresh the page.');
            return;
        }

        // Check for empty string specifically
        if (post.id === '') {
            console.log('❌ Post ID is empty string');
            alert('Error: Post ID is empty. Please refresh the page.');
            return;
        }

        // Validate post.id is a string and not empty
        if (typeof post.id !== 'string' || post.id.trim() === '') {
            console.log('❌ Invalid post ID format:', typeof post.id, post.id);
            alert('Error: Invalid post ID format. Please refresh the page.');
            return;
        }

        try {
            console.log('👍 Handling like for post:', post.id);

            // Check if user has already liked this post
            const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
            const alreadyLiked = likedPosts.includes(post.id);

            if (alreadyLiked) {
                console.log('⚠️ User has already liked this post');
                return;
            }

            console.log('🔄 Creating document reference for post ID:', post.id);
            console.log('🔄 Post ID details:', {
                value: post.id,
                type: typeof post.id,
                length: post.id.length,
                trimmed: post.id.trim(),
                encoded: encodeURIComponent(post.id)
            });

            // Try creating the document reference
            let postRef;
            try {
                postRef = doc(db, 'blogPosts', post.id);
                console.log('✅ Document reference created successfully');
                console.log('📄 Document reference path:', postRef.path);
            } catch (refError) {
                console.error('❌ Error creating document reference:', refError);
                alert('Error creating document reference. Check console for details.');
                return;
            }

            const newLikeCount = likeCount + 1;
            console.log('📊 Updating likes count from', likeCount, 'to', newLikeCount);

            // Update the document
            console.log('🔄 Attempting to update Firestore document...');
            await updateDoc(postRef, {
                likes: newLikeCount
            });

            console.log('✅ Firestore document updated successfully');

            // Update local state
            setLikeCount(newLikeCount);
            setHasLiked(true);

            // Store in localStorage to prevent duplicate likes
            const updatedLikedPosts = [...likedPosts, post.id];
            localStorage.setItem('likedPosts', JSON.stringify(updatedLikedPosts));

            console.log('✅ Like added successfully. New count:', newLikeCount);

            // Optional: Add to likes collection for analytics
            try {
                await addDoc(collection(db, 'blogLikes'), {
                    postId: post.id,
                    timestamp: serverTimestamp(),
                    userAgent: navigator.userAgent.substring(0, 100),
                });
                console.log('📊 Like tracked in analytics');
            } catch (error) {
                console.log('Like analytics failed (non-critical):', error.message);
            }

        } catch (error) {
            console.error('❌ Error adding like:', error);
            console.error('❌ Error details:', {
                code: error.code,
                message: error.message,
                postId: post?.id,
                postObject: post
            });
            alert('Failed to add like. Please try again.');
        }
    };

// Also add this function to manually check the post state
    const debugPostState = () => {
        console.log('=== POST STATE DEBUG ===');
        console.log('Post object:', post);
        console.log('Post ID:', post?.id);
        console.log('Post ID type:', typeof post?.id);
        console.log('Post ID length:', post?.id?.length);
        console.log('Post ID === "":', post?.id === '');
        console.log('All post keys:', post ? Object.keys(post) : 'no post');
        console.log('Like count:', likeCount);
        console.log('Has liked:', hasLiked);
        console.log('Loading:', loading);
        console.log('========================');
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const text = `Check out this article: ${post.title}`;

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(text + ' ' + url)}`;
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({ title: post.title, text: post.excerpt, url });
                } else {
                    navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                }
                break;
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (!user) {
            alert('Please log in to post a comment.');
            return;
        }

        try {
            setCommentSubmitting(true);
            console.log('💬 Submitting comment to post:', post.id);

            const displayName = userProfile ?
                `${userProfile.firstName} ${userProfile.lastName}` :
                (user.displayName || user.email || 'Anonymous User');

            const isCurrentUserAdmin = userProfile?.isAdmin === true;

            // Use company field from user profile, fallback to "MyPetConnect"
            const companyName = userProfile?.company || 'MyPetConnect';
            const commentDisplayName = isCurrentUserAdmin ? companyName : displayName;

            console.log('💾 Storing comment with name:', commentDisplayName, 'isAdmin:', isCurrentUserAdmin);

            const commentData = {
                userId: user.uid,
                name: commentDisplayName,
                comment: newComment.trim(),
                createdAt: serverTimestamp(),
                userEmail: user.email,
                isAdminComment: isCurrentUserAdmin
            };

            const commentsRef = collection(db, 'blogPosts', post.id, 'comments');
            const docRef = await addDoc(commentsRef, commentData);
            console.log('✅ Comment added with ID:', docRef.id, 'stored name:', commentDisplayName);

            const newCommentWithId = {
                id: docRef.id,
                userId: user.uid,
                name: commentDisplayName,
                displayName: commentDisplayName,
                isAdminComment: isCurrentUserAdmin,
                comment: newComment.trim(),
                createdAt: new Date()
            };

            setComments(prevComments => [newCommentWithId, ...prevComments]);
            setNewComment('');

        } catch (error) {
            console.error('❌ Error adding comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setCommentSubmitting(false);
        }
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

    const formatContent = (content) => {
        if (!content) return '';
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/## (.*?)(?=<br\/>|<\/p>)/g, '<h2>$1</h2>')
            .replace(/### (.*?)(?=<br\/>|<\/p>)/g, '<h3>$1</h3>');
    };

    if (loading) {
        return (
            <>
                <SEO
                    title={seoTitle}
                    description={seoDescription}
                />
                <div className="blogpost-container">
                    <div className="blogpost-layout">
                        <main className="blogpost-main">
                            <div className="blogpost-skeleton">
                                <div className="blogpost-skeleton-image"></div>
                                <div className="blogpost-skeleton-title"></div>
                                <div className="blogpost-skeleton-meta"></div>
                                <div className="blogpost-skeleton-content"></div>
                            </div>
                        </main>
                        <BlogSidebar />
                    </div>
                </div>
            </>
        );
    }

    if (!post) {
        return (
            <>
                <SEO
                    title="Post Not Found | My Pet Connect Blog"
                    description="The blog post you're looking for doesn't exist or has been removed. Browse our latest pet care tips and breeding insights."
                />
                <div className="blogpost-container">
                    <div className="blogpost-layout">
                        <main className="blogpost-main">
                            <div className="blogpost-not-found">
                                <h2>Post not found</h2>
                                <p>The blog post you're looking for doesn't exist or has been removed.</p>
                                <Link to="/blog" className="blogpost-back-link">
                                    <ArrowLeft size={16} />
                                    Back to Blog
                                </Link>
                            </div>
                        </main>
                        <BlogSidebar />
                    </div>
                </div>
            </>
        );
    }

    const getDisplayAuthor = () => {
        console.log('🏷️ getDisplayAuthor called - post.isAdminPost:', post.isAdminPost, 'post.companyName:', post.companyName, 'post.author:', post.author);

        // If it's flagged as an admin post, use the fetched company name
        if (post.isAdminPost) {
            return post.companyName || 'MyPetConnect';
        }

        // Check if the stored author name is one of the admin names and override
        const adminNames = ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan', 'Info'];
        if (post.author && adminNames.includes(post.author)) {
            return 'MyPetConnect';
        }

        return post.author || 'Unknown Author';
    };

    return (
        <>
            <SEO
                title={seoTitle}
                description={seoDescription}
            />
            <div className="blogpost-container">
                <div className="blogpost-layout">
                    <main className="blogpost-main">
                        <article className="blogpost-article">
                            <header className="blogpost-header">
                                <h1 className="blogpost-title">{post.title}</h1>

                                <div className="blogpost-meta-detailed">
                                    <div className="blogpost-author-section">
                                        <div className="blogpost-author-avatar">
                                            {(() => {
                                                if (post.isAdminPost) {
                                                    // Use company name initials if available, otherwise default to "MPC"
                                                    const companyName = post.companyName || 'MyPetConnect';
                                                    return companyName.split(' ').map(word => word[0]).join('').toUpperCase();
                                                } else if (post.author && ['Admin', 'Administrator', 'MyPetConnect', 'Staff', 'Gavin Oxley-Bryan', 'Info'].includes(post.author)) {
                                                    return 'MPC'; // Default for legacy admin names
                                                } else {
                                                    return post.author?.split(' ').map(name => name[0]).join('').toUpperCase() || 'A';
                                                }
                                            })()}
                                        </div>
                                        <div className="blogpost-author-info">
                                            <span className="blogpost-author-name">
                                                {getDisplayAuthor()}
                                            </span>
                                            <div className="blogpost-details">
                                                <span className="blogpost-date">
                                                    <Calendar size={14} />
                                                    {formatDate(post.date)}
                                                </span>
                                                <span className="blogpost-read-time">
                                                    <Clock size={14} />
                                                    {post.readTime || '5 min read'}
                                                </span>
                                                <span className="blogpost-view-count">
                                                    <Eye size={14} />
                                                    {post.views || 0} views
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="blogpost-social-share">
                                        <button onClick={() => handleShare('facebook')} className="blogpost-share-btn blogpost-facebook">
                                            <Facebook size={16} />
                                        </button>
                                        <button onClick={() => handleShare('twitter')} className="blogpost-share-btn blogpost-twitter">
                                            <Twitter size={16} />
                                        </button>
                                        <button onClick={() => handleShare('email')} className="blogpost-share-btn blogpost-email">
                                            <Mail size={16} />
                                        </button>
                                        <button onClick={() => handleShare('native')} className="blogpost-share-btn blogpost-native">
                                            <Share2 size={16} />
                                        </button>
                                        <button
                                            onClick={handleLike}
                                            className={`blogpost-like-btn ${hasLiked ? 'blogpost-liked' : ''}`}
                                            disabled={hasLiked}
                                            title={hasLiked ? 'You already liked this post' : 'Like this post'}
                                        >
                                            <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
                                            {likeCount > 0 && <span className="blogpost-like-count">{likeCount}</span>}
                                            {hasLiked ? 'Liked' : 'Like'}
                                        </button>
                                    </div>
                                </div>
                            </header>

                            {post.image && (
                                <div className="blogpost-image-wrapper">
                                    <img
                                        src={post.image.includes('via.placeholder.com')
                                            ? `https://placehold.co/800x400?text=${encodeURIComponent(post.title || 'Blog Post')}`
                                            : post.image
                                        }
                                        alt={post.imageAlt || post.title || 'Blog post image'}  // CHANGED: Use imageAlt from database first, then title as fallback
                                        className="blogpost-featured-image"
                                        onError={(e) => {
                                            console.log('Image failed to load:', e.target.src);
                                            e.target.src = `https://placehold.co/800x400?text=${encodeURIComponent(post.title || 'Blog Post')}`;
                                        }}
                                    />
                                </div>
                            )}

                            <section className="blogpost-content-section">
                                <div
                                    className="blogpost-content"
                                    dangerouslySetInnerHTML={{ __html: post.content || formatContent(post.content) }}
                                />
                            </section>

                            {Array.isArray(post.categories) && post.categories.length > 0 && (
                                <div className="blogpost-categories">
                                    <Tag size={16} />
                                    <span className="blogpost-categories-label">Categories:</span>
                                    {post.categories.map((category, index) => (
                                        <Link
                                            key={`blogpost-category-${index}-${category}`}
                                            to={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="blogpost-category-tag"
                                        >
                                            {category}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                                <div className="blogpost-tags">
                                    <Tag size={16} />
                                    <span className="blogpost-tags-label">Tags:</span>
                                    {post.tags.map((tag, index) => (
                                        <span key={`blogpost-tag-${index}-${tag}`} className="blogpost-tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {relatedPosts.length > 0 && (
                                <section className="blogpost-related-posts">
                                    <h3>Related Articles</h3>
                                    <div className="blogpost-related-grid">
                                        {relatedPosts.map(relatedPost => (
                                            <Link
                                                key={`blogpost-related-${relatedPost.id}`}
                                                to={`/blog/${relatedPost.slug || relatedPost.id}`}
                                                className="blogpost-related-card"
                                            >
                                                <img
                                                    src={relatedPost.image && !relatedPost.image.includes('via.placeholder.com')
                                                        ? relatedPost.image
                                                        : `https://placehold.co/300x200?text=${encodeURIComponent(relatedPost.title || 'Article')}`
                                                    }
                                                    alt={relatedPost.imageAlt || relatedPost.title || 'Related article image'}  // CHANGED: Use imageAlt from database first
                                                    className="blogpost-related-image"
                                                    onError={(e) => {
                                                        e.target.src = `https://placehold.co/300x200?text=${encodeURIComponent(relatedPost.title || 'Article')}`;
                                                    }}
                                                />
                                                <div className="blogpost-related-content">
                                                    <h4>{relatedPost.title}</h4>
                                                    <p>{relatedPost.excerpt?.substring(0, 100)}...</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="blogpost-comments-section">
                                <h3>Comments ({comments.length})</h3>

                                {user ? (
                                    <div className="blogpost-comment-form">
                                        <h4>Leave a Comment</h4>
                                        {userProfile && (
                                            <p className="blogpost-commenting-as">
                                                Commenting as: <strong>
                                                {userProfile.isAdmin ? (userProfile.company || 'MyPetConnect') : `${userProfile.firstName} ${userProfile.lastName}`}
                                            </strong>
                                            </p>
                                        )}
                                        <form onSubmit={handleCommentSubmit}>
                                            <textarea
                                                placeholder="Your comment"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                rows={4}
                                                className="blogpost-comment-textarea"
                                                required
                                                disabled={commentSubmitting}
                                            />
                                            <button
                                                type="submit"
                                                className="blogpost-comment-submit"
                                                disabled={!newComment.trim() || commentSubmitting}
                                            >
                                                {commentSubmitting ? 'Posting...' : 'Post Comment'}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="blogpost-login-prompt">
                                        <p>Please <Link to="/login">log in</Link> to leave a comment.</p>
                                    </div>
                                )}

                                <div className="blogpost-comments-list">
                                    {commentsLoading ? (
                                        <div className="blogpost-comments-loading">
                                            <p>Loading comments...</p>
                                            <p style={{fontSize: '0.8rem', color: '#999'}}>
                                                Check console for debug info
                                            </p>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="blogpost-no-comments">No comments yet. Be the first to comment!</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={`blogpost-comment-${comment.id}`} className={`blogpost-comment ${comment.isAdminComment ? 'blogpost-admin-comment' : ''}`}>
                                                <div className="blogpost-comment-header">
                                                    <strong className="blogpost-comment-author">
                                                        {comment.displayName || comment.name}
                                                        {comment.isAdminComment && (
                                                            <span className="blogpost-admin-badge">Team</span>
                                                        )}
                                                    </strong>
                                                    <span className="blogpost-comment-date">
                                                        {comment.createdAt instanceof Date
                                                            ? comment.createdAt.toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : 'Just now'
                                                        }
                                                    </span>
                                                </div>
                                                <p className="blogpost-comment-text">{comment.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </article>
                    </main>

                    <BlogSidebar currentPostId={post?.id} />
                </div>
            </div>
        </>
    );
}