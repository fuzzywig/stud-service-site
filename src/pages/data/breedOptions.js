// src/data/breedOptions.js - Comprehensive breed data for all pet types
export const petBreedOptions = {
  dogs: [
    "Affenspincher", "Afghan Hound", "Airedale Terrier", "Akita", "Alapaha Blue Blood Bulldog",
    "Alaskan Malamute", "American Akita", "American Bulldog", "American Bully", "American Cocker Spaniel",
    "Anatolian Shepherd", "Anatolian Shepherd Dog", "Australian Cattle Dog", "Australian Kelpie", "Australian Shepherd",
    "Australian Silky Terrier", "Australian Terrier", "Basenji", "Basset Bleu De Gascogne", "Basset Fauve de Bretagne",
    "Basset Griffon Vendeen", "Basset Hound", "Bavarian Mountain Hound", "Beagle", "Bearded Collie", "Beauceron",
    "Bedlington Terrier", "Belgian Shepherd Dog", "Belgian Shepherd Dog (Groenendael)", "Belgian Shepherd Dog (Laekenois)",
    "Belgian Shepherd Dog (Malinois)", "Belgian Shepherd Dog (Tervueren)", "Bergamasco", "Bergamasco Sheepdog",
    "Bernese Mountain Dog", "Bichon Frise", "Biewer Terrier", "Black and Tan Coonhound", "Bloodhound", "Boerboel",
    "Bolognese", "Border Collie", "Border Terrier", "Bordoodle", "Borzoi", "Boston Terrier", "Bouvier Des Flandres",
    "Bouvier des Flandres", "Boxer", "Bracco Italiano", "Braque d Auvergne", "Briard", "Brittany", "Brittany Spaniel",
    "Bull Terrier", "Bull Terrier (Miniature)", "Bulldog", "Bullmastiff", "Cairn Terrier", "Canaan Dog",
    "Canadian Eskimo Dog", "Cane Corso", "Catalan Sheepdog", "Caucasian Shepherd Dog", "Cavachon", "Cavalier King Charles Spaniel",
    "Cavapoo", "Cavapoochon", "Central Asian Shepherd", "Cesky Terrier", "Chesapeake Bay Retriever", "Chihuahua",
    "Chihuahua (Long Coat)", "Chihuahua (Smooth Coat)", "Chinese Crested", "Chinese Shar Pei", "Chorkie", "Chow Chow",
    "Chug", "Clumber Spaniel", "Cockapoo", "Cocker Spaniel", "Collie (Rough)", "Collie (Smooth)", "Coonhound",
    "Coton De Tulear", "Curly Coated Retriever", "Dachshund", "Dachshund (Long Haired)", "Dachshund (Miniature Long Haired)",
    "Dachshund (Miniature Smooth Haired)", "Dachshund (Miniature Wire Haired)", "Dachshund (Smooth Haired)", "Dachshund (Wire Haired)",
    "Dalmatian", "Dandie Dinmont Terrier", "Deerhound", "Dobermann", "Dogue De Bordeaux", "Dogue de Bordeaux",
    "Dorset Olde Tyme Bulldogge", "Doxiepoo", "English Bull Terrier", "English Bulldog", "English Setter",
    "English Springer Spaniel", "English Toy Terrier", "English Toy Terrier (Black & Tan)", "Entlebucher Mountain Dog",
    "Estrela Mountain Dog", "Eurasier", "Field Spaniel", "Finnish Lapphund", "Finnish Spitz", "Flat Coated Retriever",
    "Flat coated Retriever", "Fox Terrier", "Fox Terrier (Smooth)", "Fox Terrier (Wire)", "Foxhound", "French Bulldog",
    "Frug", "German Longhaired Pointer", "German Pinscher", "German Shepherd", "German Shepherd Dog",
    "German Shorthaired Pointer", "German Spitz", "German Spitz (Klein)", "German Spitz (Mittel)", "German Wirehaired Pointer",
    "Giant Schnauzer", "Glen of Imaal Terrier", "Goldador", "Golden Retriever", "Goldendoodle", "Gordon Setter",
    "Grand Bleu De Gascogne", "Great Dane", "Greater Swiss Mountain Dog", "Greenland Dog", "Greyhound", "Griffon Bruxellois",
    "Hamiltonstovare", "Harrier", "Havanese", "Hovawart", "Hungarian Puli", "Hungarian Pumi", "Hungarian Vizsla",
    "Hungarian Wirehaired Vizsla", "Huntaway", "Ibizan Hound", "Icelandic Sheepdog", "Irish Doodle",
    "Irish Red and White Setter", "Irish Setter", "Irish Terrier", "Irish Water Spaniel", "Irish Wolfhound",
    "Italian Greyhound", "Italian Spinone", "Jack Russell", "Jack Russell Terrier", "Jackapoo", "Jagdterrier",
    "Japanese Akita Inu", "Japanese Chin", "Japanese Shiba Inu", "Japanese Spitz", "Jug", "Keeshond",
    "Kerry Blue Terrier", "King Charles Spaniel", "Komondor", "Kooikerhondje", "Korthals Griffon", "Kromfohrlander",
    "Kuvasz", "Labradoodle", "Labrador Retriever", "Lagotto Romagnolo", "Lakeland Terrier", "Lancashire Heeler",
    "Large Munsterlander", "Leonberger", "Lhasa Apso", "Lowchen", "Lowchen (Little Lion Dog)", "Lurcher", "Malshi",
    "Maltese", "Maltipoo", "Manchester Terrier", "Maremma Sheepdog", "Mastiff", "Mexican Hairless", "Miniature Dachshund",
    "Miniature Pinscher", "Miniature Poodle", "Miniature Schnauzer", "Morkie", "Neapolitan Mastiff", "Newfoundland",
    "Norfolk Terrier", "Northern Inuit", "Norwegian Buhund", "Norwegian Elkhound", "Norwich Terrier",
    "Nova Scotia Duck Tolling Retriever", "Old English Sheepdog", "Old Tyme Bulldog", "Olde English Bulldogge",
    "Otterhound", "Papillon", "Parson Russell Terrier", "Patterdale Terrier", "Pekingese", "Pharaoh Hound",
    "Picardy Spaniel", "Plummer Terrier", "Pointer", "Polish Lowland Sheepdog", "Pomapoo", "Pomchi", "Pomeranian",
    "Pomsky", "Poochon", "Poodle", "Portuguese Podengo",
    "Portuguese Podengo (Warren Hound)", "Portuguese Pointer", "Portuguese Sheepdog", "Portuguese Water Dog",
    "Presa Canario", "Pug", "Puggle", "Pyrenean Mastiff", "Pyrenean Mountain Dog", "Pyrenean Sheepdog",
    "Pyrenean Sheepdog (Long Haired)", "Rhodesian Ridgeback", "Rottweiler", "Rough Collie", "Russian Black Terrier",
    "Russian Toy", "Russian Toy Terrier", "Saarloos Wolfdog", "Saint Bernard", "Saluki", "Samoyed", "Schipperke",
    "Schnauzer", "Schnoodle", "Scottish Terrier", "Sealyham Terrier", "Shar Pei", "Sheepadoodle", "Shetland Sheepdog",
    "Shichon", "Shih Tzu", "Shihpoo", "Shorkie", "Siberian Husky", "Skye Terrier", "Sloughi", "Small Munsterlander",
    "Smooth Collie", "Soft Coated Wheaten Terrier", "Spaniel (American Cocker)", "Spaniel (Clumber)",
    "Spaniel (Field)", "Spaniel (Irish Water)", "Spaniel (Sussex)", "Spaniel (Welsh Springer)",
    "Spanish Mastiff", "Spanish Water Dog", "Sporting Lucas Terrier", "Springador", "Sprocker Spaniel", "Sprollie",
    "Sproodle", "St Bernard", "Staffordshire Bull Terrier", "Standard Poodle", "Sussex Spaniel", "Swedish Lapphund",
    "Swedish Vallhund", "Thai Ridgeback", "Tibetan Mastiff", "Tibetan Spaniel", "Tibetan Terrier",
    "Toy Manchester Terrier", "Toy Poodle", "Turkish Kangal", "Utonagan", "Vizsla (Hungarian)", "Weimaraner",
    "Welsh Collie", "Welsh Corgi (Cardigan)", "Welsh Corgi (Pembroke)", "Welsh Corgi Cardigan",
    "Welsh Corgi Pembroke", "Welsh Springer Spaniel", "Welsh Terrier", "West Highland Terrier",
    "West Highland White Terrier", "Whippet", "White Swiss Shepherd", "White Swiss Shepherd Dog",
    "Wirehaired Slovakian Pointer", "Xoloitzcuintle", "Yorkshire Terrier"
  ],

  cats: [
    "Abyssinian", "Aegean", "American Bobtail", "American Curl", "American Shorthair",
    "American Wirehair", "Aphrodite Giant", "Arabian Mau", "Arctic Curl", "Asian",
    "Asian Semi-longhair", "Australian Mist", "Balinese", "Bambino", "Bengal", "Birman",
    "Bombay", "Brazilian Shorthair", "British Longhair", "British Shorthair", "Burmese",
    "Burmilla", "California Spangled", "Chantilly-Tiffany", "Chartreux", "Chausie",
    "Chinese Li Hua", "Colorpoint Shorthair", "Cornish Rex", "Cymric", "Cyprus Cat",
    "Devon Rex", "Domestic Longhair", "Domestic Medium Hair", "Domestic Shorthair",
    "Donskoy", "Dwelf", "Egyptian Mau", "European", "Exotic", "German Rex", "Havana Brown",
    "Highlander", "Himalayan", "Japanese Bobtail", "Javanese", "Khao Manee", "Kinkalow",
    "Korat", "Korn Ja", "Kurilian Bobtail", "LaPerm", "Lykoi", "Maine Coon", "Manx",
    "Mekong Bobtail", "Minskin", "Mixed Breed", "Munchkin", "Napoleon", "Nebelung",
    "Neva Masquerade", "Norwegian Forest Cat", "Ocicat", "Ojos Azules", "Oregon Rex",
    "Oriental", "Oriental Longhair", "Persian", "Peterbald", "Pixie Bob", "RagaMuffin",
    "Ragamese", "Ragcoon", "Ragdoll", "Russian Blue", "Savannah", "Scottish Fold",
    "Selkirk Rex", "Serengeti", "Siamese", "Siberian", "Singapura", "Snowshoe", "Sokoke",
    "Somali", "Sphynx", "Suphalak", "Thai", "Tibetan", "Tiffanie", "Tonkinese", "Toybob",
    "Toyger", "Turkish Angora", "Turkish Van", "Ural Rex", "York Chocolate"
  ],

  birds: [
    "Budgerigars", "Canaries", "Cockatiels", "Cockatoo", "Conures", "Doves", "Finches",
    "Lories", "Lorikeets", "Lovebirds", "Macaws", "Mixed Breed", "Parakeets", "Parrots",
    "Pigeons", "Ringnecks", "Softbills"
  ],

  fish: [
    "Angelfish", "Barbs", "Bettas", "Brackish Fish", "Butterfly Fish", "Catfish", "Cichlids",
    "Corys", "Crabs", "Cyprinids", "Danios", "Discus", "Fancy Goldfish", "Golden Orfes",
    "Goldfish", "Gouramis", "Hatchet Fish", "Killifish", "Koi Carp", "Live Bearers", "Loaches",
    "Lobsters", "Minnows", "Mollies", "Other/Mixed Breed", "Pencil Fish", "Piranhas", "Platies",
    "Plecos", "Pond Fish", "Pufferfish", "Rainbow Fish", "Rasboras", "Ricefish", "Sharks",
    "Shrimps", "Shubunkins", "Snails", "Swordtails", "Tench", "Tetras"
  ],

  horses: [
    "American Curly Horse", "American Quarter", "American Standardbred", "American Warmblood",
    "Andalusian", "Anglo Arab", "Appaloosa", "Arabian horse", "Ardennes", "Austrian Warmblood",
    "Bavarian Warmblood", "Belgian Warmblood", "British Warmblood", "Caspian horse",
    "Cleveland Bay", "Clydesdale", "Cold-blood trotter", "Connemara", "Czech Warmblood",
    "Dales", "Danish Warmblood", "Dartmoor", "English Thoroughbred", "Exmoor", "Fell",
    "Fjord horse", "French Trotter", "Friesian", "Gelderland", "Gotland pony", "Hackney",
    "Haflinger", "Hanoverian", "Highland", "Hispano Arabian", "Holstein", "Hungarian warmblood",
    "Icelandic horse", "Irish Cob", "Irish Draught", "Irish Sports", "Irish Thoroughbred",
    "KWPN", "Lusitano", "Miniature horse", "Morgan", "Mustang", "New Forest", "Noriker",
    "North Swedish Horse", "Oldenburg", "Other Breed", "PRE", "Palomino", "Paso Fino",
    "Percheron", "Pintos", "Polish Halfbred", "Polish Warmblood", "Rhinelander", "Riding pony",
    "Russian Basjkir", "Selle Francais", "Shetland pony", "Shire", "Spanish Sporthorse",
    "Suffolk Punch", "Swedish Warmblood", "Tennessee Walking Horse", "Tinker", "Trakehner",
    "Trotter", "Welsh Section A", "Welsh Section B", "Welsh Section C", "Welsh Section D",
    "Westphalian", "Zweibrücker", "Cruzado", "Dutch Warmblood", "Estonian Native",
    "French Saddle Pony", "Italian Heavy Draft", "Karabakh", "Kiger Mustang", "Mérens",
    "Paso Peruano", "Spotted Saddle Horse"
  ],

  invertebrates: [
    "Beetles", "Centipedes", "Cockroaches", "Crabs", "Millipedes", "Mixed Breed",
    "Praying Mantis", "Scorpions", "Slugs", "Snails", "Spiders", "Stick Insects",
    "Tarantulas", "Worms"
  ],

  livestock: [
    "Alpaca", "Camel", "Cows & Bulls", "Donkey", "Goats", "Llama", "Mixed Breed",
    "Pig", "Sheep"
  ],

  poultry: [
    "Chickens", "Ducks", "Emus", "Geese", "Guinea Fowl", "Hens", "Mix Breeds",
    "Partridge", "Peafowl", "Pheasants", "Quail"
  ],

  rabbits: [
    "Alaska", "Angora", "Argente", "Belgian Hares", "Beveren", "Blanc De Bouscat",
    "Blanc De Hotot", "Blanc de Termonde", "Britannia Petite", "British Giant",
    "Cashmere Lop", "Chinchilla", "Continental Giant", "Deilenaar", "Dutch", "Dwarf Hotot",
    "Dwarf Lop", "English Lop", "English Spot", "Flemish", "French Lop", "German Lop",
    "Giant Papillon", "Golden Glavcot", "Harlequin", "Havana", "Himalayan", "Hulstlander",
    "Lilac", "Lionhead", "Mini Lion Lop", "Mini Lop", "Mixed Breed", "Netherland Dwarf",
    "New Zealand", "Palomino", "Polish", "Red Eyed White", "Rex", "Rhinelander", "Sable",
    "Sallander", "Schwarzgrannen", "Siberian", "Silver", "Silver Fox", "Smoke Pearl",
    "Squirrel", "Sussex", "Swiss Fox", "Tan", "Thrianta", "Thuringer", "Vienna",
    "White Lionhead", "White Vienna", "Zemplin"
  ],

  reptiles: [
    "Anole", "Axolotl", "Bearded Dragon", "Boa Snake", "Chameleon", "Corn Snake",
    "Dragon", "Frog", "Garter Snake", "Gecko", "Hermann Tortoise", "Iguana", "King Snake",
    "Leopard Gecko", "Lizard", "Milk Snake", "Mixed Breed", "Monitor", "Newt",
    "Python Snake", "Rat Snake", "Skink", "Snake", "Terrapin", "Toad", "Tortoise", "Turtle"
  ],

  rodents: [
    "Chinchilla", "Degus", "Ferret", "Gerbil", "Guinea Pig", "Hamster", "Mixed Breed",
    "Mouse", "Pygmy Hedgehog", "Rat", "Sugar Glider"
  ]
};

// Updated pet categories with subcategories
export const updatedPetCategories = {

      dogs: {
        name: "Dogs",
        fields: ["title", "description", "price"],
        listingTypes: ["sale", "stud", "wanted", "gender"],
        fieldsForSale: ["dob", "availableDate","quantity","gender","withMother","vaccinated", "microchipped", "wormed", "fleaTreated", "neutered", "kcRegistered", "healthChecked"],
        fieldsForStud: [ "name","dogColor","dob","height", "weight","matings", "instagramUrl", "facebookUrl", "tiktokUrl", "kcRegistered", "proven", "mobileService"]
      },
      cats: {
        name: "Cats",
        fields: ["title", "description","breed", "catColor", "price", "dob"],
        listingTypes: ["sale", "stud", "wanted"],
        fieldsForSale: ["quantity","gender","availableDate","registrationBody","vaccinated", "microchipped", "wormed", "fleaTreated", "healthTested","withMother"],
        fieldsForStud: ["name", "matings", "registrationBody", "proven","wormed", "fleaTreated","healthTested","vaccinated", "mobileService"]
      },
      rabbits: {
        name: "Rabbits",
        fields: ["title", "description", "dob", "availableDate","gender", "quantity","price"],
        listingTypes: ["sale", "wanted"],
        fieldsForSale: ["vaccinated", "wormed","microchipped", "fleaTreated"]
      },
      rodents: {
        name: "Rodents",
        fields: ["title", "description", "dob","availableDate", "gender", "quantity", "price"],
        listingTypes: ["sale", "wanted"],
        fieldsForSale: [],
        types: [
          { id: "chinchilla", name: "Chinchilla" },
          { id: "degus", name: "Degus" },
          { id: "ferret", name: "Ferret" },
          { id: "gerbil", name: "Gerbil" },
          { id: "guineaPig", name: "Guinea Pig" },
          { id: "hamster", name: "Hamster" },
          { id: "mouse", name: "Mouse" },
          { id: "pygmyHedgehog", name: "Pygmy Hedgehog" },
          { id: "rat", name: "Rat" },
          { id: "sugarGlider", name: "Sugar Glider" },
          { id: "mixedBreed", name: "Mixed Breed" }
        ]
      },
      horses: {
        name: "Horses & Ponies",
        fields: ["title", "description","dob", "height", "gender", "price"],
        listingTypes: ["sale", "wanted"],
        fieldsForSale: ["vaccinated"]
      },
      livestock: {
        name: "Livestock",
        fields: ["title", "description","breed", "age", "gender", "color", "price", "purpose"],
        listingTypes: ["sale", "wanted"],
        types: [
          { id: "alpaca", name: "Alpaca" },
          { id: "camel", name: "Camel" },
          { id: "cowsBulls", name: "Cows & Bulls" },
          { id: "donkey", name: "Donkey" },
          { id: "goats", name: "Goats" },
          { id: "llama", name: "Llama" },
          { id: "pig", name: "Pig" },
          { id: "sheep", name: "Sheep" },
          { id: "mixedBreed", name: "Mixed Breed" }
        ]
      },
      otherMammals: {
        name: "Other Mammals",
        fields: ["title", "description","petType", "age", "gender", "color", "price", "quantity"],
        listingTypes: ["sale", "wanted"],
        allowCustomType: true
      },

  // Birds category
  birds: {
    name: "Birds",
    // merged fields from small, large & other birds:
    fields: [
      "title",
      "description",
      "dob",
      "gender",
      "quantity",
      "price",
      "endangered"
    ],
    // flat list of the 17 non-poultry bird types:
    types: [
      { id: "budgerigars", name: "Budgerigars" },
      { id: "canaries",    name: "Canaries"    },
      { id: "cockatiels",  name: "Cockatiels"  },
      { id: "finches",     name: "Finches"     },
      { id: "lovebirds",   name: "Lovebirds"   },
      { id: "parakeets",   name: "Parakeets"   },
      { id: "cockatoo",    name: "Cockatoo"    },
      { id: "conures",     name: "Conures"     },
      { id: "lories",      name: "Lories"      },
      { id: "lorikeets",   name: "Lorikeets"   },
      { id: "macaws",      name: "Macaws"      },
      { id: "parrots",     name: "Parrots"     },
      { id: "ringnecks",   name: "Ringnecks"   },
      { id: "doves",       name: "Doves"       },
      { id: "pigeons",     name: "Pigeons"     },
      { id: "softbills",   name: "Softbills"   },
      { id: "mixedBreed",  name: "Mixed Breed" }
    ]
  },


  // Reptiles category
  // in updatedPetCategories:
  reptiles: {
    name: "Reptiles",
    // merged fields from lizards, snakes, turtles & amphibians:
    fields: [
      "title",
      "description",
      "dob",
        "availableDate",
      "gender",



      "quantity",
      "enclosureIncluded",
      "endangered",
      "price"
    ],

    types: [
      // Lizards
      { id: "anole",            name: "Anole"            },
      { id: "beardedDragon",    name: "Bearded Dragon"   },
      { id: "chameleon",        name: "Chameleon"        },
      { id: "dragon",           name: "Dragon"           },
      { id: "gecko",            name: "Gecko"            },
      { id: "iguana",           name: "Iguana"           },
      { id: "leopardGecko",     name: "Leopard Gecko"    },
      { id: "lizard",           name: "Lizard"           },
      { id: "monitor",          name: "Monitor"          },
      { id: "skink",            name: "Skink"            },

      // Snakes
      { id: "boaSnake",         name: "Boa Snake"        },
      { id: "cornSnake",        name: "Corn Snake"       },
      { id: "garterSnake",      name: "Garter Snake"     },
      { id: "kingSnake",        name: "King Snake"       },
      { id: "milkSnake",        name: "Milk Snake"       },
      { id: "pythonSnake",      name: "Python Snake"     },
      { id: "ratSnake",         name: "Rat Snake"        },
      { id: "snake",            name: "Other Snake"      },

      // Turtles & Tortoises
      { id: "hermannTortoise",  name: "Hermann Tortoise" },
      { id: "terrapin",         name: "Terrapin"         },
      { id: "tortoise",         name: "Tortoise"         },
      { id: "turtle",           name: "Turtle"           },

      // Amphibians
      { id: "axolotl",          name: "Axolotl"          },
      { id: "frog",             name: "Frog"             },
      { id: "newt",             name: "Newt"             },
      { id: "toad",             name: "Toad"             }
    ]
  },


  // Fish category
  // in updatedPetCategories:
  fish: {
    name: "Fish",
    // merged fields from tropicalFish, pondFish, aquatic invertebrates, brackishFish & otherFish:
    fields: [
      "title",
      "description",
      "quantity",

      "waterParameters",
      "price"
    ],
    types: [
      // Tropical Fish
      { id: "angelfish",    name: "Angelfish"    },
      { id: "barbs",        name: "Barbs"        },
      { id: "bettas",       name: "Bettas"       },
      { id: "butterflyFish",name: "Butterfly Fish"},
      { id: "catfish",      name: "Catfish"      },
      { id: "cichlids",     name: "Cichlids"     },
      { id: "corys",        name: "Corys"        },
      { id: "cyprinids",    name: "Cyprinids"    },
      { id: "danios",       name: "Danios"       },
      { id: "discus",       name: "Discus"       },
      { id: "gouramis",     name: "Gouramis"     },
      { id: "hatchetFish",  name: "Hatchet Fish" },
      { id: "killifish",    name: "Killifish"    },
      { id: "liveBearers",  name: "Live Bearers" },
      { id: "loaches",      name: "Loaches"      },
      { id: "minnows",      name: "Minnows"      },
      { id: "mollies",      name: "Mollies"      },
      { id: "pencilFish",   name: "Pencil Fish"  },
      { id: "platies",      name: "Platies"      },
      { id: "plecos",       name: "Plecos"       },
      { id: "rainbowFish",  name: "Rainbow Fish" },
      { id: "rasboras",     name: "Rasboras"     },
      { id: "ricefish",     name: "Ricefish"     },
      { id: "sharks",       name: "Sharks"       },
      { id: "swordtails",   name: "Swordtails"   },
      { id: "tetras",       name: "Tetras"       },

      // Pond Fish
      { id: "fancyGoldfish",name: "Fancy Goldfish"},
      { id: "goldenOrfes",  name: "Golden Orfes" },
      { id: "goldfish",     name: "Goldfish"     },
      { id: "koiCarp",      name: "Koi Carp"     },
      { id: "pondFish",     name: "Pond Fish"    },
      { id: "shubunkins",   name: "Shubunkins"   },
      { id: "tench",        name: "Tench"        },

      // Aquatic Invertebrates
      { id: "crabs",        name: "Crabs"        },
      { id: "lobsters",     name: "Lobsters"     },
      { id: "shrimps",      name: "Shrimps"      },
      { id: "snails",       name: "Snails"       },

      // Brackish Fish
      { id: "brackishFish", name: "Brackish Fish"},
      { id: "pufferfish",   name: "Pufferfish"   },

      // Other Fish
      { id: "piranhas",     name: "Piranhas"     },
      { id: "mixedBreed",   name: "Mixed Breed"  }
    ]
  },


  // Invertebrates' category
  // in updatedPetCategories:
  invertebrates: {
    name: "Invertebrates",
    // merged fields from arachnids, insects & otherInvertebrates
    fields: [
      "title",
      "description",
      "dob",
      "gender",
      "quantity",
      "enclosureIncluded",
      "price"

    ],
    // flat list of all invertebrate types
    types: [
      // Arachnids
      { id: "scorpions",     name: "Scorpions"     },
      { id: "spiders",       name: "Spiders"       },
      { id: "tarantulas",    name: "Tarantulas"    },

      // Insects
      { id: "beetles",       name: "Beetles"       },
      { id: "cockroaches",   name: "Cockroaches"   },
      { id: "prayingMantis", name: "Praying Mantis"},
      { id: "stickInsects",  name: "Stick Insects"},

      // Other Invertebrates
      { id: "centipedes",    name: "Centipedes"    },
      { id: "millipedes",    name: "Millipedes"    },
      { id: "slugs",         name: "Slugs"         },
      { id: "snails",        name: "Snails"        },
      { id: "worms",         name: "Worms"         },
      { id: "mixedBreed",    name: "Mixed Breed"   }
    ]
  },
  poultry: {
    name: "Poultry",
    fields: [
      "title",
      "description",
      "dob",
      "gender",
      "quantity",
      "purpose",
      "price"

    ],
    listingTypes: ["sale", "wanted"],
    types: [
      { id: "chickens",   name: "Chickens"   },
      { id: "ducks",      name: "Ducks"      },
      { id: "geese",      name: "Geese"      },
      { id: "guineaFowl", name: "Guinea Fowl" },
      { id: "hens",       name: "Hens"       },
      { id: "partridge",  name: "Partridge"  },
      { id: "peafowl",    name: "Peafowl"    },
      { id: "pheasants",  name: "Pheasants"  },
      { id: "quail",      name: "Quail"      },
      { id: "emus",       name: "Emus"       }
    ]
  },



  // Accessories category
  accessories: {
    name: "Accessories & Equipment",
    subcategories: {
      dogAccessories: {
        name: "Dog Accessories",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      catAccessories: {
        name: "Cat Accessories",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      fishEquipment: {
        name: "Fish Equipment",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      reptileEquipment: {
        name: "Reptile Equipment",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      birdSupplies: {
        name: "Bird Supplies",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      smallPetSupplies: {
        name: "Small Pet Supplies",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      horseEquipment: {
        name: "Horse Equipment",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      },
      otherAccessories: {
        name: "Other Accessories",
        fields: ["brand", "condition", "price", "suitableFor", "category"],
        listingTypes: ["sale", "wanted"]
      }
    }
  }
};

// Field configurations with expanded options
export const updatedFieldConfigurations = {
  breed: {
    type: "select",
    label: "Breed",
    placeholder: "Select breed",
    required: true,
    getOptions: (mainCategory, subCategory, petType) => {
      let category = "";

      // Determine which breed list to use based on selection
      if (mainCategory === "mammals") {
        if (subCategory === "dogs") category = "dogs";
        else if (subCategory === "cats") category = "cats";
        else if (subCategory === "rabbits") category = "rabbits";
        else if (subCategory === "horses") category = "horses";
        else if (subCategory === "rodents") {
          if (petType === "chinchilla") return [{value: "Chinchilla", label: "Chinchilla"}];
          if (petType === "hamster") return [
            {value: "Syrian", label: "Syrian"},
            {value: "Dwarf", label: "Dwarf"},
            {value: "Roborovski", label: "Roborovski"},
            {value: "Chinese", label: "Chinese"},
            {value: "Winter White", label: "Winter White"}
          ];
          // Other rodent types with minimal breed options
          return [{value: petType, label: petType}, {value: "Mixed Breed", label: "Mixed Breed"}];
        }
      }
      else if (mainCategory === "birds") {
        category = "birds";
      }
      else if (mainCategory === "reptiles") {
        category = "reptiles";
      }
      else if (mainCategory === "fish") {
        category = "fish";
      }
      else if (mainCategory === "invertebrates") {
        category = "invertebrates";
      }

      // If we have a matching category, return options from the breed list
      if (category && petBreedOptions[category]) {
        return petBreedOptions[category].map(breed => ({
          value: breed,
          label: breed
        }));
      }

      // Default empty options if no match
      return [];
    }
  },

  petType: {
    type: "text",
    label: "Pet Type",
    placeholder: "Enter pet type",
    required: true
  },

  age: {
    type: "select",
    label: "Age",
    placeholder: "Select age",
    required: true,
    options: [
      { value: "1 Years", label: "1 Years" },
      { value: "2 Years", label: "2 Years" },
      { value: "3 Years", label: "3 Years" },
      { value: "4 Years", label: "4 Years" },
      { value: "5 Years", label: "5 Years" },
      { value: "6 Years", label: "6 Years" },
      { value: "7 Years", label: "7 Years" },
      { value: "8 Years", label: "8 Years" },
      { value: "9 Years", label: "9 Years" },
      { value: "10 Years", label: "10 Years" }
    ]
  },


  gender: {
    type: "select",
    label: "Gender",
    placeholder: "Select gender",
    required: false,
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "both", label: "Both" }
    ]
  },

  dogColor: {
    type: "select",
    label: "Color",
    placeholder: "Select color",
    required: false,
    options: [
      { value: "Black",        label: "Black"        },
      { value: "Blue",         label: "Blue"         },
      { value: "Chocolate",    label: "Chocolate"    },
      { value: "Liver",        label: "Liver"        },
      { value: "Cream",        label: "Cream"        },
      { value: "Fawn",         label: "Fawn"         },
      { value: "Gold",         label: "Gold"         },
      { value: "Red",          label: "Red"          },
      { value: "Silver",       label: "Silver"       },
      { value: "White",        label: "White"        },
      { value: "Yellow",       label: "Yellow"       },
      { value: "Brindle",      label: "Brindle"      },
      { value: "Sable",        label: "Sable"        },
      { value: "Tri-colour",   label: "Tri-colour"   },
      { value: "Parti-colour", label: "Parti-colour" },
      { value: "Merle",        label: "Merle"        },
      { value: "Dapple",       label: "Dapple"       },
      { value: "Piebald",      label: "Piebald"      }
    ]
  },

  catColor: {
    type: "select",
    label: "Color",
    placeholder: "Select color",
    required: false,
    options: [
      { value: "Black",    label: "Black"    },
      { value: "Blue",     label: "Blue"     },
      { value: "Chocolate",label: "Chocolate"},
      { value: "Lilac",    label: "Lilac"    },
      { value: "Red",      label: "Red"      },
      { value: "Cream",    label: "Cream"    },
      { value: "Cinnamon", label: "Cinnamon" },
      { value: "Fawn",     label: "Fawn"     },
      { value: "Caramel",  label: "Caramel"  },
      { value: "Apricot",  label: "Apricot"  },
      { value: "Silver",   label: "Silver"   },
      { value: "Smoke",    label: "Smoke"    },
      { value: "White",    label: "White"    }
    ]
  },


  description: {
    type: "textarea",
    label: "Description",
    placeholder: "Enter description",
    required: true
  },
  title:{
    type: "text",
    label: "Advert Title",
    placeholder: "Enter advert title",
    required: true
  },
  availableDate: {
    type: "date",
    label: "Ready to leave",
    placeholder: "Ready to leave",
    required: false
  },
  dob: {
    type: "date",
    label: "Date of birth",
    placeholder: "Date of birth",
    required: false
  },

  // just below kcRegistered...
  kcName: {
    type: "text",
    label: "KC Registration Name",
    placeholder: "Enter kennel club registration name",
    required: false
  },
  withMother: {
    type: "checkbox",
    label: "Viewable with Mother",
    placeholder: "Viewable with Mother",
    required: true
  },
  endangered: {
    type: "checkbox",
    label: "Is Endangered",
    placeholder: "Is Endangered",
    required: true
  },
  citesCertificateNumber: {
    type: "text",
    label: "CITES Article 10 Certificate Number",
    placeholder: "Enter certificate number",
    required: true   // only if endangered
  },


  price: {
    type: "number",
    label: "Price (£)",
    placeholder: "Enter price",
    required: true
  },

  quantity: {
    type: "number",
    label: "How Many Are Available?",
    placeholder: "How Many Are Available?",
    required: true
  },
  instagramUrl: {
    type: "text",            // you could also use type:"url" if you want HTML5 URL validation
    label: "Instagram URL",
    placeholder: "https://instagram.com/yourprofile",
    required: false
  },
  facebookUrl: {
    type: "text",
    label: "Facebook URL",
    placeholder: "https://facebook.com/yourpage",
    required: false
  },
  tiktokUrl : {
    type: "text",
    label: "TikTok URL",
    placeholder: "https://www.tiktok.com/yourpage",
    required: false
  },

  // Dog-specific fields
  vaccinated: {
    type: "checkbox",
    label: "Vaccinated",
    required: true
  },

  microchipped: {
    type: "checkbox",
    label: "Microchipped",
    required: true
  },

  wormed: {
    type: "checkbox",
    label: "Wormed",
    required: true
  },

  fleaTreated: {
    type: "checkbox",
    label: "Flea Treated",
    required: true
  },

  kcRegistered: {
    type: "checkbox",
    label: "KC Registered",
    required: true
  },

  healthChecked: {
    type: "checkbox",
    label: "Health Checked",
    required: false
  },

  healthTested: {
    type: "checkbox",
    label: "Health Tested",
    required: false
  },

  proven: {
    type: "checkbox",
    label: "Proven",
    required: true
  },
  mobileService: {
    type: "checkbox",
    label: "Mobile Service",
    required: true
  },

  // Cat-specific fields
  litterTrained: {
    type: "checkbox",
    label: "Litter Trained",
    required: false
  },

  neutered: {
    type: "checkbox",
    label: "Neutered/Spayed",
    required: false
  },

  indoorOutdoor: {
    type: "select",
    label: "Indoor/Outdoor",
    placeholder: "Select preference",
    required: false,
    options: [
      { value: "indoor", label: "Indoor Only" },
      { value: "outdoor", label: "Outdoor Only" },
      { value: "both", label: "Indoor & Outdoor" }
    ]
  },

  registrationBody: {
    type: "select",
    label: "Registered With",
    placeholder: "Select registration",
    required: false,
    options: [
      { value: "GCCF", label: "GCCF" },
      { value: "TICA", label: "TICA" },
      { value: "FIFe", label: "FIFe" },
      { value: "None", label: "None" }
    ]
  },

  // Reptile-specific fields
  morph: {
    type: "text",
    label: "Morph/Pattern",
    placeholder: "Enter morph or pattern",
    required: false
  },

  length: {
    type: "text",
    label: "Length",
    placeholder: "Enter length",
    required: false
  },

  enclosureIncluded: {
    type: "checkbox",
    label: "Enclosure Included",
    required: false
  },

  // Bird-specific
  talkingAbility: {
    type: "select",
    label: "Talking Ability",
    placeholder: "Select talking ability",
    required: false,
    options: [
      { value: "talks", label: "Talks Well" },
      { value: "learning", label: "Learning to Talk" },
      { value: "potential", label: "Has Potential" },
      { value: "notTalking", label: "Doesn't Talk" }
    ]
  },

  // Fish-specific
  size: {
    type: "select",
    label: "Size",
    placeholder: "Select size",
    required: false,
    options: [
      { value: "fry", label: "Fry" },
      { value: "juvenile", label: "Juvenile" },
      { value: "small", label: "Small (Under 5cm)" },
      { value: "medium", label: "Medium (5-10cm)" },
      { value: "large", label: "Large (10-20cm)" },
      { value: "extraLarge", label: "Extra Large (20cm+)" }
    ]
  },

  waterParameters: {
    type: "text",
    label: "Water Parameters",
    placeholder: "pH, Temperature, etc.",
    required: false
  },

  // Livestock/Poultry-specific
  purpose: {
    type: "select",
    label: "Purpose",
    placeholder: "Select purpose",
    required: false,
    options: [
      { value: "breeding", label: "Breeding" },
      { value: "show", label: "Show" },
      { value: "pet", label: "Pet" },
      { value: "production", label: "Production" },
      { value: "multi-purpose", label: "Multi-purpose" }
    ]
  },

  // Horse-specific
  height: {
    type: "text",
    label: "Height",
    placeholder: "Enter height (hands)",
    required: false
  },

  weight: {
    type: "text",
    label: "Weight",
    placeholder: "Enter weight",
    required: false
  },

  passportDetails: {
    type: "text",
    label: "Passport Details",
    placeholder: "Enter passport details",
    required: false
  },

  temperament: {
    type: "select",
    label: "Temperament",
    placeholder: "Select temperament",
    required: false,
    options: [
      { value: "very-calm", label: "Very Calm" },
      { value: "calm", label: "Calm" },
      { value: "average", label: "Average" },
      { value: "spirited", label: "Spirited" },
      { value: "very-spirited", label: "Very Spirited" }
    ]
  },

  // Accessory-specific
  brand: {
    type: "text",
    label: "Brand",
    placeholder: "Enter brand name",
    required: false
  },

  condition: {
    type: "select",
    label: "Condition",
    placeholder: "Select condition",
    required: true,
    options: [
      { value: "new", label: "New (Unused)" },
      { value: "like-new", label: "Like New" },
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "fair", label: "Fair" },
      { value: "poor", label: "Poor" }
    ]
  },

  suitableFor: {
    type: "text",
    label: "Suitable For",
    placeholder: "e.g., Dog, Cat, Small tank, etc.",
    required: false
  },

  category: {
    type: "select",
    label: "Category",
    placeholder: "Select category",
    required: false,
    options: [
      { value: "housing", label: "Housing/Enclosures" },
      { value: "feeding", label: "Feeding Equipment" },
      { value: "toys", label: "Toys" },
      { value: "grooming", label: "Grooming" },
      { value: "health", label: "Health Supplies" },
      { value: "training", label: "Training Equipment" },
      { value: "travel", label: "Travel Equipment" },
      { value: "clothing", label: "Clothing/Apparel" },
      { value: "bedding", label: "Bedding" },
      { value: "filtration", label: "Filtration" },
      { value: "heating", label: "Heating/Lighting" },
      { value: "other", label: "Other" }
    ]
  },

  // For wanted listings
  maxPrice: {
    type: "number",
    label: "Maximum Price (£)",
    placeholder: "Enter max price willing to pay",
    required: true
  },

  urgency: {
    type: "select",
    label: "Urgency",
    placeholder: "How urgently needed",
    required: false,
    options: [
      { value: "asap", label: "As Soon As Possible" },
      { value: "within-week", label: "Within a Week" },
      { value: "within-month", label: "Within a Month" },
      { value: "no-rush", label: "No Rush" }
    ]
  },

  preferredLocation: {
    type: "text",
    label: "Preferred Location",
    placeholder: "Enter desired location",
    required: false
  },

  // Additional fields for stud dogs/cats
  fee: {
    type: "number",
    label: "Stud Fee (£)",
    placeholder: "Enter stud fee",
    required: true
  },

  name: {
    type: "text",
    label: "Pet's Name",
    placeholder: "Enter pet's name",
    required: true
  },

  matings: {
    type: "number",
    label: "How Many Matings Included",
    placeholder: "How Many Matings Included",
    required: false
  }
};

// Wanted listing field modifiers
export const updatedWantedFieldModifiers = {
  price: {
    label: "Maximum Price (£)",
    placeholder: "Enter maximum price",
    required: true
  }
};