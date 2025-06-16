// SearchableCategorySelect.jsx - Complete fixed version

import React, { useState, useRef, useEffect } from 'react';

const SearchableCategorySelect = ({
                                      value = [], // Now expects an array for multiple categories
                                      onChange,
                                      placeholder = "Select categories...",
                                      categories = [],
                                      onAddCategory,
                                      maxSelections = 5 // Limit how many can be selected
                                  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCategories, setFilteredCategories] = useState(categories);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Default categories - more comprehensive list
    const defaultCategories = [
        'Health Tips',
        'Training Advice',
        'Breeding',
        'News',
        'Nutrition',
        'Behavior',
        'Grooming',
        'Veterinary Care',
        'Product Reviews',
        'Pet Care',
        'Exercise',
        'Safety',
        'Puppy Training',
        'Senior Pets',
        'Emergency Care',
        'Travel',
        'Toys & Accessories'
    ];

    const allCategories = [...new Set([...defaultCategories, ...categories])];

    // Filter categories based on search term and exclude already selected
    useEffect(() => {
        if (!searchTerm) {
            setFilteredCategories(allCategories.filter(cat => !value.includes(cat)));
        } else {
            const filtered = allCategories.filter(category =>
                category.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !value.includes(category)
            );
            setFilteredCategories(filtered);
        }
    }, [searchTerm, categories, value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleCategorySelect = (category) => {
        if (!value.includes(category) && value.length < maxSelections) {
            onChange([...value, category]);
            setSearchTerm('');
        }
    };

    const removeCategory = (categoryToRemove) => {
        onChange(value.filter(cat => cat !== categoryToRemove));
    };

    const handleAddNewCategory = () => {
        if (searchTerm.trim() && !allCategories.some(cat =>
            cat.toLowerCase() === searchTerm.trim().toLowerCase()
        ) && value.length < maxSelections) {
            const newCategory = searchTerm.trim();
            if (onAddCategory) {
                onAddCategory(newCategory);
            }
            handleCategorySelect(newCategory);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCategories.length === 1) {
                handleCategorySelect(filteredCategories[0]);
            } else if (searchTerm.trim() && !allCategories.some(cat =>
                cat.toLowerCase() === searchTerm.trim().toLowerCase()
            )) {
                handleAddNewCategory();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const showAddOption = searchTerm.trim() &&
        !allCategories.some(cat => cat.toLowerCase() === searchTerm.trim().toLowerCase()) &&
        value.length < maxSelections;

    return (
        <div className="searchable-category-select" ref={dropdownRef}>
            {/* Display selected categories */}
            {value.length > 0 && (
                <div className="selected-categories">
                    {value.map((category, idx) => (
                        <span key={idx} className="selected-category-tag">
                            {category}
                            <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="remove-category-btn"
                                title="Remove category"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="category-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length >= maxSelections ? `Maximum ${maxSelections} categories` : placeholder}
                    className="blog-admin-input category-search-input"
                    disabled={value.length >= maxSelections}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="category-dropdown-arrow"
                    disabled={value.length >= maxSelections}
                    tabIndex={-1}
                >
                    {isOpen ? '▲' : '▼'}
                </button>
            </div>

            {isOpen && value.length < maxSelections && (
                <div className="category-dropdown">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category, index) => (
                            <div
                                key={index}
                                className="category-option"
                                onClick={() => handleCategorySelect(category)}
                            >
                                {category}
                            </div>
                        ))
                    ) : searchTerm.trim() ? (
                        <div className="category-no-results">
                            No categories found
                        </div>
                    ) : (
                        <div className="category-no-results">
                            All available categories selected
                        </div>
                    )}

                    {showAddOption && (
                        <div
                            className="category-option add-new"
                            onClick={handleAddNewCategory}
                        >
                            <span className="add-icon">+ </span>
                            Add "{searchTerm.trim()}"
                        </div>
                    )}

                    {searchTerm.trim() && filteredCategories.length > 0 &&
                        !allCategories.some(cat => cat.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                            <div
                                className="category-option add-new"
                                onClick={handleAddNewCategory}
                            >
                                <span className="add-icon">+ </span>
                                Add "{searchTerm.trim()}"
                            </div>
                        )}
                </div>
            )}

            <style>
                {`
                .selected-categories {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .selected-category-tag {
                    display: inline-flex;
                    align-items: center;
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .remove-category-btn {
                    background: none;
                    border: none;
                    color: #0369a1;
                    cursor: pointer;
                    margin-left: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s ease;
                }

                .remove-category-btn:hover {
                    background-color: rgba(3, 105, 161, 0.1);
                }

                .searchable-category-select {
                    position: relative;
                    width: 100%;
                }

                .category-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .category-search-input {
                    padding-right: 40px !important;
                }

                .category-search-input:disabled {
                    background-color: #f9fafb;
                    color: #6b7280;
                    cursor: not-allowed;
                }

                .category-dropdown-arrow {
                    position: absolute;
                    right: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 12px;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s ease;
                }

                .category-dropdown-arrow:hover:not(:disabled) {
                    color: #374151;
                }

                .category-dropdown-arrow:disabled {
                    color: #d1d5db;
                    cursor: not-allowed;
                }

                .category-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    z-index: 1000;
                    max-height: 300px;
                    overflow-y: auto;
                    margin-top: 4px;
                }

                .category-option {
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    border-bottom: 1px solid #f3f4f6;
                }

                .category-option:last-child {
                    border-bottom: none;
                }

                .category-option:hover {
                    background-color: #f9fafb;
                }

                .category-option.add-new {
                    background-color: #f0f9ff;
                    color: #0369a1;
                    font-weight: 500;
                    border-top: 1px solid #e5e7eb;
                }

                .category-option.add-new:hover {
                    background-color: #e0f2fe;
                }

                .add-icon {
                    color: #059669;
                    font-weight: bold;
                }

                .category-no-results {
                    padding: 12px 16px;
                    color: #6b7280;
                    font-style: italic;
                    text-align: center;
                }

                .category-dropdown::-webkit-scrollbar {
                    width: 6px;
                }

                .category-dropdown::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                .category-dropdown::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 3px;
                }

                .category-dropdown::-webkit-scrollbar-thumb:hover {
                    background: #a1a1a1;
                }
                `}
            </style>
        </div>
    );
};

export default SearchableCategorySelect;