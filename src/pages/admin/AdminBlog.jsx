// src/pages/AdminBlogPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { db, auth } from '../firebase/firebase';
import { collection, setDoc, doc, serverTimestamp, getDoc, getDocs, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { v4 as uuidv4 } from 'uuid';
import SearchableCategorySelect from '../components/SearchableCategorySelect';
import ImageUpload from '../components/ImageUpload';
import { Edit3, Trash2, Eye, EyeOff, Plus, Search, Filter, Calendar, User } from 'lucide-react';
import { createSlug, isValidSlug } from '../utils/blogUtils';
import './AdminBlogPage.css';

export default function AdminBlogPage() {
    const [user, loading, error] = useAuthState(auth);
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'manage'
    const [editorMode, setEditorMode] = useState('wysiwyg');
    const [userProfile, setUserProfile] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const editorRef = useRef(null);
    const [customCategories, setCustomCategories] = useState([]);

    //slug
    const [slugTouched, setSlugTouched] = useState(false);
    const [slugError, setSlugError] = useState('');
    const [checkingSlug, setCheckingSlug] = useState(false);

    // Posts management state
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');

    // Updated function to get user display name from database
    const getUserDisplayName = () => {
        if (!user) return 'Admin';

        // First priority: Use database profile data if available
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }

        // Second priority: Use Firebase display name
        if (user.displayName) return user.displayName;

        // Fallback: Use email
        if (user.email) {
            const emailName = user.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }

        return 'Admin';
    };

    // function to check slug uniqueness
    const checkSlugUniqueness = async (slug) => {
        if (!slug || slug === form.slug) return true;

        setCheckingSlug(true);
        try {
            const q = query(
                collection(db, 'blogPosts'),
                where('slug', '==', slug)
            );
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

    // Function to fetch user profile from database
    const fetchUserProfile = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                setUserProfile(profileData);
                console.log('User profile loaded:', profileData);
            } else {
                console.log('No user profile found in database');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const [form, setForm] = useState({
        title: '',
        slug: '',
        id: '',
        author: 'Admin',
        date: new Date().toLocaleDateString('en-GB'),
        readTime: '3 min read',
        image: '',
        excerpt: '',
        content: '',
        categories: [],
        status: 'published',
    });

    // Reset form to default state
    const resetForm = () => {
        setForm({
            title: '',
            slug: '',
            id: '',
            author: getUserDisplayName(),
            date: new Date().toLocaleDateString('en-GB'),
            readTime: '3 min read',
            image: '',
            excerpt: '',
            content: '',
            categories: [],
            status: 'published',
        });
        setIsEditing(false);
        setEditingPostId(null);
        setSlugTouched(false);
        setSlugError('');

        // Clear TinyMCE editor content
        if (window.tinymce && window.tinymce.get('blog-content-editor')) {
            window.tinymce.get('blog-content-editor').setContent('');
        }
    };

    // Fetch all blog posts for management
    const fetchPosts = async () => {
        try {
            setLoadingPosts(true);
            console.log('🔄 Fetching blog posts for management...');

            const postsRef = collection(db, 'blogPosts');
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const postsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const postId = doc.id;

                console.log('Processing post:', {
                    docId: postId,
                    title: data.title,
                    hasValidId: !!(postId && typeof postId === 'string')
                });

                return {
                    id: postId,
                    ...data,
                    date: data.createdAt ? data.createdAt.toDate() : new Date(),
                };
            }).filter(post => {
                const hasValidId = post.id && typeof post.id === 'string' && post.id.length > 0;
                if (!hasValidId) {
                    console.warn('⚠️ Found post with invalid ID:', post);
                }
                return hasValidId;
            });

            setPosts(postsData);
            console.log(`✅ Loaded ${postsData.length} valid blog posts`);

        } catch (error) {
            console.error('❌ Error fetching posts:', error);
            alert('Failed to load posts. Check console for details.');
        } finally {
            setLoadingPosts(false);
        }
    };

    // Load a post for editing
    const loadPostForEditing = async (postId) => {
        if (!postId || postId.trim() === '') {
            console.error('❌ Cannot load post for editing: Invalid or empty post ID');
            alert('Cannot load post: Invalid post ID');
            return;
        }

        try {
            console.log('📝 Loading post for editing:', postId);
            const postDoc = await getDoc(doc(db, 'blogPosts', postId));

            if (postDoc.exists()) {
                const postData = postDoc.data();

                setForm({
                    ...postData,
                    id: postId,
                    slug: postData.slug || createSlug(postData.title || ''),
                    date: postData.createdAt ? postData.createdAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                    categories: Array.isArray(postData.categories) ? postData.categories : [],
                });

                setIsEditing(true);
                setEditingPostId(postId);
                setActiveTab('create');
                setSlugTouched(true);

                // Update TinyMCE content if editor is ready
                setTimeout(() => {
                    if (window.tinymce && window.tinymce.get('blog-content-editor')) {
                        window.tinymce.get('blog-content-editor').setContent(postData.content || '');
                    }
                }, 500);

                console.log('✅ Post loaded for editing');
            } else {
                alert('Post not found!');
            }
        } catch (error) {
            console.error('❌ Error loading post for editing:', error);
            alert('Failed to load post for editing. Check console for details.');
        }
    };

    // Delete a post
    const deletePost = async (postId, postTitle) => {
        if (!postId || postId.trim() === '') {
            console.error('❌ Cannot delete post: Invalid or empty post ID');
            alert('Cannot delete post: Invalid post ID');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log('🗑️ Deleting post:', postId);
            await deleteDoc(doc(db, 'blogPosts', postId));

            setPosts(prev => prev.filter(post => post.id !== postId));

            alert('✅ Post deleted successfully!');
            console.log('✅ Post deleted:', postId);
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            alert('Failed to delete post. Check console for details.');
        }
    };

    // Toggle post status (published/draft)
    const togglePostStatus = async (postId, currentStatus) => {
        if (!postId || postId.trim() === '') {
            console.error('❌ Cannot toggle status: Invalid or empty post ID');
            alert('Cannot update post: Invalid post ID');
            return;
        }

        const newStatus = currentStatus === 'published' ? 'draft' : 'published';

        try {
            console.log('🔄 Toggling post status:', postId, 'from', currentStatus, 'to', newStatus);
            await updateDoc(doc(db, 'blogPosts', postId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            setPosts(prev => prev.map(post =>
                post.id === postId ? { ...post, status: newStatus } : post
            ));

            console.log('✅ Post status updated');
        } catch (error) {
            console.error('❌ Error updating post status:', error);
            alert('Failed to update post status. Check console for details.');
        }
    };

    const handleAddCategory = (newCategory) => {
        if (!customCategories.includes(newCategory)) {
            setCustomCategories(prev => [...prev, newCategory]);
            console.log('New category added:', newCategory);

            const savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
            const updatedCategories = [...new Set([...savedCategories, newCategory])];
            localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
        }
    };

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
        if (user) {
            fetchUserProfile(user.uid);
        }
    }, [user]);

    useEffect(() => {
        if (user || userProfile) {
            setForm(prev => ({
                ...prev,
                author: getUserDisplayName()
            }));
        }
    }, [user, userProfile]);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchPosts();
        }
    }, [activeTab]);

    // Initialize WYSIWYG editor
    useEffect(() => {
        const initEditor = () => {
            if (editorRef.current && window.tinymce) {
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
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; }',
                    skin: 'oxide',
                    content_css: 'default',
                    branding: false,
                    promotion: false,
                    readonly: false,
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

        if (!window.tinymce) {
            const script = document.createElement('script');
            script.src = 'https://cdn.tiny.cloud/1/7uvns8obt1qy17abfvm4kjs0mkygig4lfewbn2kh2z5dqebu/tinymce/6/tinymce.min.js';
            script.onload = initEditor;
            document.head.appendChild(script);
        } else {
            initEditor();
        }

        return () => {
            if (window.tinymce && window.tinymce.get('blog-content-editor')) {
                window.tinymce.get('blog-content-editor').remove();
            }
        };
    }, [editorMode, activeTab]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'slug') {
            setSlugTouched(true);
            setSlugError('');
            const cleanSlug = createSlug(value);
            setForm({ ...form, [name]: cleanSlug });

            if (cleanSlug) {
                setTimeout(() => checkSlugUniqueness(cleanSlug), 500);
            }
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleContentChange = (e) => {
        const { value } = e.target;
        setForm({ ...form, content: value });

        if (editorMode === 'wysiwyg' && window.tinymce && editorRef.current) {
            const editor = window.tinymce.get(editorRef.current.id);
            if (editor) {
                editor.setContent(value);
            }
        }
    };

    const toggleEditorMode = () => {
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('❌ You must be logged in to create blog posts.');
            return;
        }

        if (!form.slug) {
            alert('❌ URL slug is required.');
            return;
        }

        if (!isValidSlug(form.slug)) {
            alert('❌ URL slug must contain only lowercase letters, numbers, and hyphens.');
            return;
        }

        const isSlugUnique = await checkSlugUniqueness(form.slug);
        if (!isSlugUnique) {
            alert('❌ This URL slug is already in use. Please choose a different one.');
            return;
        }

        let finalContent = form.content;
        if (editorMode === 'wysiwyg' && window.tinymce) {
            const editor = window.tinymce.get('blog-content-editor');
            if (editor) {
                finalContent = editor.getContent();
            }
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

            if (!isEditing) {
                postData.createdAt = serverTimestamp();
            }

            console.log('💾 Saving blog post with data:', {
                ...postData,
                isEditing,
                postId
            });

            await setDoc(doc(db, 'blogPosts', postId), postData, { merge: isEditing });

            alert(isEditing ? '✅ Blog post updated successfully!' : '✅ Blog post created successfully!');
            console.log('Blog post saved:', postData);

            if (activeTab === 'manage') {
                fetchPosts();
            }

            resetForm();

        } catch (error) {
            console.error('❌ Error saving blog post:', error);
            alert('Failed to save blog post. See console for details.');
        }
    };

    const handleImageUploadError = (error) => {
        setUploadError(error);
        setTimeout(() => setUploadError(''), 5000);
    };

    const insertQuickText = (text) => {
        if (editorMode === 'wysiwyg' && window.tinymce) {
            const editor = window.tinymce.get('blog-content-editor');
            if (editor && !editor.isHidden()) {
                editor.insertContent(text);
                return;
            }
        }

        setForm(prev => ({ ...prev, content: prev.content + text }));
    };

    // Filter posts based on search and status
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || post.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="admin-layout">
                <AdminSidebar />
                <main className="admin-main-content">
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Loading user information...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-main-content">
                <div className="admin-page-header">
                    <h1 className="admin-page-title">Blog Administration</h1>
                    <p className="admin-page-subtitle">Create and manage your blog posts with our advanced editor</p>
                </div>

                {/* Blog Admin Navigation Bar */}
                <nav className="blog-admin-navbar">
                    <div className="blog-admin-nav-content">
                        {/* Tab Navigation */}
                        <div className="blog-admin-tabs">
                            <button
                                className={`blog-admin-tab ${activeTab === 'create' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('create');
                                    if (!isEditing) resetForm();
                                }}
                            >
                                <Plus size={16} />
                                {isEditing ? 'Edit Post' : 'Create Post'}
                            </button>
                            <button
                                className={`blog-admin-tab ${activeTab === 'manage' ? 'active' : ''}`}
                                onClick={() => setActiveTab('manage')}
                            >
                                <Filter size={16} />
                                Manage Posts
                            </button>
                        </div>

                        {/* Additional Nav Items */}
                        <div className="blog-admin-nav-actions">
                            <a
                                href="/blog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="blog-admin-nav-link"
                                title="View Public Blog"
                            >
                                <Eye size={16} />
                                View Blog
                            </a>
                            {activeTab === 'create' && isEditing && (
                                <button
                                    onClick={resetForm}
                                    className="blog-admin-nav-button"
                                    title="Cancel editing and create new post"
                                >
                                    <Plus size={16} />
                                    New Post
                                </button>
                            )}
                            {activeTab === 'manage' && (
                                <span className="blog-admin-posts-count">
                                    {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                                </span>
                            )}
                        </div>
                    </div>
                </nav>

                {activeTab === 'create' && (
                    <div className="blog-admin-layout">
                        <section className="blog-admin-form-section">
                            <div className="blog-admin-form-header">
                                <h2 className="blog-admin-form-title">
                                    {isEditing ? 'Edit Post' : 'Create New Post'}
                                </h2>
                                {isEditing && (
                                    <button
                                        onClick={resetForm}
                                        className="blog-admin-cancel-edit"
                                        type="button"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="blog-admin-form">
                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">Post Title</label>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Enter an engaging title..."
                                        className="blog-admin-input"
                                        required
                                    />
                                    <span className="blog-admin-form-hint">This will be the main headline of your post</span>
                                </div>

                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">URL Slug</label>
                                    <input
                                        name="slug"
                                        value={form.slug}
                                        onChange={handleChange}
                                        placeholder="url-friendly-slug"
                                        className={`blog-admin-input ${slugError ? 'error' : ''}`}
                                        required
                                    />
                                    {checkingSlug && <span className="blog-admin-form-hint checking">Checking availability...</span>}
                                    {slugError && <span className="blog-admin-form-hint error">{slugError}</span>}
                                    {!slugError && !checkingSlug && form.slug && (
                                        <span className="blog-admin-form-hint">URL: /blog/{form.slug}</span>
                                    )}
                                </div>

                                <div className="blog-admin-form-row">
                                    <div className="blog-admin-form-group">
                                        <label className="blog-admin-form-label">Author</label>
                                        <div className="blog-admin-author-section">
                                            <div className="blog-admin-author-avatar">
                                                {getUserDisplayName().split(' ').map(name => name[0]).join('').toUpperCase()}
                                            </div>
                                            <input
                                                name="author"
                                                value={form.author}
                                                onChange={handleChange}
                                                placeholder="Author name"
                                                className="blog-admin-input blog-admin-author-input"
                                                title={user?.email || 'Current user'}
                                            />
                                        </div>
                                        <span className="blog-admin-form-hint">
                                            {user?.email ? `Logged in as: ${user.email}` : 'Not logged in'}
                                            {userProfile?.isAdmin && (
                                                <span style={{ color: '#3498db', fontWeight: '500' }}>
                                                    {' '}• Admin (will show as "MyPetConnect")
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="blog-admin-form-group">
                                        <label className="blog-admin-form-label">Read Time</label>
                                        <input
                                            name="readTime"
                                            value={form.readTime}
                                            onChange={handleChange}
                                            placeholder="e.g., 5 min read"
                                            className="blog-admin-input"
                                        />
                                    </div>
                                </div>

                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">Status</label>
                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        className="blog-admin-input"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <span className="blog-admin-form-hint">
                                        Published posts are visible to readers, drafts are only visible to admins
                                    </span>
                                </div>

                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">Featured Image</label>
                                    {uploadError && (
                                        <div className="blog-admin-error-message">
                                            {uploadError}
                                        </div>
                                    )}
                                    <ImageUpload
                                        value={form.image}
                                        onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
                                        onError={handleImageUploadError}
                                    />
                                    <span className="blog-admin-form-hint">
                                        Upload a compelling featured image for your post (max 5MB)
                                    </span>
                                </div>

                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">Categories</label>
                                    <SearchableCategorySelect
                                        value={Array.isArray(form.categories) ? form.categories : []}
                                        onChange={(categories) => setForm(prev => ({ ...prev, categories }))}
                                        placeholder="Search and select categories..."
                                        categories={customCategories}
                                        onAddCategory={handleAddCategory}
                                        maxSelections={5}
                                    />
                                    <span className="blog-admin-form-hint">
                                        Select up to 5 categories that best describe your post content
                                    </span>
                                </div>

                                <div className="blog-admin-form-group">
                                    <label className="blog-admin-form-label">Excerpt</label>
                                    <textarea
                                        name="excerpt"
                                        value={form.excerpt}
                                        onChange={handleChange}
                                        placeholder="Write a compelling summary that will appear in post previews..."
                                        className="blog-admin-textarea"
                                        rows={3}
                                    />
                                    <span className="blog-admin-form-hint">Keep it under 160 characters for best SEO results</span>
                                </div>

                                <div className="blog-admin-form-group">
                                    <div className="blog-admin-editor-header">
                                        <label className="blog-admin-form-label">Content</label>
                                        <div className="blog-admin-editor-controls">
                                            <button
                                                type="button"
                                                onClick={toggleEditorMode}
                                                className={`blog-admin-editor-toggle ${editorMode === 'wysiwyg' ? 'active' : ''}`}
                                                title="Toggle between visual and code editor"
                                            >
                                                {editorMode === 'wysiwyg' ? '🎨 Visual' : '💻 Code'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="blog-admin-quick-insert">
                                        <button
                                            type="button"
                                            onClick={() => insertQuickText('<h2>Section Heading</h2>')}
                                            className="blog-admin-quick-btn"
                                            title="Insert heading"
                                        >
                                            H2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertQuickText('<p><strong>Important:</strong> </p>')}
                                            className="blog-admin-quick-btn"
                                            title="Insert important note"
                                        >
                                            📌
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertQuickText('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>')}
                                            className="blog-admin-quick-btn"
                                            title="Insert bullet list"
                                        >
                                            📋
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertQuickText('<blockquote><p>Quote text here...</p></blockquote>')}
                                            className="blog-admin-quick-btn"
                                            title="Insert quote"
                                        >
                                            💬
                                        </button>
                                    </div>

                                    {editorMode === 'wysiwyg' ? (
                                        <div className="blog-admin-wysiwyg-wrapper">
                                            <textarea
                                                ref={editorRef}
                                                id="blog-content-editor"
                                                className="blog-admin-wysiwyg-editor"
                                            />
                                        </div>
                                    ) : (
                                        <textarea
                                            name="content"
                                            value={form.content}
                                            onChange={handleContentChange}
                                            placeholder="Write your blog post content here. You can use HTML tags for formatting..."
                                            className="blog-admin-textarea blog-admin-content-textarea"
                                            rows={15}
                                        />
                                    )}

                                    <span className="blog-admin-form-hint">
                                        {editorMode === 'wysiwyg'
                                            ? 'Use the toolbar above for formatting, or switch to code mode for HTML editing'
                                            : 'Write HTML directly or switch to visual mode for easier formatting'
                                        }
                                    </span>
                                </div>

                                <button type="submit" className="blog-admin-submit">
                                    {isEditing ? '✏️ Update Blog Post' : '📝 Publish Blog Post'}
                                </button>
                            </form>
                        </section>

                        <section className="blog-admin-preview-section">
                            <h2 className="blog-admin-preview-title">Live Preview</h2>

                            <div className="blog-admin-preview-content">
                                {form.title || form.excerpt || form.content ? (
                                    <div className="blog-admin-preview-post">
                                        {form.image && (
                                            <img
                                                src={form.image}
                                                alt={form.title || 'Blog post preview'}
                                                className="blog-admin-preview-image"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}

                                        <h1 className="blog-admin-preview-post-title">
                                            {form.title || 'Your post title will appear here...'}
                                        </h1>

                                        <div className="blog-admin-preview-meta">
                                            <span>👤 {userProfile?.isAdmin ? 'MyPetConnect' : form.author}</span>
                                            <span>📅 {form.date}</span>
                                            <span>⏱️ {form.readTime}</span>
                                            <span className={`status-badge ${form.status}`}>
                                                {form.status === 'published' ? '✅ Published' : '📝 Draft'}
                                            </span>
                                        </div>

                                        {Array.isArray(form.categories) && form.categories.length > 0 && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                {form.categories.map((category, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="blog-admin-category-preview"
                                                    >
                                                        {category}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {form.excerpt && (
                                            <p className="blog-admin-preview-excerpt">
                                                {form.excerpt}
                                            </p>
                                        )}

                                        <article
                                            className="blog-admin-preview-article"
                                            dangerouslySetInnerHTML={{
                                                __html: form.content
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="blog-admin-preview-empty">
                                        <div className="blog-admin-preview-empty-icon">📝</div>
                                        <p>Start typing to see your blog post preview...</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className="blog-admin-manage-section">
                        {/* Search and Filter Controls */}
                        <div className="blog-admin-controls">
                            <div className="blog-admin-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search posts by title, author, or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="blog-admin-search-input"
                                />
                            </div>

                            <div className="blog-admin-filters">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="blog-admin-filter-select"
                                >
                                    <option value="all">All Posts</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Drafts</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="blog-admin-filter-select"
                                >
                                    <option value="createdAt">Sort by Date</option>
                                    <option value="title">Sort by Title</option>
                                    <option value="author">Sort by Author</option>
                                </select>
                            </div>
                        </div>

                        {/* Posts List */}
                        <div className="blog-admin-posts-list">
                            {loadingPosts ? (
                                <div className="blog-admin-loading">
                                    <p>Loading posts...</p>
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="blog-admin-empty">
                                    <p>No posts found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="blog-admin-posts-grid">
                                    {filteredPosts.map((post, index) => (
                                        <div key={`blog-post-${post.id || `temp-${index}`}`} className="blog-admin-post-card">
                                            {post.image && !post.image.includes('via.placeholder.com') && (
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="blog-admin-post-image"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}

                                            <div className="blog-admin-post-content">
                                                <h3 className="blog-admin-post-title">{post.title || 'Untitled Post'}</h3>

                                                <div className="blog-admin-post-meta">
                                                    <span className="blog-admin-post-author">
                                                        <User size={14} />
                                                        {post.isAdminPost ? 'MyPetConnect' : (post.author || 'Unknown Author')}
                                                    </span>
                                                    <span className="blog-admin-post-date">
                                                        <Calendar size={14} />
                                                        {post.date ? post.date.toLocaleDateString() : 'No date'}
                                                    </span>
                                                    <span className={`blog-admin-status-badge ${post.status || 'published'}`}>
                                                        {post.status === 'draft' ? 'Draft' : 'Published'}
                                                    </span>
                                                </div>

                                                {post.excerpt && (
                                                    <p className="blog-admin-post-excerpt">
                                                        {post.excerpt.substring(0, 120)}...
                                                    </p>
                                                )}

                                                {Array.isArray(post.categories) && post.categories.length > 0 && (
                                                    <div className="blog-admin-post-categories">
                                                        {post.categories.slice(0, 3).map((category, idx) => (
                                                            <span key={`category-${post.id || index}-${idx}-${category}`} className="blog-admin-category-tag">
                                                                {category}
                                                            </span>
                                                        ))}
                                                        {post.categories.length > 3 && (
                                                            <span className="blog-admin-category-more">
                                                                +{post.categories.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {!post.id && (
                                                    <div className="blog-admin-error-message">
                                                        ⚠️ Missing Post ID - Actions disabled
                                                    </div>
                                                )}
                                            </div>

                                            <div className="blog-admin-post-actions">
                                                <button
                                                    onClick={() => loadPostForEditing(post.id)}
                                                    className="blog-admin-action-btn edit"
                                                    title={post.id ? "Edit post" : "Cannot edit - missing ID"}
                                                    disabled={!post.id}
                                                >
                                                    <Edit3 size={16} />
                                                </button>

                                                <button
                                                    onClick={() => togglePostStatus(post.id, post.status || 'published')}
                                                    className={`blog-admin-action-btn toggle ${post.status || 'published'}`}
                                                    title={post.id ? (post.status === 'published' ? 'Make draft' : 'Publish') : "Cannot toggle - missing ID"}
                                                    disabled={!post.id}
                                                >
                                                    {(post.status || 'published') === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>

                                                <button
                                                    onClick={() => deletePost(post.id, post.title)}
                                                    className="blog-admin-action-btn delete"
                                                    title={post.id ? "Delete post" : "Cannot delete - missing ID"}
                                                    disabled={!post.id}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}