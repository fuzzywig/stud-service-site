import React, { useState } from "react";
import { FaFilter, FaTimes } from "react-icons/fa";
import { breedOptions } from "../components/breedOptions";
import "./MobileFilterPanel.css";

const colourOptions = [
    "Red", "Chocolate", "Black", "Cream", "Apricot", "Merle", "Silver", "White"
];

const ageRangeOptions = [
    "Under 1 year", "1 - 2 years", "2 - 4 years", "4+ years"
];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "fee-asc", label: "Lowest Stud Fee" },
    { value: "fee-desc", label: "Highest Stud Fee" },
    { value: "age-asc", label: "Youngest Age" },
    { value: "age-desc", label: "Oldest Age" },
    { value: "most-reviewed", label: "Most Reviewed" },
    { value: "highest-rated", label: "Highest Rated" }
];

export default function MobileFilterPanel({
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
                                              filters,
                                              setFilters,
                                              resetFilters,
                                              topBreeds
                                          }) {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <>
            <div className="mobile-filter-buttons">
                <button className="filter-btn" onClick={togglePanel}>
                    <FaFilter /> Filter & Sort
                </button>
            </div>

            {isOpen && (
                <div className="mobile-filter-panel">
                    {/* Header with title + close button */}
                    <div className="filter-panel-header">
                        <h3>Filters & Sorting</h3>
                        <button className="close-btns" onClick={togglePanel}><FaTimes /></button>
                    </div>

                    {/* Scrollable content section */}
                    <div className="filter-panel-body">
                        <div className="panel-section">
                            <label>Breed</label>
                            <select
                                value={selectedBreed}
                                onChange={(e) => setSelectedBreed(e.target.value)}
                            >
                                <option value="">All Breeds</option>
                                {breedOptions.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="panel-section">
                            <label>Sort By</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="panel-section">
                            <label className="panel-label">Max Stud Fee: £{maxFee || 1000}</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                step="25"
                                value={maxFee || 0}
                                onChange={(e) => setMaxFee(e.target.value)}
                                className="panel-slider"
                            />
                        </div>

                        <div className="panel-section">
                            <label>Colour</label>
                            <select
                                value={selectedColour}
                                onChange={(e) => setSelectedColour(e.target.value)}
                            >
                                <option value="">All Colours</option>
                                {colourOptions.map((colour) => (
                                    <option key={colour} value={colour}>{colour}</option>
                                ))}
                            </select>
                        </div>

                        <div className="panel-section">
                            <label>Age Range</label>
                            <select
                                value={selectedAgeRange}
                                onChange={(e) => setSelectedAgeRange(e.target.value)}
                            >
                                <option value="">Any Age</option>
                                {ageRangeOptions.map((range) => (
                                    <option key={range} value={range}>{range}</option>
                                ))}
                            </select>
                        </div>

                        <div className="panel-section checkbox-group">
                            <label><input type="checkbox" checked={filters.kc} onChange={() => setFilters({ ...filters, kc: !filters.kc })} /> KC Registered</label>
                            <label><input type="checkbox" checked={filters.healthTested} onChange={() => setFilters({ ...filters, healthTested: !filters.healthTested })} /> Health Tested</label>
                            <label><input type="checkbox" checked={filters.proven} onChange={() => setFilters({ ...filters, proven: !filters.proven })} /> Proven</label>
                        </div>

                        <div className="panel-section">
                            <label>Popular Breeds</label>
                            <div className="popular-breeds">
                                {topBreeds.slice(0, 10).map(([label]) => (
                                    <span
                                        key={label}
                                        className="popular-breed"
                                        onClick={() => setSelectedBreed(label)}
                                    >
            {label}
          </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer with reset button */}
                    <div className="panel-footer">
                        <button
                            className="apply-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            Apply & Close
                        </button>

                        <button
                            className="reset-btn"
                            onClick={() => {
                                if (typeof resetFilters === "function") {
                                    resetFilters();
                                }
                                setIsOpen(false);
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>

                </div>

            )}
        </>
    );
}
