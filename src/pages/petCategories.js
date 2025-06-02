// petCategories.js
// This file contains the hierarchical structure of pet categories for selection

const petCategories = {
    mammals: {
        name: "Mammals",
        subcategories: {
            dogs: {
                name: "Dogs",
                listingTypes: ["sale", "stud", "wanted"],
                fields: ["breed", "age", "color", "gender", "price", "health"]
            },
            cats: {
                name: "Cats",
                listingTypes: ["sale", "wanted"],
                fields: ["breed", "age", "color", "gender", "price", "health"]
            },
            smallMammals: {
                name: "Small Mammals",
                types: [
                    { id: "rabbits", name: "Rabbits" },
                    { id: "guineaPigs", name: "Guinea Pigs" },
                    { id: "hamsters", name: "Hamsters" },
                    { id: "ferrets", name: "Ferrets" },
                    { id: "chinchillas", name: "Chinchillas" },
                    { id: "gerbils", name: "Gerbils" },
                    { id: "rats", name: "Rats" },
                    { id: "mice", name: "Mice" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "breed", "age", "color", "gender", "price"]
            }
        }
    },
    birds: {
        name: "Birds",
        subcategories: {
            smallBirds: {
                name: "Small Birds",
                types: [
                    { id: "budgies", name: "Budgies" },
                    { id: "finches", name: "Finches" },
                    { id: "canaries", name: "Canaries" },
                    { id: "lovebirds", name: "Lovebirds" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "age", "color", "gender", "price"]
            },
            mediumLargeBirds: {
                name: "Medium & Large Birds",
                types: [
                    { id: "cockatiels", name: "Cockatiels" },
                    { id: "parrots", name: "Parrots" },
                    { id: "doves", name: "Doves" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "species", "age", "color", "gender", "price", "talkingAbility"]
            }
        }
    },
    fish: {
        name: "Fish",
        subcategories: {
            freshwaterFish: {
                name: "Freshwater Fish",
                types: [
                    { id: "guppies", name: "Guppies" },
                    { id: "tetras", name: "Tetras" },
                    { id: "mollies", name: "Mollies" },
                    { id: "other", name: "Other Freshwater Fish" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "quantity", "size", "price"]
            },
            coldwaterFish: {
                name: "Coldwater Fish",
                types: [
                    { id: "goldfish", name: "Goldfish" },
                    { id: "koiCarp", name: "Koi Carp" },
                    { id: "other", name: "Other Coldwater Fish" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "quantity", "size", "price"]
            },
            tropicalFish: {
                name: "Tropical Fish",
                types: [
                    { id: "angelfish", name: "Angelfish" },
                    { id: "gouramis", name: "Gouramis" },
                    { id: "cichlids", name: "Cichlids" },
                    { id: "other", name: "Other Tropical Fish" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "quantity", "size", "price", "waterParameters"]
            }
        }
    },
    reptiles: {
        name: "Reptiles",
        subcategories: {
            lizards: {
                name: "Lizards",
                types: [
                    { id: "beardedDragons", name: "Bearded Dragons" },
                    { id: "geckos", name: "Geckos" },
                    { id: "chameleons", name: "Chameleons" },
                    { id: "other", name: "Other Lizards" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "morph", "age", "gender", "price", "vivarium"]
            },
            snakes: {
                name: "Snakes",
                types: [
                    { id: "cornSnakes", name: "Corn Snakes" },
                    { id: "ballPythons", name: "Ball Pythons" },
                    { id: "other", name: "Other Snakes" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "morph", "age", "gender", "length", "price", "vivarium"]
            },
            tortoises: {
                name: "Tortoises",
                types: [
                    { id: "hermannsTortoise", name: "Hermann's Tortoise" },
                    { id: "russianTortoise", name: "Russian Tortoise" },
                    { id: "other", name: "Other Tortoises" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "age", "gender", "size", "price", "habitat"]
            }
        }
    },
    amphibians: {
        name: "Amphibians",
        subcategories: {
            frogs: {
                name: "Frogs",
                types: [
                    { id: "treeFrogs", name: "Tree Frogs" },
                    { id: "pacmanFrogs", name: "Pacman Frogs" },
                    { id: "other", name: "Other Frogs" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "age", "size", "price", "terrarium"]
            },
            otherAmphibians: {
                name: "Other Amphibians",
                types: [
                    { id: "axolotls", name: "Axolotls" },
                    { id: "newts", name: "Newts" },
                    { id: "salamanders", name: "Salamanders" },
                    { id: "other", name: "Other Amphibians" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "age", "size", "price", "habitat"]
            }
        }
    },
    poultryLivestock: {
        name: "Poultry & Livestock",
        subcategories: {
            poultry: {
                name: "Poultry",
                types: [
                    { id: "chickens", name: "Chickens" },
                    { id: "ducks", name: "Ducks" },
                    { id: "geese", name: "Geese" },
                    { id: "quail", name: "Quail" },
                    { id: "other", name: "Other Poultry" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "breed", "age", "quantity", "price", "purpose"]
            },
            smallLivestock: {
                name: "Small Livestock",
                types: [
                    { id: "goats", name: "Goats" },
                    { id: "sheep", name: "Sheep" },
                    { id: "miniatureHorses", name: "Miniature Horses" },
                    { id: "pigs", name: "Pigs" },
                    { id: "other", name: "Other Small Livestock" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "breed", "age", "gender", "price", "purpose"]
            }
        }
    },
    exoticsInvertebrates: {
        name: "Exotics & Invertebrates",
        subcategories: {
            insects: {
                name: "Insects",
                types: [
                    { id: "stickInsects", name: "Stick Insects" },
                    { id: "prayingMantises", name: "Praying Mantises" },
                    { id: "other", name: "Other Insects" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "species", "age", "quantity", "price", "enclosure"]
            },
            spiders: {
                name: "Spiders",
                types: [
                    { id: "tarantulas", name: "Tarantulas" },
                    { id: "other", name: "Other Spiders" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "species", "age", "gender", "price", "enclosure"]
            },
            otherExotics: {
                name: "Other Exotics",
                types: [
                    { id: "scorpions", name: "Scorpions" },
                    { id: "hermitCrabs", name: "Hermit Crabs" },
                    { id: "giantAfricanLandSnails", name: "Giant African Land Snails" },
                    { id: "other", name: "Other Exotic Pets" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "species", "age", "size", "price", "enclosure"]
            }
        }
    },
    accessories: {
        name: "Pet Accessories",
        subcategories: {
            housingEnclosures: {
                name: "Housing & Enclosures",
                types: [
                    { id: "cages", name: "Cages" },
                    { id: "tanks", name: "Tanks & Aquariums" },
                    { id: "terrariums", name: "Terrariums" },
                    { id: "kennels", name: "Kennels" },
                    { id: "hutches", name: "Hutches" },
                    { id: "other", name: "Other Housing" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "suitableFor", "size", "price", "condition"]
            },
            food: {
                name: "Food & Nutrition",
                types: [
                    { id: "petFood", name: "Pet Food" },
                    { id: "supplements", name: "Supplements" },
                    { id: "treats", name: "Treats" },
                    { id: "other", name: "Other Nutrition" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "suitableFor", "brand", "price", "quantity"]
            },
            otherAccessories: {
                name: "Other Accessories",
                types: [
                    { id: "toys", name: "Toys" },
                    { id: "clothing", name: "Clothing" },
                    { id: "collars", name: "Collars & Leads" },
                    { id: "bedding", name: "Bedding" },
                    { id: "grooming", name: "Grooming Supplies" },
                    { id: "healthCare", name: "Health Care" },
                    { id: "training", name: "Training Equipment" },
                    { id: "travel", name: "Travel Accessories" },
                    { id: "other", name: "Other Accessories" }
                ],
                listingTypes: ["sale", "wanted"],
                fields: ["type", "suitableFor", "brand", "price", "condition"]
            }
        }
    }
};

// Field configuration
const fieldConfigurations = {
    // Common fields
    breed: {
        label: "Breed",
        placeholder: "Enter breed or species",
        type: "text", // Could be extended to use select for dogs/cats with common breeds
        required: true
    },
    age: {
        label: "Age",
        placeholder: "e.g. 2 years or 6 months",
        type: "text",
        required: true
    },
    gender: {
        label: "Gender",
        placeholder: "Select gender",
        type: "select",
        options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "unknown", label: "Unknown" }
        ],
        required: false
    },
    color: {
        label: "Color/Markings",
        placeholder: "Describe color and markings",
        type: "text",
        required: false
    },
    price: {
        label: "Price (£)",
        placeholder: "Enter price",
        type: "number",
        required: true
    },
    health: {
        label: "Health Information",
        type: "checkboxGroup",
        options: [
            { value: "vaccinated", label: "Vaccinated" },
            { value: "fleaTreated", label: "Flea Treated" },
            { value: "wormed", label: "Wormed" },
            { value: "microchipped", label: "Microchipped" },
            { value: "healthChecked", label: "Vet Health Checked" }
        ],
        required: false
    },
    // Specialized fields
    type: {
        label: "Type",
        placeholder: "Select specific type",
        type: "dynamicSelect", // This would be populated based on the subcategory
        required: true
    },
    species: {
        label: "Species/Variety",
        placeholder: "Enter species or variety",
        type: "text",
        required: false
    },
    morph: {
        label: "Morph/Pattern",
        placeholder: "Enter morph or pattern",
        type: "text",
        required: false
    },
    quantity: {
        label: "Quantity",
        placeholder: "Number of animals",
        type: "number",
        required: true
    },
    size: {
        label: "Size",
        placeholder: "Enter size details",
        type: "text",
        required: false
    },
    length: {
        label: "Length",
        placeholder: "Enter length (e.g. 3 feet)",
        type: "text",
        required: false
    },
    vivarium: {
        label: "Vivarium Included?",
        type: "checkbox",
        required: false
    },
    terrarium: {
        label: "Terrarium Included?",
        type: "checkbox",
        required: false
    },
    enclosure: {
        label: "Enclosure Included?",
        type: "checkbox",
        required: false
    },
    habitat: {
        label: "Habitat/Setup Included?",
        type: "checkbox",
        required: false
    },
    talkingAbility: {
        label: "Talking Ability",
        placeholder: "Describe talking ability if any",
        type: "text",
        required: false
    },
    waterParameters: {
        label: "Water Parameters",
        placeholder: "Describe water parameters (pH, temperature, etc.)",
        type: "text",
        required: false
    },
    purpose: {
        label: "Purpose",
        placeholder: "Select primary purpose",
        type: "select",
        options: [
            { value: "pet", label: "Pet/Companion" },
            { value: "breeding", label: "Breeding" },
            { value: "show", label: "Show/Exhibition" },
            { value: "eggs", label: "Egg Production" },
            { value: "meat", label: "Meat Production" },
            { value: "wool", label: "Wool/Fiber" },
            { value: "milk", label: "Milk Production" },
            { value: "therapy", label: "Therapy/Support" },
            { value: "workingAnimal", label: "Working Animal" }
        ],
        required: false
    },
    suitableFor: {
        label: "Suitable For",
        placeholder: "Select suitable pets",
        type: "select",
        options: [
            { value: "dogs", label: "Dogs" },
            { value: "cats", label: "Cats" },
            { value: "smallMammals", label: "Small Mammals" },
            { value: "birds", label: "Birds" },
            { value: "fish", label: "Fish" },
            { value: "reptiles", label: "Reptiles" },
            { value: "amphibians", label: "Amphibians" },
            { value: "exotics", label: "Exotics" },
            { value: "multipleTypes", label: "Multiple Pet Types" }
        ],
        required: true
    },
    condition: {
        label: "Condition",
        placeholder: "Select condition",
        type: "select",
        options: [
            { value: "new", label: "New" },
            { value: "likeNew", label: "Like New" },
            { value: "good", label: "Good" },
            { value: "fair", label: "Fair" },
            { value: "used", label: "Used" }
        ],
        required: true
    },
    brand: {
        label: "Brand",
        placeholder: "Enter brand name",
        type: "text",
        required: false
    }
};

// For wanted fields
const wantedFieldModifiers = {
    price: {
        label: "Maximum Price (£)",
        placeholder: "Enter maximum price you're willing to pay"
    },
    age: {
        label: "Preferred Age",
        required: false
    },
    color: {
        label: "Preferred Color/Markings",
        required: false
    },
    gender: {
        label: "Preferred Gender",
        required: false
    }
};

export { petCategories, fieldConfigurations, wantedFieldModifiers };