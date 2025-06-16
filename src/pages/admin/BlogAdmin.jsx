import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar.jsx';
import { db, auth } from '../../firebase/firebase';
import { collection, setDoc, doc, serverTimestamp, getDoc, getDocs, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { v4 as uuidv4 } from 'uuid';
import SearchableCategorySelect from '../../blog/SearchableCategorySelect';
import ImageUpload from '../../blog/ImageUpload';
import { Edit3, Trash2, Eye, EyeOff, Search, Calendar, User, Save, X, FileText, Settings, Globe } from 'lucide-react';
import { createSlug, isValidSlug } from '../../utils/blogUtils';
import './BlogAdmin.css';



export default function BlogAdmin() {
    const [user, loading, _error] = useAuthState(auth);
    const [activeTab, setActiveTab] = useState('create');
    const [editorMode, setEditorMode] = useState('wysiwyg');
    const [userProfile, setUserProfile] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const editorRef = useRef(null);
    const [customCategories, setCustomCategories] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    const [slugTouched, setSlugTouched] = useState(false);
    const [slugError, setSlugError] = useState('');
    const [checkingSlug, setCheckingSlug] = useState(false);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');

    const getUserDisplayName = () => {
        if (!user) return 'Admin';
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }
        if (user.displayName) return user.displayName;
        if (user.email) {
            const emailName = user.email.split('@')[0];
            return emailName.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        return 'Admin';
    };

    const handlePreview = () => {
        // Get content from TinyMCE if using WYSIWYG
        let previewContent = form.content;
        if (editorMode === 'wysiwyg' && window.tinymce) {
            const editor = window.tinymce.get('blog-content-editor');
            if (editor) {
                previewContent = editor.getContent();
            }
        }
        setForm(prev => ({ ...prev, content: previewContent }));
        setShowPreview(true);
    };

    const checkSlugUniqueness = async (slug) => {
        if (!slug || slug === form.slug) return true;
        setCheckingSlug(true);
        try {
            const q = query(collection(db, 'blogPosts'), where('slug', '==', slug));
            const snapshot = await getDocs(q);
            const isUnique = snapshot.empty;
            if (!isUnique) {
                setSlugError('This URL slug is already in use. Please choose a different one.');
                return false;
            }
            setSlugError('');
            return true;
        } catch (error) {
            console.error('Error checking slug uniqueness:', error);
            setSlugError('Unable to check URL uniqueness. Please try again.');
            return false;
        } finally {
            setCheckingSlug(false);
        }
    };

    const fetchUserProfile = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                setUserProfile(profileData);
                console.log('User profile loaded:', profileData);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    // Helper function to generate suggested alt text
    const generateSuggestedAltText = (title, filename) => {
        if (title) {
            return `Featured image for blog post: ${title}`;
        }
        if (filename) {
            return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        }
        return '';
    };

    const [form, setForm] = useState({
        title: '',
        slug: '',
        id: '',
        author: 'Admin',
        date: new Date().toLocaleDateString('en-GB'),
        readTime: '3 min read',
        image: '',
        imageAlt: '', // Added alt text field
        excerpt: '',
        content: '',
        categories: [],
        status: 'published',
    });

    const resetForm = () => {
        setForm({
            title: '',
            slug: '',
            id: '',
            author: getUserDisplayName(),
            date: new Date().toLocaleDateString('en-GB'),
            readTime: '3 min read',
            image: '',
            imageAlt: '', // Added alt text field
            excerpt: '',
            content: '',
            categories: [],
            status: 'published',
        });
        setIsEditing(false);
        setEditingPostId(null);
        setSlugTouched(false);
        setSlugError('');
        if (window.tinymce && window.tinymce.get('blog-content-editor')) {
            window.tinymce.get('blog-content-editor').setContent('');
        }
    };

    const fetchPosts = async () => {
        console.log('🚀 fetchPosts called!');
        try {
            setLoadingPosts(true);
            const postsRef = collection(db, 'blogPosts');
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const postsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const postId = doc.id;

                // Be more explicit about the mapping to avoid ID conflicts
                return {
                    id: postId,  // Firestore document ID
                    title: data.title,
                    author: data.author,
                    excerpt: data.excerpt,
                    content: data.content,
                    image: data.image,
                    imageAlt: data.imageAlt, // Added alt text field
                    slug: data.slug,
                    status: data.status,
                    categories: data.categories,
                    readTime: data.readTime,
                    isAdminPost: data.isAdminPost,
                    authorId: data.authorId,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    date: data.createdAt ? data.createdAt.toDate() : new Date(),
                };
            });

            console.log('📊 Total posts mapped:', postsData.length);
            console.log('📋 All posts with IDs:', postsData.map(p => ({
                id: p.id,
                title: p.title,
                idType: typeof p.id,
                idLength: p.id?.length,
                status: p.status
            })));

            setPosts(postsData);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadPostForEditing = async (postId) => {
        if (!postId || postId.trim() === '') return;
        try {
            const postDoc = await getDoc(doc(db, 'blogPosts', postId));
            if (postDoc.exists()) {
                const postData = postDoc.data();
                setForm({
                    ...postData,
                    id: postId,
                    slug: postData.slug || createSlug(postData.title || ''),
                    date: postData.createdAt ? postData.createdAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                    categories: Array.isArray(postData.categories) ? postData.categories : [],
                    imageAlt: postData.imageAlt || '', // Added alt text field
                });
                setIsEditing(true);
                setEditingPostId(postId);
                setActiveTab('create');
                setSlugTouched(true);
                setTimeout(() => {
                    if (window.tinymce && window.tinymce.get('blog-content-editor')) {
                        window.tinymce.get('blog-content-editor').setContent(postData.content || '');
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error loading post for editing:', error);
        }
    };

    const deletePost = async (postId, postTitle) => {
        if (!postId || !window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'blogPosts', postId));
            setPosts(prev => prev.filter(post => post.id !== postId));
            alert('Post deleted successfully!');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    };

    const togglePostStatus = async (postId, currentStatus) => {
        if (!postId) return;
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, 'blogPosts', postId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            setPosts(prev => prev.map(post =>
                post.id === postId ? { ...post, status: newStatus } : post
            ));
        } catch (error) {
            console.error('Error updating post status:', error);
        }
    };

    // Initialize TinyMCE and other effects
    useEffect(() => {
        const initEditor = () => {
            if (editorRef.current && window.tinymce && editorMode === 'wysiwyg') {
                // Remove any existing editor first
                if (window.tinymce.get('blog-content-editor')) {
                    window.tinymce.get('blog-content-editor').remove();
                }

                window.tinymce.init({
                    target: editorRef.current,
                    height: 400,
                    menubar: false,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | link image | code | help',
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #333; }',
                    skin: 'oxide',
                    content_css: 'default',
                    branding: false,
                    promotion: false,
                    setup: (editor) => {
                        editor.on('change', () => {
                            const content = editor.getContent();
                            setForm(prev => ({ ...prev, content }));
                        });
                    },
                    init_instance_callback: (editor) => {
                        editor.setContent(form.content);
                    }
                });
            }
        };

        // Load TinyMCE if not already loaded
        if (editorMode === 'wysiwyg' && !window.tinymce) {
            const script = document.createElement('script');
            script.src = 'https://cdn.tiny.cloud/1/7uvns8obt1qy17abfvm4kjs0mkygig4lfewbn2kh2z5dqebu/tinymce/6/tinymce.min.js';
            script.onload = initEditor;
            document.head.appendChild(script);
        } else if (editorMode === 'wysiwyg') {
            initEditor();
        }

        return () => {
            if (window.tinymce && window.tinymce.get('blog-content-editor')) {
                window.tinymce.get('blog-content-editor').remove();
            }
        };
    }, [editorMode, activeTab, form.content]);

    useEffect(() => {
        if (form.title && !slugTouched) {
            const autoSlug = createSlug(form.title);
            setForm(prev => ({ ...prev, slug: autoSlug }));
        }
    }, [form.title, slugTouched]);

    useEffect(() => {
        const savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        setCustomCategories(savedCategories);
    }, []);

    useEffect(() => {
        if (user) fetchUserProfile(user.uid);
    }, [user]);

    useEffect(() => {
        if (user || userProfile) {
            setForm(prev => ({ ...prev, author: getUserDisplayName() }));
        }
    }, [user, userProfile]);

    useEffect(() => {
        if (activeTab === 'manage') fetchPosts();
    }, [activeTab]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'slug') {
            setSlugTouched(true);
            setSlugError('');
            const cleanSlug = createSlug(value);
            setForm({ ...form, [name]: cleanSlug });
            if (cleanSlug) setTimeout(() => checkSlugUniqueness(cleanSlug), 500);
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('You must be logged in to create blog posts.');
            return;
        }
        if (!form.slug || !isValidSlug(form.slug)) {
            alert('URL slug is required and must contain only lowercase letters, numbers, and hyphens.');
            return;
        }

        const isSlugUnique = await checkSlugUniqueness(form.slug);
        if (!isSlugUnique) {
            alert('This URL slug is already in use. Please choose a different one.');
            return;
        }

        let finalContent = form.content;
        if (editorMode === 'wysiwyg' && window.tinymce) {
            const editor = window.tinymce.get('blog-content-editor');
            if (editor) finalContent = editor.getContent();
        }

        try {
            const postId = (form.id && form.id.trim()) || editingPostId || uuidv4();
            const isAdminPost = userProfile?.isAdmin === true;
            const postData = {
                ...form,
                content: finalContent,
                categories: Array.isArray(form.categories) ? form.categories : [],
                authorId: user.uid,
                isAdminPost: isAdminPost,
                updatedAt: serverTimestamp(),
            };
            if (!isEditing) postData.createdAt = serverTimestamp();

            await setDoc(doc(db, 'blogPosts', postId), postData, { merge: isEditing });
            alert(isEditing ? 'Blog post updated successfully!' : 'Blog post created successfully!');
            if (activeTab === 'manage') fetchPosts();
            resetForm();
        } catch (error) {
            console.error('Error saving blog post:', error);
            alert('Failed to save blog post.');
        }
    };

    const filteredPosts = posts.filter(post => {
        // Handle search matching with proper null checks
        const matchesSearch = searchTerm.trim() === '' ||
            (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || post.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="admin-blog-page-container">
                <AdminSidebar />
                <div className="admin-blog-content-area">
                    <div className="admin-blog-loading">
                        <div className="admin-blog-spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-blog-page-container">
            <AdminSidebar />
            <div className="admin-blog-content-area">
                {/* Header */}
                <div className="admin-blog-header">
                    <div className="admin-blog-header-content">
                        <div className="admin-blog-title-section">
                            <h1 className="admin-blog-title">Blog Administration</h1>
                            <p className="admin-blog-subtitle">Create, edit, and manage your blog posts</p>
                        </div>
                        <div className="admin-blog-header-actions">
                            <a
                                href="/blog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-blog-action-btn secondary"
                            >
                                <Globe size={16} />
                                View Blog
                            </a>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="admin-blog-nav-card">
                    <div className="admin-blog-tabs">
                        <button
                            className={`admin-blog-tab ${activeTab === 'create' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('create');
                                if (!isEditing) resetForm();
                            }}
                        >
                            <FileText size={16} />
                            {isEditing ? 'Edit Post' : 'Create Post'}
                        </button>
                        <button
                            className={`admin-blog-tab ${activeTab === 'manage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manage')}
                        >
                            <Settings size={16} />
                            Manage Posts
                        </button>
                    </div>

                    {activeTab === 'manage' && (
                        <div className="admin-blog-tab-info">
                            <span className="admin-blog-posts-count">
                                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Create/Edit Tab */}
                {activeTab === 'create' && (
                    <div className="admin-blog-create-section">
                        <div className="admin-blog-form-card">
                            <div className="admin-blog-card-header">
                                <h2 className="admin-blog-card-title">
                                    {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
                                </h2>
                                {isEditing && (
                                    <button onClick={resetForm} className="admin-blog-action-btn secondary small">
                                        <X size={14} />
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="admin-blog-form">
                                {/* Title */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">Post Title</label>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Enter an engaging title..."
                                        className="admin-blog-form-input"
                                        required
                                    />
                                </div>

                                {/* Slug */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">URL Slug</label>
                                    <input
                                        name="slug"
                                        value={form.slug}
                                        onChange={handleChange}
                                        placeholder="url-friendly-slug"
                                        className={`admin-blog-form-input ${slugError ? 'error' : ''}`}
                                        required
                                    />
                                    {checkingSlug && <span className="admin-blog-form-hint checking">Checking availability...</span>}
                                    {slugError && <span className="admin-blog-form-hint error">{slugError}</span>}
                                    {!slugError && !checkingSlug && form.slug && (
                                        <span className="admin-blog-form-hint">Preview: /blog/{form.slug}</span>
                                    )}
                                </div>

                                {/* Row: Author & Read Time */}
                                <div className="admin-blog-form-row">
                                    <div className="admin-blog-form-group">
                                        <label className="admin-blog-form-label">Author</label>
                                        <input
                                            name="author"
                                            value={form.author}
                                            onChange={handleChange}
                                            className="admin-blog-form-input"
                                        />
                                    </div>
                                    <div className="admin-blog-form-group">
                                        <label className="admin-blog-form-label">Read Time</label>
                                        <input
                                            name="readTime"
                                            value={form.readTime}
                                            onChange={handleChange}
                                            placeholder="e.g., 5 min read"
                                            className="admin-blog-form-input"
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">Status</label>
                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        className="admin-blog-form-select"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>

                                {/* Featured Image with Alt Text Support */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">Featured Image</label>
                                    {uploadError && (
                                        <div className="admin-blog-error-message">{uploadError}</div>
                                    )}
                                    <ImageUpload
                                        value={form.image}
                                        onChange={(url) => {
                                            setForm(prev => ({ ...prev, image: url }));
                                            // Auto-suggest alt text if none exists
                                            if (!form.imageAlt && form.title) {
                                                const suggestedAlt = generateSuggestedAltText(form.title);
                                                setForm(prev => ({ ...prev, imageAlt: suggestedAlt }));
                                            }
                                        }}
                                        onError={(error) => {
                                            setUploadError(error);
                                            setTimeout(() => setUploadError(''), 5000);
                                        }}
                                        altText={form.imageAlt}
                                        onAltTextChange={(altText) => setForm(prev => ({ ...prev, imageAlt: altText }))}
                                        showAltInput={true}
                                    />
                                </div>

                                {/* Categories */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">Categories</label>
                                    <SearchableCategorySelect
                                        value={Array.isArray(form.categories) ? form.categories : []}
                                        onChange={(categories) => setForm(prev => ({ ...prev, categories }))}
                                        placeholder="Search and select categories..."
                                        categories={customCategories}
                                        onAddCategory={(newCategory) => {
                                            if (!customCategories.includes(newCategory)) {
                                                setCustomCategories(prev => [...prev, newCategory]);
                                                const savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
                                                const updatedCategories = [...new Set([...savedCategories, newCategory])];
                                                localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
                                            }
                                        }}
                                        maxSelections={5}
                                    />
                                </div>

                                {/* Excerpt */}
                                <div className="admin-blog-form-group">
                                    <label className="admin-blog-form-label">Excerpt</label>
                                    <textarea
                                        name="excerpt"
                                        value={form.excerpt}
                                        onChange={handleChange}
                                        placeholder="Write a compelling summary..."
                                        className="admin-blog-form-textarea"
                                        rows={3}
                                    />
                                    <span className="admin-blog-form-hint">Keep it under 160 characters for best SEO results</span>
                                </div>

                                {/* Content Editor */}
                                <div className="admin-blog-form-group">
                                    <div className="admin-blog-editor-header">
                                        <label className="admin-blog-form-label">Content</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newMode = editorMode === 'wysiwyg' ? 'raw' : 'wysiwyg';
                                                if (editorMode === 'wysiwyg' && window.tinymce) {
                                                    const editor = window.tinymce.get('blog-content-editor');
                                                    if (editor) {
                                                        const content = editor.getContent();
                                                        setForm(prev => ({ ...prev, content }));
                                                        editor.remove();
                                                    }
                                                }
                                                setEditorMode(newMode);
                                            }}
                                            className="admin-blog-editor-toggle"
                                        >
                                            {editorMode === 'wysiwyg' ? '💻 Code' : '🎨 Visual'}
                                        </button>
                                    </div>

                                    {editorMode === 'wysiwyg' ? (
                                        <div className="admin-blog-wysiwyg-wrapper">
                                            <textarea
                                                ref={editorRef}
                                                id="blog-content-editor"
                                                className="admin-blog-wysiwyg-editor"
                                            />
                                        </div>
                                    ) : (
                                        <textarea
                                            name="content"
                                            value={form.content}
                                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                                            placeholder="Write your blog post content here..."
                                            className="admin-blog-form-textarea admin-blog-content-textarea"
                                            rows={15}
                                        />
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="admin-blog-form-actions">
                                    <button
                                        type="button"
                                        onClick={handlePreview}
                                        className="admin-blog-action-btn secondary"
                                    >
                                        <Eye size={16} />
                                        Preview
                                    </button>
                                    <button type="submit" className="admin-blog-action-btn primary large">
                                        <Save size={16} />
                                        {isEditing ? 'Update Post' : 'Create Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className="admin-blog-manage-section">
                        {/* Search and Filters */}
                        <div className="admin-blog-controls-card">
                            <div className="admin-blog-search-section">
                                <div className="admin-blog-search-input-wrapper">
                                    <Search size={16} className="admin-blog-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search posts by title, author, or content..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="admin-blog-search-input"
                                    />
                                </div>
                            </div>

                            <div className="admin-blog-filters-section">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="admin-blog-filter-select"
                                >
                                    <option value="all">All Posts</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Drafts</option>
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="admin-blog-filter-select"
                                >
                                    <option value="createdAt">Sort by Date</option>
                                    <option value="title">Sort by Title</option>
                                    <option value="author">Sort by Author</option>
                                </select>
                            </div>
                        </div>

                        {/* Posts Grid */}
                        <div className="admin-blog-posts-card">
                            {loadingPosts ? (
                                <div className="admin-blog-loading">
                                    <div className="admin-blog-spinner"></div>
                                    <p>Loading posts...</p>
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="admin-blog-empty-state">
                                    <FileText size={48} />
                                    <h3>No posts found</h3>
                                    <p>No posts match your current filters.</p>
                                </div>
                            ) : (
                                <div className="admin-blog-posts-grid">
                                    {filteredPosts.map((post, index) => (
                                        <div key={`blog-post-${post.id || `temp-${index}`}`} className="admin-blog-post-card">
                                            {post.image && (
                                                <div className="admin-blog-post-image">
                                                    <img
                                                        src={post.image}
                                                        alt={post.imageAlt || post.title || 'Blog post image'}
                                                    />
                                                </div>
                                            )}

                                            <div className="admin-blog-post-content">
                                                <div className="admin-blog-post-header">
                                                    <h3 className="admin-blog-post-title">{post.title || 'Untitled Post'}</h3>
                                                    <span className={`admin-blog-status-badge ${post.status || 'published'}`}>
                                                        {post.status === 'draft' ? 'Draft' : 'Published'}
                                                    </span>
                                                </div>

                                                <div className="admin-blog-post-meta">
                                                    <div className="admin-blog-post-meta-item">
                                                        <User size={14} />
                                                        <span>{post.isAdminPost ? 'MyPetConnect' : (post.author || 'Unknown')}</span>
                                                    </div>
                                                    <div className="admin-blog-post-meta-item">
                                                        <Calendar size={14} />
                                                        <span>{post.date ? post.date.toLocaleDateString() : 'No date'}</span>
                                                    </div>
                                                </div>

                                                {post.excerpt && (
                                                    <p className="admin-blog-post-excerpt">
                                                        {post.excerpt.substring(0, 120)}...
                                                    </p>
                                                )}

                                                {Array.isArray(post.categories) && post.categories.length > 0 && (
                                                    <div className="admin-blog-post-categories">
                                                        {post.categories.slice(0, 3).map((category, idx) => (
                                                            <span key={idx} className="admin-blog-category-tag">
                                                                {category}
                                                            </span>
                                                        ))}
                                                        {post.categories.length > 3 && (
                                                            <span className="admin-blog-category-more">
                                                                +{post.categories.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="admin-blog-post-actions">
                                                <button
                                                    onClick={() => loadPostForEditing(post.id)}
                                                    className="admin-blog-post-action-btn edit"
                                                    title="Edit post"
                                                    disabled={!post.id}
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => togglePostStatus(post.id, post.status || 'published')}
                                                    className={`admin-blog-post-action-btn status ${post.status || 'published'}`}
                                                    title={post.status === 'published' ? 'Make draft' : 'Publish'}
                                                    disabled={!post.id}
                                                >
                                                    {(post.status || 'published') === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => deletePost(post.id, post.title)}
                                                    className="admin-blog-post-action-btn delete"
                                                    title="Delete post"
                                                    disabled={!post.id}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showPreview && (
                <div className="admin-blog-preview-modal-overlay">
                    <div className="admin-blog-preview-modal">
                        <div className="admin-blog-preview-modal-header">
                            <h3 className="admin-blog-preview-modal-title">
                                Preview: {form.title || 'Untitled Post'}
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="admin-blog-preview-modal-close"
                                aria-label="Close preview"
                            >
                                ×
                            </button>
                        </div>
                        <div className="admin-blog-preview-modal-content">
                            <article className="admin-blog-preview-article">
                                {form.image && (
                                    <img
                                        src={form.image}
                                        alt={form.imageAlt || form.title || 'Blog post image'}
                                    />
                                )}
                                <h1>{form.title || 'Your post title will appear here...'}</h1>

                                <div className="admin-blog-preview-meta">
                                    <div className="admin-blog-preview-meta-item">
                                        <User size={16} />
                                        <span>By {userProfile?.isAdmin ? 'MyPetConnect' : form.author}</span>
                                    </div>
                                    <div className="admin-blog-preview-meta-item">
                                        <Calendar size={16} />
                                        <span>{form.date}</span>
                                    </div>
                                    <div className="admin-blog-preview-meta-item">
                                        <Eye size={16} />
                                        <span>{form.readTime}</span>
                                    </div>
                                </div>

                                {Array.isArray(form.categories) && form.categories.length > 0 && (
                                    <div className="admin-blog-preview-categories">
                                        {form.categories.map((category, idx) => (
                                            <span key={idx} className="admin-blog-preview-category-tag">
                                    {category}
                                </span>
                                        ))}
                                    </div>
                                )}

                                {form.excerpt && (
                                    <div className="admin-blog-preview-excerpt">
                                        {form.excerpt}
                                    </div>
                                )}

                                <div
                                    className="admin-blog-preview-content"
                                    dangerouslySetInnerHTML={{ __html: form.content || '<p>Start writing your content...</p>' }}
                                />
                            </article>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}