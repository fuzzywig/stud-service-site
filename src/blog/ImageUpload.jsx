// ImageUpload.jsx - New component for handling image uploads

import React, { useState, useRef } from 'react';
import { storage } from '../firebase/firebase'; // Adjust path as needed
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const ImageUpload = ({ value, onChange, onError }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Accepted image types
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const validateFile = (file) => {
        if (!acceptedTypes.includes(file.type)) {
            throw new Error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        }
        if (file.size > maxFileSize) {
            throw new Error('File size must be less than 5MB');
        }
        return true;
    };

    const uploadImage = async (file) => {
        try {
            validateFile(file);
            setUploading(true);
            setUploadProgress(0);

            // Create unique filename
            const fileName = `blog-images/${uuidv4()}-${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Track upload progress
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(Math.round(progress));
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        setUploading(false);
                        setUploadProgress(0);
                        reject(error);
                    },
                    async () => {
                        // Upload completed successfully
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            setUploading(false);
                            setUploadProgress(0);
                            onChange(downloadURL);
                            resolve(downloadURL);
                        } catch (error) {
                            console.error('Error getting download URL:', error);
                            setUploading(false);
                            setUploadProgress(0);
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            setUploading(false);
            setUploadProgress(0);
            if (onError) onError(error.message);
            throw error;
        }
    };

    const handleFileSelect = async (file) => {
        try {
            await uploadImage(file);
        } catch (error) {
            console.error('File upload failed:', error);
            if (onError) onError(error.message);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => acceptedTypes.includes(file.type));

        if (imageFile) {
            handleFileSelect(imageFile);
        } else if (onError) {
            onError('Please drop a valid image file');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const removeImage = async () => {
        if (value) {
            try {
                // Extract file path from URL to delete from storage
                const url = new URL(value);
                const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
                if (pathMatch) {
                    const filePath = decodeURIComponent(pathMatch[1]);
                    const fileRef = ref(storage, filePath);
                    await deleteObject(fileRef);
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                // Continue anyway to clear the URL
            }
            onChange('');
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="image-upload-container">
            {!value ? (
                <div
                    className={`image-upload-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={!uploading ? openFileDialog : undefined}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="upload-progress">
                            <div className="upload-spinner"></div>
                            <p>Uploading... {uploadProgress}%</p>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            <div className="upload-icon">📷</div>
                            <p className="upload-text">
                                <strong>Click to upload</strong> or drag and drop
                            </p>
                            <p className="upload-subtext">
                                PNG, JPG, WebP or GIF (max 5MB)
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="image-preview">
                    <img
                        src={value}
                        alt="Featured image preview"
                        className="preview-image"
                        onError={(e) => {
                            console.error('Image load error');
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="image-overlay">
                        <button
                            type="button"
                            onClick={openFileDialog}
                            className="change-image-btn"
                            disabled={uploading}
                        >
                            Change Image
                        </button>
                        <button
                            type="button"
                            onClick={removeImage}
                            className="remove-image-btn"
                            disabled={uploading}
                        >
                            Remove
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </div>
            )}

            <style>
                {`
                .image-upload-container {
                    width: 100%;
                }

                .image-upload-dropzone {
                    border: 2px dashed #d1d5db;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #fafafa;
                    min-height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-upload-dropzone:hover:not(.uploading) {
                    border-color: #0369a1;
                    background: #f0f9ff;
                }

                .image-upload-dropzone.drag-over {
                    border-color: #059669;
                    background: #ecfdf5;
                    transform: scale(1.02);
                }

                .image-upload-dropzone.uploading {
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .upload-icon {
                    font-size: 3rem;
                    opacity: 0.6;
                }

                .upload-text {
                    font-size: 1.1rem;
                    color: #374151;
                    margin: 0;
                }

                .upload-subtext {
                    font-size: 0.9rem;
                    color: #6b7280;
                    margin: 0;
                }

                .upload-progress {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    width: 100%;
                    max-width: 300px;
                }

                .upload-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #0369a1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #0369a1, #059669);
                    transition: width 0.3s ease;
                    border-radius: 4px;
                }

                .image-preview {
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                }

                .preview-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    display: block;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .image-preview:hover .image-overlay {
                    opacity: 1;
                }

                .change-image-btn,
                .remove-image-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 14px;
                }

                .change-image-btn {
                    background: #0369a1;
                    color: white;
                }

                .change-image-btn:hover:not(:disabled) {
                    background: #0284c7;
                }

                .remove-image-btn {
                    background: #dc2626;
                    color: white;
                }

                .remove-image-btn:hover:not(:disabled) {
                    background: #ef4444;
                }

                .change-image-btn:disabled,
                .remove-image-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                `}
            </style>
        </div>
    );
};

export default ImageUpload;