import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Edit2, Trash2, Send, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { db, storage, auth } from '../firebase/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    increment,
    getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AdvertUpdates.css';

// Emoji reactions available
const EMOJI_REACTIONS = ['👍', '❤️', '😊', '😮', '👏', '🔥'];

export default function AdvertUpdates({ advertId, ownerId, onUpdatesLoaded }) {
    const [updates, setUpdates] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newText, setNewText] = useState('');
    const [newImage, setNewImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editImage, setEditImage] = useState(null);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [comments, setComments] = useState({});
    const [showComments, setShowComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [showEmojiPicker, setShowEmojiPicker] = useState({});
    const [replies, setReplies] = useState({});
    const [showReplies, setShowReplies] = useState({});
    const [newReply, setNewReply] = useState({});
    const [replyingTo, setReplyingTo] = useState({});

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (advertId) {
            fetchInitial();
        }
    }, [advertId]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.au-reaction-wrapper')) {
                setShowEmojiPicker({});
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchInitial = async () => {
        if (!advertId) {
            console.warn("AdvertUpdates: advertId is undefined");
            if (onUpdatesLoaded) {
                onUpdatesLoaded(0);
            }
            return;
        }

        setLoading(true);
        try {
            const q = query(
                collection(db, 'updates'),
                where('advertId', '==', advertId),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                reactions: d.data().reactions || {},
                reactedBy: d.data().reactedBy || {}
            }));
            setUpdates(list);
            setLastVisible(snap.docs[snap.docs.length - 1] || null);
            setHasMore(snap.docs.length === 5);

            if (onUpdatesLoaded) {
                onUpdatesLoaded(list.length);
            }
        } catch (error) {
            console.error("Error fetching updates:", error);
            if (onUpdatesLoaded) {
                onUpdatesLoaded(0);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!lastVisible || !advertId || loading) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, 'updates'),
                where('advertId', '==', advertId),
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(5)
            );
            const snap = await getDocs(q);
            const more = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                reactions: d.data().reactions || {},
                reactedBy: d.data().reactedBy || {}
            }));
            setUpdates(prev => [...prev, ...more]);
            setLastVisible(snap.docs[snap.docs.length - 1] || null);
            setHasMore(snap.docs.length === 5);
        } catch (error) {
            console.error("Error loading more updates:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';

        try {
            const firebaseDate = date?.toDate ? date.toDate() : new Date(date);
            const now = new Date();
            const diffMs = now - firebaseDate;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
            if (diffMins < 2880) return 'Yesterday';
            return firebaseDate.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the owner can post updates.");
            return;
        }

        if (!newText.trim()) return;

        try {
            let imageUrl = '';
            if (newImage) {
                const storageRef = ref(storage, `updates/${advertId}/${Date.now()}_${newImage.name}`);
                await uploadBytes(storageRef, newImage);
                imageUrl = await getDownloadURL(storageRef);
            }

            const data = {
                advertId,
                text: newText,
                imageUrl,
                posterId: currentUser.uid,
                createdAt: serverTimestamp(),
                reactions: {},
                reactedBy: {},
                commentCount: 0
            };

            const docRef = await addDoc(collection(db, 'updates'), data);

            // Add to local state with client timestamp for immediate display
            setUpdates(prev => [{
                id: docRef.id,
                ...data,
                createdAt: new Date()
            }, ...prev]);

            setNewText('');
            setNewImage(null);

            if (onUpdatesLoaded) {
                onUpdatesLoaded(updates.length + 1);
            }
        } catch (error) {
            console.error("Error posting update:", error);
            alert("Failed to post update. Please try again.");
        }
    };

    const handleEditClick = (update) => {
        setEditingId(update.id);
        setEditText(update.text);
        setEditImage(null);
    };

    const handleUpdateSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the owner can edit updates.");
            return;
        }

        try {
            let imageUrl = updates.find(u => u.id === editingId).imageUrl;
            if (editImage) {
                const storageRef = ref(storage, `updates/${advertId}/${Date.now()}_${editImage.name}`);
                await uploadBytes(storageRef, editImage);
                imageUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(doc(db, 'updates', editingId), {
                text: editText,
                imageUrl,
                updatedAt: serverTimestamp()
            });

            setUpdates(prev =>
                prev.map(u => (u.id === editingId ? { ...u, text: editText, imageUrl } : u))
            );

            setEditingId(null);
            setEditText('');
            setEditImage(null);
        } catch (error) {
            console.error("Error updating:", error);
            alert("Failed to update. Please try again.");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
        setEditImage(null);
    };

    const handleDelete = async (id) => {
        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the owner can delete updates.");
            return;
        }

        if (!window.confirm('Delete this update?')) return;

        try {
            // Delete all comments for this update
            const commentsQuery = query(collection(db, 'comments'), where('updateId', '==', id));
            const commentsSnap = await getDocs(commentsQuery);
            const deletePromises = commentsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete the update
            await deleteDoc(doc(db, 'updates', id));
            setUpdates(prev => prev.filter(u => u.id !== id));

            if (onUpdatesLoaded) {
                onUpdatesLoaded(updates.length - 1);
            }
        } catch (error) {
            console.error("Error deleting update:", error);
            alert("Failed to delete update. Please try again.");
        }
    };

    const handleReaction = async (updateId, emoji) => {
        if (!currentUser) {
            alert("Please log in to react to updates.");
            return;
        }

        try {
            const updateRef = doc(db, 'updates', updateId);
            const updateDocSnap = await getDoc(updateRef);

            if (!updateDocSnap.exists()) {
                console.error("Update document not found");
                return;
            }

            const updateData = updateDocSnap.data();
            const reactions = updateData.reactions || {};
            const reactedBy = updateData.reactedBy || {};

            // Find if user has any existing reaction
            let previousReaction = null;
            for (const [emojiKey, users] of Object.entries(reactedBy)) {
                if (users.includes(currentUser.uid)) {
                    previousReaction = emojiKey;
                    break;
                }
            }

            // Remove previous reaction if exists
            if (previousReaction) {
                reactions[previousReaction] = Math.max(0, (reactions[previousReaction] || 0) - 1);
                reactedBy[previousReaction] = reactedBy[previousReaction].filter(uid => uid !== currentUser.uid);

                if (reactedBy[previousReaction].length === 0) {
                    delete reactedBy[previousReaction];
                }
                if (reactions[previousReaction] === 0) {
                    delete reactions[previousReaction];
                }
            }

            // Add new reaction only if it's different from the previous one
            if (previousReaction !== emoji) {
                reactions[emoji] = (reactions[emoji] || 0) + 1;
                reactedBy[emoji] = [...(reactedBy[emoji] || []), currentUser.uid];
            }

            await updateDoc(updateRef, { reactions, reactedBy });

            setUpdates(prev =>
                prev.map(u => u.id === updateId ? { ...u, reactions, reactedBy } : u)
            );

            setShowEmojiPicker(prev => ({ ...prev, [updateId]: false }));
        } catch (error) {
            console.error("Error updating reaction:", error);
        }
    };

    const toggleComments = async (updateId) => {
        setShowComments(prev => ({ ...prev, [updateId]: !prev[updateId] }));

        if (!comments[updateId] && !loadingComments[updateId]) {
            await loadComments(updateId);
        }
    };

    const loadComments = async (updateId) => {
        setLoadingComments(prev => ({ ...prev, [updateId]: true }));

        try {
            const q = query(
                collection(db, 'comments'),
                where('updateId', '==', updateId),
                orderBy('createdAt', 'desc')
            );

            const snap = await getDocs(q);
            const commentsList = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                reactions: d.data().reactions || {},
                reactedBy: d.data().reactedBy || {}
            }));

            setComments(prev => ({ ...prev, [updateId]: commentsList }));
        } catch (error) {
            console.error("Error loading comments:", error);
        } finally {
            setLoadingComments(prev => ({ ...prev, [updateId]: false }));
        }
    };

    const handleCommentSubmit = async (updateId) => {
        if (!currentUser) {
            alert("Please log in to comment.");
            return;
        }

        const commentText = newComment[updateId];
        if (!commentText?.trim()) return;

        try {
            // Fetch user's name
            let userName = 'Anonymous';
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                        userData.displayName ||
                        currentUser.email ||
                        'Anonymous';
                }
            } catch (error) {
                console.error("Error fetching user name:", error);
                userName = currentUser.email || 'Anonymous';
            }

            const commentData = {
                updateId,
                text: commentText,
                userId: currentUser.uid,
                userName: userName,
                createdAt: serverTimestamp(),
                reactions: {},
                reactedBy: {},
                replyCount: 0
            };

            const docRef = await addDoc(collection(db, 'comments'), commentData);

            // Update comment count
            await updateDoc(doc(db, 'updates', updateId), {
                commentCount: increment(1)
            });

            // Add to local state
            const newCommentObj = {
                id: docRef.id,
                ...commentData,
                createdAt: new Date()
            };

            setComments(prev => ({
                ...prev,
                [updateId]: [newCommentObj, ...(prev[updateId] || [])]
            }));

            setUpdates(prev =>
                prev.map(u => u.id === updateId
                    ? { ...u, commentCount: (u.commentCount || 0) + 1 }
                    : u
                )
            );

            setNewComment(prev => ({ ...prev, [updateId]: '' }));
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment. Please try again.");
        }
    };

    const handleDeleteComment = async (commentId, updateId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
            await updateDoc(doc(db, 'updates', updateId), {
                commentCount: increment(-1)
            });

            setComments(prev => ({
                ...prev,
                [updateId]: prev[updateId].filter(c => c.id !== commentId)
            }));

            setUpdates(prev =>
                prev.map(u => u.id === updateId
                    ? { ...u, commentCount: Math.max(0, (u.commentCount || 0) - 1) }
                    : u
                )
            );
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment. Please try again.");
        }
    };

    const loadReplies = async (commentId) => {
        try {
            const q = query(
                collection(db, 'replies'),
                where('commentId', '==', commentId),
                orderBy('createdAt', 'asc')
            );

            const snap = await getDocs(q);
            const repliesList = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                reactions: d.data().reactions || {},
                reactedBy: d.data().reactedBy || {}
            }));

            setReplies(prev => ({ ...prev, [commentId]: repliesList }));
        } catch (error) {
            console.error("Error loading replies:", error);
        }
    };

    const toggleReplies = async (commentId) => {
        setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));

        if (!replies[commentId] && !showReplies[commentId]) {
            await loadReplies(commentId);
        }
    };

    const handleReplySubmit = async (commentId, updateId) => {
        if (!currentUser) {
            alert("Please log in to reply.");
            return;
        }

        const replyText = newReply[commentId];
        if (!replyText?.trim()) return;

        try {
            // Fetch user's name
            let userName = 'Anonymous';
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                        userData.displayName ||
                        currentUser.email ||
                        'Anonymous';
                }
            } catch (error) {
                console.error("Error fetching user name:", error);
            }

            const replyData = {
                commentId,
                updateId,
                text: replyText,
                userId: currentUser.uid,
                userName: userName,
                createdAt: serverTimestamp(),
                reactions: {},
                reactedBy: {}
            };

            const docRef = await addDoc(collection(db, 'replies'), replyData);

            // Update reply count on comment
            const commentRef = doc(db, 'comments', commentId);
            await updateDoc(commentRef, {
                replyCount: increment(1)
            });

            // Add to local state
            const newReplyObj = {
                id: docRef.id,
                ...replyData,
                createdAt: new Date()
            };

            setReplies(prev => ({
                ...prev,
                [commentId]: [...(prev[commentId] || []), newReplyObj]
            }));

            // Update comment's reply count in local state
            setComments(prev => ({
                ...prev,
                [updateId]: prev[updateId].map(c =>
                    c.id === commentId
                        ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                        : c
                )
            }));

            setNewReply(prev => ({ ...prev, [commentId]: '' }));
            setReplyingTo(prev => ({ ...prev, [commentId]: false }));
        } catch (error) {
            console.error("Error adding reply:", error);
            alert("Failed to add reply. Please try again.");
        }
    };

    const getUserReaction = (item) => {
        if (!currentUser || !item.reactedBy) return null;
        for (const [emoji, users] of Object.entries(item.reactedBy)) {
            if (users.includes(currentUser.uid)) return emoji;
        }
        return null;
    };

    const getTotalReactionCount = (reactions) => {
        if (!reactions) return 0;
        return Object.values(reactions).reduce((sum, count) => sum + count, 0);
    };

    return (
        <div className="au-container">
            {/* Header */}
            <div className="au-header">
                <h3>Advert Updates</h3>
                <p>
                    Stay updated with the latest changes. Everyone can interact, but only the owner can post updates.
                </p>
            </div>

            {/* New Update Form */}
            {currentUser?.uid === ownerId && (
                <div className="au-form-card">
                    <textarea
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Share an update about your advert..."
                        className="au-textarea"
                        rows="3"
                    />
                    <div className="au-form-actions">
                        <label className="au-image-label">
                            <Image size={20} />
                            <span>Add image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewImage(e.target.files[0])}
                                className="au-image-input"
                            />
                        </label>
                        <button
                            onClick={handleSubmit}
                            disabled={!newText.trim()}
                            className="au-post-btn"
                        >
                            <Send size={16} />
                            Post Update
                        </button>
                    </div>
                </div>
            )}

            {/* Updates List */}
            <div className="au-updates-list">
                {updates.length === 0 && !loading ? (
                    <div className="au-empty-state">
                        <p>No updates yet. {currentUser?.uid === ownerId && "Be the first to post an update!"}</p>
                    </div>
                ) : (
                    updates.map((update) => (
                        <div key={update.id} className="au-update-card">
                            {editingId === update.id ? (
                                <div className="au-update-content">
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="au-textarea"
                                        rows="3"
                                        required
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setEditImage(e.target.files[0])}
                                        className="au-edit-image-input"
                                    />
                                    <div className="au-edit-buttons">
                                        <button onClick={handleUpdateSubmit} className="au-save-btn">Save</button>
                                        <button onClick={handleCancelEdit} className="au-cancel-btn">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="au-update-content">
                                    {/* Update Header */}
                                    <div className="au-update-header">
                                        <div className="au-update-main">
                                            <p className="au-update-text">{update.text}</p>
                                            <div className="au-update-time">{formatDate(update.createdAt)}</div>
                                        </div>
                                        {currentUser?.uid === ownerId && (
                                            <div className="au-update-actions">
                                                <button onClick={() => handleEditClick(update)} className="au-icon-btn">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(update.id)} className="au-icon-btn au-delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Update Image */}
                                    {update.imageUrl && (
                                        <img
                                            src={update.imageUrl}
                                            alt="Update"
                                            className="au-update-image"
                                            onClick={() => setLightboxUrl(update.imageUrl)}
                                        />
                                    )}

                                    {/* Reactions Bar */}
                                    <div className="au-reactions-bar">
                                        <div className="au-reactions-left">
                                            {/* Reaction Button */}
                                            <div className="au-reaction-wrapper">
                                                <button
                                                    onClick={() => setShowEmojiPicker({ ...showEmojiPicker, [update.id]: !showEmojiPicker[update.id] })}
                                                    className={`au-reaction-btn ${getUserReaction(update) ? 'au-reacted' : ''}`}
                                                >
                                                    {getUserReaction(update) || <ThumbsUp size={16} />}
                                                    <span>{getUserReaction(update) ? '' : 'Like'}</span>
                                                </button>

                                                {/* Emoji Picker */}
                                                {showEmojiPicker[update.id] && (
                                                    <div className="au-emoji-picker">
                                                        {EMOJI_REACTIONS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(update.id, emoji)}
                                                                className="au-emoji-option"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Comment Button */}
                                            <button
                                                onClick={() => toggleComments(update.id)}
                                                className="au-comment-btn"
                                            >
                                                <MessageCircle size={16} />
                                                <span>{update.commentCount || 0}</span>
                                            </button>

                                            {/* Reactions Summary */}
                                            {getTotalReactionCount(update.reactions) > 0 && (
                                                <div className="au-reactions-summary">
                                                    {Object.entries(update.reactions || {})
                                                        .filter(([_, count]) => count > 0)
                                                        .slice(0, 3)
                                                        .map(([emoji]) => (
                                                            <span key={emoji} className="au-reaction-emoji">{emoji}</span>
                                                        ))}
                                                    <span className="au-reaction-count">
                                                        {getTotalReactionCount(update.reactions)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {showComments[update.id] && (
                                        <div className="au-comments-section">
                                            {/* Comment Input */}
                                            {currentUser && (
                                                <div className="au-comment-input-wrapper">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        value={newComment[update.id] || ''}
                                                        onChange={(e) => setNewComment({ ...newComment, [update.id]: e.target.value })}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(update.id)}
                                                        className="au-comment-input"
                                                    />
                                                    <button
                                                        onClick={() => handleCommentSubmit(update.id)}
                                                        disabled={!newComment[update.id]?.trim()}
                                                        className="au-send-btn"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {loadingComments[update.id] ? (
                                                <div className="au-loading-comments">Loading comments...</div>
                                            ) : (
                                                <div className="au-comments-list">
                                                    {comments[update.id]?.map((comment) => (
                                                        <div key={comment.id} className="au-comment-card">
                                                            <div className="au-comment-header">
                                                                <span className="au-comment-author">{comment.userName}</span>
                                                                <span className="au-comment-time">{formatDate(comment.createdAt)}</span>
                                                            </div>
                                                            <p className="au-comment-text">{comment.text}</p>

                                                            {/* Comment Actions */}
                                                            <div className="au-comment-actions">
                                                                <button
                                                                    onClick={() => handleReaction(comment.id, '👍')}
                                                                    className={`au-comment-action-btn ${getUserReaction(comment) ? 'au-reacted' : ''}`}
                                                                >
                                                                    {getUserReaction(comment) || '👍'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setReplyingTo({ ...replyingTo, [comment.id]: !replyingTo[comment.id] })}
                                                                    className="au-comment-action-btn"
                                                                >
                                                                    Reply
                                                                </button>
                                                                {comment.replyCount > 0 && (
                                                                    <button
                                                                        onClick={() => toggleReplies(comment.id)}
                                                                        className="au-comment-action-btn au-view-replies-btn"
                                                                    >
                                                                        {showReplies[comment.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                                        {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                                                    </button>
                                                                )}
                                                                {(currentUser?.uid === comment.userId || currentUser?.uid === ownerId) && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(comment.id, update.id)}
                                                                        className="au-comment-action-btn au-delete-comment"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Reply Input */}
                                                            {replyingTo[comment.id] && (
                                                                <div className="au-reply-input-wrapper">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Write a reply..."
                                                                        value={newReply[comment.id] || ''}
                                                                        onChange={(e) => setNewReply({ ...newReply, [comment.id]: e.target.value })}
                                                                        onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(comment.id, update.id)}
                                                                        className="au-reply-input"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleReplySubmit(comment.id, update.id)}
                                                                        className="au-send-reply-btn"
                                                                    >
                                                                        <Send size={14} />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Replies */}
                                                            {showReplies[comment.id] && replies[comment.id] && (
                                                                <div className="au-replies-wrapper">
                                                                    {replies[comment.id].map((reply) => (
                                                                        <div key={reply.id} className="au-reply-card">
                                                                            <div className="au-comment-header">
                                                                                <span className="au-reply-author">{reply.userName}</span>
                                                                                <span className="au-reply-time">{formatDate(reply.createdAt)}</span>
                                                                            </div>
                                                                            <p className="au-reply-text">{reply.text}</p>
                                                                            {(currentUser?.uid === reply.userId || currentUser?.uid === ownerId) && (
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        if (!window.confirm('Delete this reply?')) return;
                                                                                        await deleteDoc(doc(db, 'replies', reply.id));
                                                                                        await updateDoc(doc(db, 'comments', comment.id), {
                                                                                            replyCount: increment(-1)
                                                                                        });
                                                                                        setReplies(prev => ({
                                                                                            ...prev,
                                                                                            [comment.id]: prev[comment.id].filter(r => r.id !== reply.id)
                                                                                        }));
                                                                                        setComments(prev => ({
                                                                                            ...prev,
                                                                                            [update.id]: prev[update.id].map(c =>
                                                                                                c.id === comment.id
                                                                                                    ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                                                                                                    : c
                                                                                            )
                                                                                        }));
                                                                                    }}
                                                                                    className="au-delete-reply"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <button className="au-load-more" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}

            {/* Loading Spinner */}
            {loading && updates.length === 0 && (
                <div className="au-loading">
                    <div className="au-loading-spinner"></div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="au-lightbox"
                    onClick={() => setLightboxUrl(null)}
                >
                    <img
                        src={lightboxUrl}
                        alt="Full size"
                        className="au-lightbox-image"
                    />
                </div>
            )}
        </div>
    );
}