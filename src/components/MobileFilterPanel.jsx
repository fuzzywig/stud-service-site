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
                                              selectedRegistrationBody,
                                              setSelectedRegistrationBody,
                                              searchKeywords,
                                              setSearchKeywords,
                                              selectedGender,
                                              setSelectedGender,
                                              selectedBreederType,
                                              setSelectedBreederType,
                                              searchPostcode,
                                              setSearchPostcode,
                                              handlePostcodeSearch,
                                              isLoadingPostcode,
                                              postcodeParam,
                                              filters,
                                              setFilters,
                                              topBreeds,
                                              availableBreedsOrTypes,
                                              resetFilters,
                                              searchRadius,
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
                {/* Advert Type */}
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

                {/* Filter by Breed */}
                <div className="filter-group">
                    <label>Filter by {selectedCategory === "livestock" ? "Type" : "Breed"}</label>
                    <select value={selectedBreed} onChange={e => setSelectedBreed(e.target.value)}>
                        <option value="">All {selectedCategory === "livestock" ? "Types" : "Breeds"}</option>
                        {(availableBreedsOrTypes || topBreeds.map(([breed]) => breed)).map(breed => (
                            <option key={breed} value={breed}>{breed}</option>
                        ))}
                    </select>
                </div>

                {/* Location Search */}
                <div className="filter-group">
                    <label>Location Search</label>
                    <input
                        type="text"
                        placeholder="Enter postcode..."
                        value={searchPostcode}
                        onChange={e => setSearchPostcode(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handlePostcodeSearch()}
                    />
                    <button
                        className="postcode-search-btn"
                        onClick={handlePostcodeSearch}
                        disabled={isLoadingPostcode}
                        style={{
                            width: '100%',
                            marginTop: '8px',
                            padding: '10px 16px',
                            backgroundColor: '#a03248',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isLoadingPostcode ? 'wait' : 'pointer'
                        }}
                    >
                        {isLoadingPostcode ? 'Loading...' : 'Search Location'}
                    </button>
                    {postcodeParam && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                            Searching near: {postcodeParam}
                        </p>
                    )}
                </div>

                {/* Distance */}
                <div className="filter-group">
                    <label>Distance: {searchRadius} mi</label>
                    <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="range-slider"
                    />
                    <div className="price-range-labels">
                        <span>50 mi</span>
                        <span>1000 mi</span>
                    </div>
                </div>

                {/* Price */}
                <div className="filter-group">
                    <label>Max Price: £{maxFee || 1000}</label>
                    <input
                        type="range"
                        min="0"
                        max="10000"
                        step="25"
                        value={maxFee || 0}
                        onChange={e => setMaxFee(Number(e.target.value))}
                        className="range-slider"
                    />
                    <div className="price-range-labels">
                        <span>£0</span>
                        <span>£10,000</span>
                    </div>
                </div>

                {/* Sort By */}
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

                {/* Search Keywords */}
                <div className="filter-group">
                    <label>Search Keywords</label>
                    <input
                        type="text"
                        placeholder="Search in title and description..."
                        value={searchKeywords}
                        onChange={e => setSearchKeywords(e.target.value)}
                    />
                </div>

                {/* Breeder Type */}
                <div className="filter-group">
                    <label>Breeder Type</label>
                    <select value={selectedBreederType} onChange={e => setSelectedBreederType(e.target.value)}>
                        <option value="">All Breeders</option>
                        <option value="licensed">Licensed Breeders</option>
                        <option value="hobby">Hobby Breeders</option>
                    </select>
                </div>

                {/* Colour - only for dogs and cats */}
                {(selectedCategory === "dogs" || selectedCategory === "cats") && (
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
                )}

                {/* Registration Body - only for cats */}
                {selectedCategory === "cats" && (
                    <div className="filter-group">
                        <label>Registration Body</label>
                        <select
                            value={selectedRegistrationBody}
                            onChange={e => setSelectedRegistrationBody(e.target.value)}
                        >
                            <option value="">All Registrations</option>
                            <option value="GCCF">GCCF</option>
                            <option value="TICA">TICA</option>
                            <option value="FIFe">FIFe</option>
                        </select>
                    </div>
                )}

                {/* Gender - only for sale */}
                {selectedIntent === "sale" && (
                    <div className="filter-group">
                        <label>Gender</label>
                        <select
                            value={selectedGender}
                            onChange={e => setSelectedGender(e.target.value)}
                        >
                            <option value="">Any Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="both">Both Available</option>
                        </select>
                    </div>
                )}

                {/* Age Range */}
                <div className="filter-group">
                    <label>Age Range</label>
                    <select
                        value={selectedAgeRange}
                        onChange={e => setSelectedAgeRange(e.target.value)}
                    >
                        <option value="">Any Age</option>
                        <option value="Under 1 year">Under 1 year</option>
                        <option value="1 - 2 years">1 - 2 years</option>
                        <option value="2 - 4 years">2 - 4 years</option>
                        <option value="4+ years">4+ years</option>
                    </select>
                </div>

                {/* Checkboxes */}
                <div className="filter-group checkbox-group">
                    <h3>Additional Options</h3>
                    {selectedCategory === "dogs" && (
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.kc}
                                onChange={() => setFilters(f => ({ ...f, kc: !f.kc }))}
                            />
                            <span className="checkbox-text">KC Registered</span>
                        </label>
                    )}
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
                            checked={filters.healthChecked}
                            onChange={() => setFilters(f => ({ ...f, healthChecked: !f.healthChecked }))}
                        />
                        <span className="checkbox-text">Health Checked</span>
                    </label>
                    {selectedIntent === "stud" && (
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.proven}
                                onChange={() => setFilters(f => ({ ...f, proven: !f.proven }))}
                            />
                            <span className="checkbox-text">Proven</span>
                        </label>
                    )}
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