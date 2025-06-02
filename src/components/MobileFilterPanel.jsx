// File: src/components/MobileFilterPanel.jsx
import React from "react";
import "./MobileFilterPanel.css";

export default function MobileFilterPanel({
                                              isOpen,
                                              onClose,
                                              colourOptions,
                                              selectedBreed,
                                              setSelectedBreed,
                                              sortOrder,
                                              setSortOrder,
                                              maxFee,
                                              setMaxFee,
                                              selectedColour,
                                              setSelectedColour,
                                              selectedAgeRange,
                                              setSelectedAgeRange,
                                              selectedCategory,
                                              setSelectedCategory,
                                              selectedIntent,
                                              setSelectedIntent,
                                              filters,
                                              setFilters,
                                              topBreeds,
                                              availableBreedsOrTypes,
                                              resetFilters,
                                              searchRadius,           // ⬅️ Add this
                                              setSearchRadius
                                          }) {
    if (!isOpen) return null;

    return (
        <div className="mobile-filter-fullscreen">
            <div className="mobile-filter-header">
                <h2>Filters</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="mobile-filter-content">
                {/* Advert Intent */}
                <div className="filter-group">
                    <label>Advert Type</label>
                    <select value={selectedIntent || ""} onChange={e => setSelectedIntent && setSelectedIntent(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="sale">For Sale</option>
                        <option value="stud">For Stud</option>
                    </select>
                </div>

                {/* Pet Category */}
                <div className="filter-group">
                    <label>Pet Category</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="dogs">Dogs</option>
                        <option value="cats">Cats</option>
                        <option value="rabbits">Rabbits</option>
                        <option value="rodents">Rodents</option>
                        <option value="horses">Horses & Ponies</option>
                        <option value="livestock">Livestock</option>
                        <option value="birds">Birds</option>
                        <option value="reptiles">Reptiles</option>
                        <option value="fish">Fish</option>
                        <option value="inverts">Invertebrates</option>
                    </select>
                </div>

                {/* Breed */}
                <div className="filter-group">
                    <label>{selectedCategory === "livestock" ? "Type" : "Breed"}</label>
                    <select value={selectedBreed} onChange={e => setSelectedBreed(e.target.value)}>
                        <option value="">All {selectedCategory === "livestock" ? "Types" : "Breeds"}</option>
                        {(availableBreedsOrTypes || topBreeds.map(([breed]) => breed)).map(breed => (
                            <option key={breed} value={breed}>{breed}</option>
                        ))}
                    </select>
                </div>

                {/* Sort */}
                <div className="filter-group">
                    <label>Sort By</label>
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="fee-asc">Lowest Price</option>
                        <option value="fee-desc">Highest Price</option>
                        <option value="age-asc">Youngest Age</option>
                        <option value="age-desc">Oldest Age</option>
                    </select>
                </div>

                {/* Max Fee */}
                <div className="filter-group">
                    <label>Max Price: £{maxFee || 1000}</label>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        step="25"
                        value={maxFee || 0}
                        onChange={e => setMaxFee(Number(e.target.value))}
                        className="range-slider"
                    />
                    <div className="price-range-labels">
                        <span>£0</span>
                        <span>£1000</span>
                    </div>
                </div>
                {/* Distance */}
                <div className="filter-group">
                    <label>Distance: {searchRadius} mi</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="range-slider"
                    />
                    <div className="price-range-labels">
                        <span>1 mi</span>
                        <span>100 mi</span>
                    </div>
                </div>


                {/* Colour */}
                <div className="filter-group">
                    <label>Colour</label>
                    <select
                        value={selectedColour}
                        onChange={e => setSelectedColour(e.target.value)}
                    >
                        <option value="">All Colours</option>
                        {colourOptions.map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                </div>

                {/* Flags */}
                <div className="filter-group checkbox-group">
                    <h3>Additional Options</h3>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.kc}
                            onChange={() => setFilters(f => ({ ...f, kc: !f.kc }))}
                        />
                        <span className="checkbox-text">KC Registered</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.healthTested}
                            onChange={() => setFilters(f => ({ ...f, healthTested: !f.healthTested }))}
                        />
                        <span className="checkbox-text">Health Tested</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.proven}
                            onChange={() => setFilters(f => ({ ...f, proven: !f.proven }))}
                        />
                        <span className="checkbox-text">Proven</span>
                    </label>
                </div>

                {/* Popular Breeds Section */}
                <div className="filter-group">
                    <h3>Popular Breeds</h3>
                    <div className="popular-breeds-tags">
                        {topBreeds.slice(0, 8).map(([breed]) => (
                            <span
                                key={breed}
                                className={`breed-tag ${selectedBreed === breed ? 'selected' : ''}`}
                                onClick={() => setSelectedBreed(breed)}
                            >
                {breed}
              </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mobile-filter-actions">
                <button className="reset-filters-btn" onClick={resetFilters}>
                    Reset All
                </button>
                <button className="apply-filters-btn" onClick={onClose}>
                    Show Results
                </button>
            </div>
        </div>
    );
}