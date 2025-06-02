// src/components/BreedSelector.jsx
import React, { useEffect, useState } from 'react';
import { petBreedOptions } from '../pages/data/breedOptions';

/**
 * A specialized breed selector that dynamically loads the appropriate breeds
 * based on the selected category, subcategory, and pet type
 *
 * @param {Object} props - Component properties
 * @param {string} props.mainCategory - Selected main category (e.g., "mammals", "birds")
 * @param {string} props.subCategory - Selected subcategory (e.g., "dogs", "cats")
 * @param {string} props.petType - Selected pet type for subcategories with types
 * @param {string} props.value - Currently selected breed value
 * @param {Function} props.onChange - Change handler function
 * @param {boolean} props.required - Whether the field is required
 */
const BreedSelector = ({
                           mainCategory,
                           subCategory,
                           petType,
                           value,
                           onChange,
                           required = false,
                           placeholder = "Select a breed..."
                       }) => {
    const [breedOptions, setBreedOptions] = useState([]);

    // Determine which breed options to display based on selections
    useEffect(() => {
        let options = [];

        // Determine which breed list to use based on selection
        if (mainCategory === "mammals") {
            if (subCategory === "dogs") {
                options = petBreedOptions.dogs;
            } else if (subCategory === "cats") {
                options = petBreedOptions.cats;
            } else if (subCategory === "rabbits") {
                options = petBreedOptions.rabbits;
            } else if (subCategory === "rodents") {
                if (petType) {
                    // Use filtered list or basic options for rodents
                    options = ["Mixed Breed", petType, `${petType} (Other)`];
                }
            } else if (subCategory === "horses") {
                options = petBreedOptions.horses;
            } else if (subCategory === "livestock") {
                if (petType) {
                    // Basic livestock breeds based on type
                    const basicLivestockBreeds = {
                        "alpaca": ["Huacaya", "Suri", "Mixed Breed"],
                        "camel": ["Dromedary", "Bactrian", "Hybrid"],
                        "cowsBulls": ["Angus", "Holstein", "Jersey", "Hereford", "Charolais", "Limousin", "Simmental", "Mixed Breed"],
                        "donkey": ["Miniature", "Standard", "Mammoth", "Mixed Breed"],
                        "goats": ["Alpine", "Nubian", "Boer", "Pygmy", "Angora", "Nigerian Dwarf", "Mixed Breed"],
                        "llama": ["Ccara", "Curaca", "Mixed Breed"],
                        "pig": ["Berkshire", "Hampshire", "Duroc", "Yorkshire", "Potbelly", "Kunekune", "Mixed Breed"],
                        "sheep": ["Dorper", "Merino", "Suffolk", "Dorset", "Jacob", "Texel", "Mixed Breed"],
                    };

                    options = basicLivestockBreeds[petType] || ["Mixed Breed"];
                }
            }
        } else if (mainCategory === "birds") {
            options = petBreedOptions.birds;
        } else if (mainCategory === "reptiles") {
            options = petBreedOptions.reptiles;
        } else if (mainCategory === "fish") {
            options = petBreedOptions.fish;
        } else if (mainCategory === "invertebrates") {
            options = petBreedOptions.invertebrates;
        }

        // Always include "Mixed Breed" and "Other" if not already in list
        if (!options.includes("Mixed Breed")) {
            options = [...options, "Mixed Breed"];
        }
        if (!options.includes("Other")) {
            options = [...options, "Other"];
        }

        setBreedOptions(options);
    }, [mainCategory, subCategory, petType]);

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className="form-group">
            <label className="form-label">Breed</label>
            <select
                className="form-control"
                value={value || ""}
                onChange={handleChange}
                required={required}
            >
                <option value="">{placeholder}</option>
                {breedOptions.map(breed => (
                    <option key={breed} value={breed}>
                        {breed}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default BreedSelector;