// =====================================================
// Start-Lebensmittel (gebaut vom Datenbank-Agent)
// =====================================================
// Diese Lebensmittel bekommt jede Person beim ersten Öffnen der App.
// Alle Werte gelten pro 100 g: kcal, Protein, Kohlenhydrate (kh), Fett.
//
// Felder:  id     = feste Türnummer (nie ändern!)
//          seit   = mit welcher Datenbank-Version das Lebensmittel dazukam.
//                   Neue Lebensmittel bekommen bestehende Nutzer automatisch
//                   nachgeliefert (siehe speicher.js → migrieren).
//          en, de = Name auf Englisch und Deutsch
//          marke, laden = nur bei Markenprodukten: Hersteller und Geschäft(e)
//          rezept, anleitung = nur bei Start-Rezepten (Zutaten + Kochanleitung in EN/DE)
//          influencer, mahlzeit = Rezept gehört zu einem Creator (siehe influencer.js), passende Mahlzeit
//
// Quellen: USDA FoodData Central (fdc.nal.usda.gov, "SR Legacy") für
// Grundnahrungsmittel; für typische Packungsprodukte (Skyr, Magerquark,
// Whey, Proteinriegel, High-Protein-Pudding, Jerky ...) Durchschnittswerte
// gängiger Produkte im deutschsprachigen Handel. Es sind Richtwerte –
// je nach Marke weichen echte Produkte etwas ab.
//
// Kohlenhydrate sind wie bei USDA inklusive Ballaststoffe angegeben.
// Deshalb passt kcal ≈ 4·Protein + 4·KH + 9·Fett bei Gemüse nicht ganz – normal.
//
// Wohnhaus-Bild: STARTDATEN ist die Liste der Erstmieter, die schon
// eingezogen sind, bevor jemand die App zum ersten Mal öffnet.

const STARTDATEN = [
    // ===== Version 1 =====

    // --- Getreide, Brot & Beilagen ---
    { id: "start-oats",          seit: 1, emoji: "🥣", en: "Oats",                 de: "Haferflocken",              kcal100: 372, protein100: 13.5, kh100: 58.7, fett100: 7.0 },
    { id: "start-rice",          seit: 1, emoji: "🍚", en: "Rice (cooked)",        de: "Reis (gekocht)",            kcal100: 130, protein100: 2.7,  kh100: 28.2, fett100: 0.3 },
    { id: "start-pasta",         seit: 1, emoji: "🍝", en: "Pasta (cooked)",       de: "Nudeln (gekocht)",          kcal100: 158, protein100: 5.8,  kh100: 30.9, fett100: 0.9 },
    { id: "start-quinoa",        seit: 1, emoji: "🌾", en: "Quinoa (cooked)",      de: "Quinoa (gekocht)",          kcal100: 120, protein100: 4.4,  kh100: 21.3, fett100: 1.9 },
    { id: "start-bread",         seit: 1, emoji: "🍞", en: "Whole Grain Bread",    de: "Vollkornbrot",              kcal100: 252, protein100: 12.4, kh100: 42.7, fett100: 3.5 },
    { id: "start-ricecake",      seit: 1, emoji: "🍘", en: "Rice Cake",            de: "Reiswaffel",                kcal100: 387, protein100: 8.2,  kh100: 81.5, fett100: 2.8 },
    { id: "start-potato",        seit: 1, emoji: "🥔", en: "Potatoes (boiled)",    de: "Kartoffeln (gekocht)",      kcal100: 86,  protein100: 1.7,  kh100: 20.0, fett100: 0.1 },
    { id: "start-sweetpotato",   seit: 1, emoji: "🍠", en: "Sweet Potato (baked)", de: "Süßkartoffel (gebacken)",   kcal100: 90,  protein100: 2.0,  kh100: 20.7, fett100: 0.2 },

    // --- Fleisch, Fisch & Eier ---
    { id: "start-chicken",       seit: 1, emoji: "🍗", en: "Chicken Breast",       de: "Hähnchenbrust",             kcal100: 110, protein100: 23.1, kh100: 0,    fett100: 1.2 },
    { id: "start-turkey",        seit: 1, emoji: "🦃", en: "Turkey Breast",        de: "Putenbrust",                kcal100: 114, protein100: 23.7, kh100: 0.1,  fett100: 1.5 },
    { id: "start-beef",          seit: 1, emoji: "🥩", en: "Lean Ground Beef 5%",  de: "Rinderhack mager 5%",       kcal100: 137, protein100: 21.4, kh100: 0,    fett100: 5.0 },
    { id: "start-ham",           seit: 1, emoji: "🥓", en: "Cooked Ham",           de: "Kochschinken",              kcal100: 115, protein100: 20.0, kh100: 1.0,  fett100: 3.5 },
    { id: "start-salmon",        seit: 1, emoji: "🐟", en: "Salmon",               de: "Lachs",                     kcal100: 208, protein100: 20.4, kh100: 0,    fett100: 13.4 },
    { id: "start-tuna",          seit: 1, emoji: "🥫", en: "Tuna (in water)",      de: "Thunfisch (eigener Saft)",  kcal100: 116, protein100: 25.5, kh100: 0,    fett100: 0.8 },
    { id: "start-shrimp",        seit: 1, emoji: "🦐", en: "Shrimp",               de: "Garnelen",                  kcal100: 85,  protein100: 20.1, kh100: 0,    fett100: 0.5 },
    { id: "start-egg",           seit: 1, emoji: "🥚", en: "Egg (boiled)",         de: "Ei (gekocht)",              kcal100: 155, protein100: 12.6, kh100: 1.1,  fett100: 10.6 },

    // --- Milchprodukte & Protein ---
    { id: "start-skyr",          seit: 1, emoji: "🥛", en: "Skyr",                 de: "Skyr",                      kcal100: 63,  protein100: 11.0, kh100: 4.0,  fett100: 0.2 },
    { id: "start-quark",         seit: 1, emoji: "🥄", en: "Low-Fat Quark",        de: "Magerquark",                kcal100: 67,  protein100: 12.0, kh100: 4.0,  fett100: 0.3 },
    { id: "start-cottage",       seit: 1, emoji: "🧀", en: "Cottage Cheese",       de: "Hüttenkäse",                kcal100: 98,  protein100: 11.1, kh100: 3.4,  fett100: 4.3 },
    { id: "start-yogurt",        seit: 1, emoji: "🍶", en: "Natural Yogurt 3.5%",  de: "Naturjoghurt 3,5%",         kcal100: 61,  protein100: 3.5,  kh100: 4.7,  fett100: 3.3 },
    { id: "start-milk",          seit: 1, emoji: "🥛", en: "Milk 3.5%",            de: "Milch 3,5%",                kcal100: 64,  protein100: 3.3,  kh100: 4.8,  fett100: 3.5 },
    { id: "start-mozzarella",    seit: 1, emoji: "🧀", en: "Mozzarella",           de: "Mozzarella",                kcal100: 254, protein100: 24.3, kh100: 2.8,  fett100: 15.9 },
    { id: "start-feta",          seit: 1, emoji: "🧀", en: "Feta",                 de: "Feta",                      kcal100: 264, protein100: 14.2, kh100: 4.1,  fett100: 21.3 },
    { id: "start-gouda",         seit: 1, emoji: "🧀", en: "Gouda",                de: "Gouda",                     kcal100: 356, protein100: 24.9, kh100: 2.2,  fett100: 27.4 },
    { id: "start-whey",          seit: 1, emoji: "💪", en: "Whey Protein Powder",  de: "Whey-Proteinpulver",        kcal100: 380, protein100: 78.0, kh100: 6.0,  fett100: 6.0 },
    { id: "start-tofu",          seit: 1, emoji: "⬜", en: "Tofu (firm)",          de: "Tofu (natur)",              kcal100: 144, protein100: 17.3, kh100: 2.8,  fett100: 8.7 },

    // --- Hülsenfrüchte ---
    { id: "start-lentils",       seit: 1, emoji: "🫘", en: "Lentils (cooked)",     de: "Linsen (gekocht)",          kcal100: 116, protein100: 9.0,  kh100: 20.1, fett100: 0.4 },
    { id: "start-chickpeas",     seit: 1, emoji: "🫛", en: "Chickpeas (cooked)",   de: "Kichererbsen (gekocht)",    kcal100: 164, protein100: 8.9,  kh100: 27.4, fett100: 2.6 },

    // --- Gemüse ---
    { id: "start-broccoli",      seit: 1, emoji: "🥦", en: "Broccoli",             de: "Brokkoli",                  kcal100: 34,  protein100: 2.8,  kh100: 6.6,  fett100: 0.4 },
    { id: "start-spinach",       seit: 1, emoji: "🥬", en: "Spinach",              de: "Spinat",                    kcal100: 23,  protein100: 2.9,  kh100: 3.6,  fett100: 0.4 },
    { id: "start-tomato",        seit: 1, emoji: "🍅", en: "Tomato",               de: "Tomate",                    kcal100: 18,  protein100: 0.9,  kh100: 3.9,  fett100: 0.2 },
    { id: "start-cucumber",      seit: 1, emoji: "🥒", en: "Cucumber",             de: "Gurke",                     kcal100: 15,  protein100: 0.7,  kh100: 3.6,  fett100: 0.1 },
    { id: "start-pepper",        seit: 1, emoji: "🫑", en: "Bell Pepper (red)",    de: "Paprika (rot)",             kcal100: 31,  protein100: 1.0,  kh100: 6.0,  fett100: 0.3 },
    { id: "start-carrot",        seit: 1, emoji: "🥕", en: "Carrot",               de: "Karotte",                   kcal100: 41,  protein100: 0.9,  kh100: 9.6,  fett100: 0.2 },
    { id: "start-zucchini",      seit: 1, emoji: "🥒", en: "Zucchini",             de: "Zucchini",                  kcal100: 17,  protein100: 1.2,  kh100: 3.1,  fett100: 0.3 },
    { id: "start-avocado",       seit: 1, emoji: "🥑", en: "Avocado",              de: "Avocado",                   kcal100: 160, protein100: 2.0,  kh100: 8.5,  fett100: 14.7 },

    // --- Obst ---
    { id: "start-banana",        seit: 1, emoji: "🍌", en: "Banana",               de: "Banane",                    kcal100: 89,  protein100: 1.1,  kh100: 22.8, fett100: 0.3 },
    { id: "start-apple",         seit: 1, emoji: "🍎", en: "Apple",                de: "Apfel",                     kcal100: 52,  protein100: 0.3,  kh100: 13.8, fett100: 0.2 },
    { id: "start-blueberries",   seit: 1, emoji: "🫐", en: "Blueberries",          de: "Heidelbeeren",              kcal100: 57,  protein100: 0.7,  kh100: 14.5, fett100: 0.3 },
    { id: "start-strawberries",  seit: 1, emoji: "🍓", en: "Strawberries",         de: "Erdbeeren",                 kcal100: 32,  protein100: 0.7,  kh100: 7.7,  fett100: 0.3 },

    // --- Nüsse, Fette & Süßes ---
    { id: "start-almonds",       seit: 1, emoji: "🌰", en: "Almonds",              de: "Mandeln",                   kcal100: 579, protein100: 21.2, kh100: 21.6, fett100: 49.9 },
    { id: "start-walnuts",       seit: 1, emoji: "🌰", en: "Walnuts",              de: "Walnüsse",                  kcal100: 654, protein100: 15.2, kh100: 13.7, fett100: 65.2 },
    { id: "start-peanutbutter",  seit: 1, emoji: "🥜", en: "Peanut Butter",        de: "Erdnussbutter",             kcal100: 588, protein100: 25.1, kh100: 20.0, fett100: 50.4 },
    { id: "start-oliveoil",      seit: 1, emoji: "🫒", en: "Olive Oil",            de: "Olivenöl",                  kcal100: 884, protein100: 0,    kh100: 0,    fett100: 100 },
    { id: "start-butter",        seit: 1, emoji: "🧈", en: "Butter",               de: "Butter",                    kcal100: 717, protein100: 0.9,  kh100: 0.1,  fett100: 81.1 },
    { id: "start-darkchocolate", seit: 1, emoji: "🍫", en: "Dark Chocolate 70%",   de: "Zartbitterschokolade 70%",  kcal100: 598, protein100: 7.8,  kh100: 45.9, fett100: 42.6 },

    // ===== Version 2: typisch Fitness-Szene =====

    // --- Kohlenhydrat-Quellen (roh gewogen, wie beim Meal Prep üblich) ---
    { id: "start-basmati-dry",   seit: 2, emoji: "🍚", en: "Basmati Rice (dry)",   de: "Basmatireis (roh)",         kcal100: 350, protein100: 8.0,  kh100: 78.0, fett100: 0.6 },
    { id: "start-pasta-dry",     seit: 2, emoji: "🍝", en: "Pasta (dry)",          de: "Nudeln (roh)",              kcal100: 360, protein100: 13.0, kh100: 72.0, fett100: 1.5 },
    { id: "start-wwpasta-dry",   seit: 2, emoji: "🍝", en: "Whole Wheat Pasta (dry)", de: "Vollkornnudeln (roh)",   kcal100: 340, protein100: 14.0, kh100: 64.0, fett100: 2.5 },
    { id: "start-creamofrice",   seit: 2, emoji: "🥣", en: "Cream of Rice",        de: "Reisgrieß",                 kcal100: 356, protein100: 6.5,  kh100: 80.0, fett100: 0.6 },
    { id: "start-wrap",          seit: 2, emoji: "🌯", en: "Tortilla Wrap",        de: "Tortilla-Wrap",             kcal100: 302, protein100: 8.5,  kh100: 50.0, fett100: 7.5 },
    { id: "start-bagel",         seit: 2, emoji: "🥯", en: "Bagel",                de: "Bagel",                     kcal100: 257, protein100: 10.0, kh100: 50.5, fett100: 1.6 },
    { id: "start-granola",       seit: 2, emoji: "🥣", en: "Granola",              de: "Knuspermüsli",              kcal100: 445, protein100: 9.0,  kh100: 64.0, fett100: 17.0 },
    { id: "start-honey",         seit: 2, emoji: "🍯", en: "Honey",                de: "Honig",                     kcal100: 304, protein100: 0.3,  kh100: 82.4, fett100: 0 },
    { id: "start-dates",         seit: 2, emoji: "🌴", en: "Dates (dried)",        de: "Datteln (getrocknet)",      kcal100: 282, protein100: 2.5,  kh100: 75.0, fett100: 0.4 },

    // --- Fleisch & Fisch ---
    { id: "start-beef-20",       seit: 2, emoji: "🍔", en: "Ground Beef 20%",      de: "Rinderhack 20%",            kcal100: 254, protein100: 17.2, kh100: 0,    fett100: 20.0 },
    { id: "start-steak",         seit: 2, emoji: "🥩", en: "Beef Steak (lean)",    de: "Rindersteak (mager)",       kcal100: 127, protein100: 22.8, kh100: 0,    fett100: 3.9 },
    { id: "start-chicken-thigh", seit: 2, emoji: "🍗", en: "Chicken Thigh (skinless)", de: "Hähnchenschenkel (ohne Haut)", kcal100: 120, protein100: 19.7, kh100: 0, fett100: 3.9 },
    { id: "start-pork-tender",   seit: 2, emoji: "🥩", en: "Pork Tenderloin",      de: "Schweinefilet",             kcal100: 114, protein100: 20.7, kh100: 0,    fett100: 3.5 },
    { id: "start-turkey-ham",    seit: 2, emoji: "🥓", en: "Turkey Ham",           de: "Putenschinken",             kcal100: 105, protein100: 19.0, kh100: 1.5,  fett100: 2.5 },
    { id: "start-jerky",         seit: 2, emoji: "🥩", en: "Beef Jerky",           de: "Beef Jerky",                kcal100: 257, protein100: 45.0, kh100: 9.0,  fett100: 4.5 },
    { id: "start-cod",           seit: 2, emoji: "🐟", en: "Cod",                  de: "Kabeljau",                  kcal100: 82,  protein100: 17.8, kh100: 0,    fett100: 0.7 },
    { id: "start-smoked-salmon", seit: 2, emoji: "🐟", en: "Smoked Salmon",        de: "Räucherlachs",              kcal100: 117, protein100: 18.3, kh100: 0,    fett100: 4.3 },

    // --- Eier, Milch & Protein ---
    { id: "start-egg-white",     seit: 2, emoji: "🥚", en: "Egg Whites",           de: "Eiklar",                    kcal100: 52,  protein100: 10.9, kh100: 0.7,  fett100: 0.2 },
    { id: "start-egg-raw",       seit: 2, emoji: "🥚", en: "Whole Egg (raw)",      de: "Ei (roh)",                  kcal100: 143, protein100: 12.6, kh100: 0.7,  fett100: 9.5 },
    { id: "start-greek-0",       seit: 2, emoji: "🥣", en: "Greek Yogurt 0%",      de: "Griechischer Joghurt 0%",   kcal100: 59,  protein100: 10.2, kh100: 3.6,  fett100: 0.4 },
    { id: "start-greek-10",      seit: 2, emoji: "🥣", en: "Greek Yogurt 10%",     de: "Griechischer Joghurt 10%",  kcal100: 122, protein100: 4.6,  kh100: 3.8,  fett100: 10.0 },
    { id: "start-milk-15",       seit: 2, emoji: "🥛", en: "Milk 1.5%",            de: "Milch 1,5%",                kcal100: 47,  protein100: 3.4,  kh100: 4.9,  fett100: 1.5 },
    { id: "start-oatdrink",      seit: 2, emoji: "🥛", en: "Oat Drink",            de: "Haferdrink",                kcal100: 42,  protein100: 0.3,  kh100: 6.6,  fett100: 1.5 },
    { id: "start-casein",        seit: 2, emoji: "💪", en: "Casein Protein Powder", de: "Casein-Proteinpulver",     kcal100: 355, protein100: 80.0, kh100: 5.0,  fett100: 1.5 },
    { id: "start-proteinbar",    seit: 2, emoji: "🍫", en: "Protein Bar (average)", de: "Proteinriegel (Durchschnitt)", kcal100: 367, protein100: 32.0, kh100: 35.0, fett100: 11.0 },
    { id: "start-proteinpudding", seit: 2, emoji: "🍮", en: "High-Protein Pudding", de: "High-Protein-Pudding",     kcal100: 77,  protein100: 10.0, kh100: 6.0,  fett100: 1.5 },
    { id: "start-creamcheese-light", seit: 2, emoji: "🧀", en: "Cream Cheese Light", de: "Frischkäse leicht",       kcal100: 129, protein100: 8.0,  kh100: 4.0,  fett100: 9.0 },
    { id: "start-parmesan",      seit: 2, emoji: "🧀", en: "Parmesan",             de: "Parmesan",                  kcal100: 392, protein100: 35.8, kh100: 3.2,  fett100: 25.8 },

    // --- Pflanzliche Proteine & Hülsenfrüchte ---
    { id: "start-edamame",       seit: 2, emoji: "🫛", en: "Edamame",              de: "Edamame",                   kcal100: 121, protein100: 11.9, kh100: 8.9,  fett100: 5.2 },
    { id: "start-tempeh",        seit: 2, emoji: "🟫", en: "Tempeh",               de: "Tempeh",                    kcal100: 192, protein100: 20.3, kh100: 7.6,  fett100: 10.8 },
    { id: "start-kidney",        seit: 2, emoji: "🫘", en: "Kidney Beans (cooked)", de: "Kidneybohnen (gekocht)",   kcal100: 127, protein100: 8.7,  kh100: 22.8, fett100: 0.5 },
    { id: "start-hummus",        seit: 2, emoji: "🫙", en: "Hummus",               de: "Hummus",                    kcal100: 166, protein100: 7.9,  kh100: 14.3, fett100: 9.6 },

    // --- Gemüse ---
    { id: "start-greenbeans",    seit: 2, emoji: "🫛", en: "Green Beans",          de: "Grüne Bohnen",              kcal100: 31,  protein100: 1.8,  kh100: 7.0,  fett100: 0.2 },
    { id: "start-asparagus",     seit: 2, emoji: "🌱", en: "Asparagus",            de: "Spargel",                   kcal100: 20,  protein100: 2.2,  kh100: 3.9,  fett100: 0.1 },
    { id: "start-mushrooms",     seit: 2, emoji: "🍄", en: "Mushrooms",            de: "Champignons",               kcal100: 22,  protein100: 3.1,  kh100: 3.3,  fett100: 0.3 },
    { id: "start-onion",         seit: 2, emoji: "🧅", en: "Onion",                de: "Zwiebel",                   kcal100: 40,  protein100: 1.1,  kh100: 9.3,  fett100: 0.1 },
    { id: "start-salad",         seit: 2, emoji: "🥗", en: "Mixed Leaf Salad",     de: "Blattsalat",                kcal100: 15,  protein100: 1.4,  kh100: 2.9,  fett100: 0.2 },

    // --- Obst ---
    { id: "start-berries-frozen", seit: 2, emoji: "🫐", en: "Frozen Mixed Berries", de: "TK-Beerenmischung",        kcal100: 45,  protein100: 0.9,  kh100: 10.0, fett100: 0.3 },
    { id: "start-mango",         seit: 2, emoji: "🥭", en: "Mango",                de: "Mango",                     kcal100: 60,  protein100: 0.8,  kh100: 15.0, fett100: 0.4 },
    { id: "start-pineapple",     seit: 2, emoji: "🍍", en: "Pineapple",            de: "Ananas",                    kcal100: 50,  protein100: 0.5,  kh100: 13.1, fett100: 0.1 },
    { id: "start-orange",        seit: 2, emoji: "🍊", en: "Orange",               de: "Orange",                    kcal100: 47,  protein100: 0.9,  kh100: 11.8, fett100: 0.1 },
    { id: "start-kiwi",          seit: 2, emoji: "🥝", en: "Kiwi",                 de: "Kiwi",                      kcal100: 61,  protein100: 1.1,  kh100: 14.7, fett100: 0.5 },
    { id: "start-grapes",        seit: 2, emoji: "🍇", en: "Grapes",               de: "Weintrauben",               kcal100: 69,  protein100: 0.7,  kh100: 18.1, fett100: 0.2 },

    // --- Nüsse & Samen ---
    { id: "start-cashews",       seit: 2, emoji: "🥜", en: "Cashews",              de: "Cashewkerne",               kcal100: 553, protein100: 18.2, kh100: 30.2, fett100: 43.9 },
    { id: "start-almondbutter",  seit: 2, emoji: "🥜", en: "Almond Butter",        de: "Mandelmus",                 kcal100: 614, protein100: 21.0, kh100: 18.8, fett100: 55.5 },
    { id: "start-chia",          seit: 2, emoji: "🌱", en: "Chia Seeds",           de: "Chiasamen",                 kcal100: 486, protein100: 16.5, kh100: 42.1, fett100: 30.7 },

    // ===== Version 3: High-Protein-Produkte aus Supermärkten =====
    // Quelle: Open Food Facts (openfoodfacts.org), Lizenz ODbL – Hinweis steht in der App unter Einstellungen.
    // Gesucht: Hofer, Aldi, Lidl, Penny, Billa, Billa Plus, Spar, Interspar, Eurospar (Stand 26.10.2026).
    // Aufgenommen nur, wenn: in Österreich oder Deutschland verkauft, alle vier Werte vorhanden,
    // mindestens 20 % der Energie aus Protein (EU-Regel für „High Protein“) und kcal plausibel.
    // id = "off-" + Strichcode (EAN). "laden" = wo es laut Open Food Facts verkauft wird.
    // --- Hofer ---
    { id: "off-4099200183190", seit: 3, emoji: "🍫", de: "Crane Proteinriegel kohlenhydratreduziert", en: "Crane Protein Bar Low Carb", marke: "Crane", laden: "Hofer", kcal100: 356, protein100: 35.6, kh100: 21.1, fett100: 13.1, quelle: "openfoodfacts:4099200183190" },
    { id: "off-4099200183213", seit: 3, emoji: "🍫", de: "Crane Proteinriegel", en: "Crane Protein Bar", marke: "Crane", laden: "Hofer", kcal100: 337, protein100: 35, kh100: 20, fett100: 11, quelle: "openfoodfacts:4099200183213" },
    { id: "off-4099200188812", seit: 3, emoji: "💪", de: "Crane Whey Protein Vanille", en: "Crane Whey Protein Vanilla", marke: "Crane", laden: "Hofer", kcal100: 377, protein100: 83, kh100: 4.6, fett100: 2.3, quelle: "openfoodfacts:4099200188812" },
    { id: "off-4061459356328", seit: 3, emoji: "💪", de: "Multinorm Vegan Protein Pulver Vanille-Cookie", en: "Multinorm Vegan Protein Powder Vanilla Cookie", marke: "Multinorm", laden: "Hofer", kcal100: 433, protein100: 73, kh100: 15, fett100: 8.5, quelle: "openfoodfacts:4061459356328" },
    { id: "off-4061461884369", seit: 3, emoji: "🍪", de: "Multinorm Protein Cookie Chocolate Chip", en: "Multinorm Protein Cookie Chocolate Chip", marke: "Multinorm", laden: "Hofer", kcal100: 344, protein100: 23.8, kh100: 47.5, fett100: 10, quelle: "openfoodfacts:4061461884369" },
    { id: "off-4006643131275", seit: 3, emoji: "🍫", de: "Multipower Protein Layer vegan Brownie", en: "Multipower Protein Layer Vegan Brownie", marke: "Multipower", laden: "Hofer", kcal100: 374, protein100: 24, kh100: 38, fett100: 17, quelle: "openfoodfacts:4006643131275" },
    { id: "off-4061459375107", seit: 3, emoji: "🍘", de: "Happy Harvest Protein-Knäckebrot", en: "Happy Harvest Protein Crispbread", marke: "Happy Harvest", laden: "Hofer", kcal100: 433, protein100: 33, kh100: 35, fett100: 16, quelle: "openfoodfacts:4061459375107" },

    // --- Hofer, Spar ---
    { id: "off-7610900239139", seit: 3, emoji: "☕", de: "Emmi Caffè Latte High Protein", en: "Emmi Caffè Latte High Protein", marke: "Emmi", laden: "Hofer, Spar", kcal100: 55, protein100: 7.7, kh100: 3.7, fett100: 1.1, quelle: "openfoodfacts:7610900239139" },

    // --- Hofer, Aldi ---
    { id: "off-4047247031097", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Pudding Vanille", en: "Milsani High Protein Pudding Vanilla", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 79, protein100: 10, kh100: 6.4, fett100: 1.5, quelle: "openfoodfacts:4047247031097" },
    { id: "off-4047247031080", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Pudding Schoko", en: "Milsani High Protein Pudding Chocolate", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 80, protein100: 10, kh100: 6.4, fett100: 1.6, quelle: "openfoodfacts:4047247031080" },
    { id: "off-4061461773724", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Pudding Karamell", en: "Milsani High Protein Pudding Caramel", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 79, protein100: 10, kh100: 6.2, fett100: 1.6, quelle: "openfoodfacts:4061461773724" },
    { id: "off-4061463915030", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Mousse Schokolade", en: "Milsani High Protein Mousse Chocolate", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 83.5, protein100: 10, kh100: 5.7, fett100: 2, quelle: "openfoodfacts:4061463915030" },
    { id: "off-4061463915016", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Mousse Vanille", en: "Milsani High Protein Mousse Vanilla", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 81, protein100: 10, kh100: 6.2, fett100: 1.8, quelle: "openfoodfacts:4061463915016" },
    { id: "off-4061458280334", seit: 3, emoji: "🍮", de: "Milsani High-Protein-Grießpudding Zimt", en: "Milsani High Protein Semolina Pudding Cinnamon", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 79, protein100: 7.6, kh100: 8.6, fett100: 1.5, quelle: "openfoodfacts:4061458280334" },
    { id: "off-4061461535131", seit: 3, emoji: "🥣", de: "Milsani High-Protein-Joghurt Fruchtsorten", en: "Milsani High Protein Yogurt Fruit Flavours", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 60, protein100: 10, kh100: 6, fett100: 0.4, quelle: "openfoodfacts:4061461535131" },
    { id: "off-4061459751024", seit: 3, emoji: "🥣", de: "Milsani Protein Naturjoghurt", en: "Milsani Protein Natural Yogurt", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 51, protein100: 8.6, kh100: 4, fett100: 0.5, quelle: "openfoodfacts:4061459751024" },
    { id: "off-4061464496316", seit: 3, emoji: "🥤", de: "Milsani High Protein Drink Vanille", en: "Milsani High Protein Drink Vanilla", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 66, protein100: 11, kh100: 5.5, fett100: 0.5, quelle: "openfoodfacts:4061464496316" },
    { id: "off-4061464496330", seit: 3, emoji: "🥤", de: "Milsani High Protein Drink Schoko", en: "Milsani High Protein Drink Chocolate", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 67, protein100: 11, kh100: 5.3, fett100: 0.5, quelle: "openfoodfacts:4061464496330" },
    { id: "off-4061462227349", seit: 3, emoji: "🧀", de: "Milsani High Protein Käsescheiben", en: "Milsani High Protein Cheese Slices", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 233, protein100: 33, kh100: 0, fett100: 11, quelle: "openfoodfacts:4061462227349" },
    { id: "off-4061463864383", seit: 3, emoji: "🧀", de: "Milsani High Protein Salatkäse", en: "Milsani High Protein Salad Cheese", marke: "Milsani", laden: "Hofer, Aldi", kcal100: 206, protein100: 24, kh100: 0.5, fett100: 12, quelle: "openfoodfacts:4061463864383" },

    // --- Aldi ---
    { id: "off-4061463762580", seit: 3, emoji: "💪", de: "Aldi Sports Whey Protein Deluxe Schoko", en: "Aldi Sports Whey Protein Deluxe Chocolate", marke: "Aldi Sports", laden: "Aldi", kcal100: 380, protein100: 78, kh100: 5, fett100: 4.3, quelle: "openfoodfacts:4061463762580" },
    { id: "off-4061463697035", seit: 3, emoji: "🍫", de: "Aldi Sports Proteinriegel 50 % Chocolate Caramel", en: "Aldi Sports Protein Bar 50% Chocolate Caramel", marke: "Aldi Sports", laden: "Aldi", kcal100: 334, protein100: 50, kh100: 25, fett100: 7.6, quelle: "openfoodfacts:4061463697035" },
    { id: "off-4061459617658", seit: 3, emoji: "🍫", de: "Aldi Sports Proteinriegel 30 % Brownie", en: "Aldi Sports Protein Bar 30% Brownie", marke: "Aldi Sports", laden: "Aldi", kcal100: 304, protein100: 30, kh100: 25, fett100: 9.6, quelle: "openfoodfacts:4061459617658" },
    { id: "off-4061459471816", seit: 3, emoji: "🍫", de: "Aldi Sports Low-Carb Proteinriegel Kokos-Mandel", en: "Aldi Sports Low Carb Protein Bar Coconut Almond", marke: "Aldi Sports", laden: "Aldi", kcal100: 339, protein100: 35, kh100: 9.5, fett100: 11, quelle: "openfoodfacts:4061459471816" },
    { id: "off-4061458032216", seit: 3, emoji: "🍫", de: "Multinorm High Protein Bar", en: "Multinorm High Protein Bar", marke: "Multinorm", laden: "Aldi", kcal100: 340, protein100: 50, kh100: 24, fett100: 8.2, quelle: "openfoodfacts:4061458032216" },
    { id: "off-4061458236928", seit: 3, emoji: "🌯", de: "Goldähren Protein-Wraps", en: "Goldähren Protein Wraps", marke: "Goldähren", laden: "Aldi", kcal100: 319, protein100: 18, kh100: 39, fett100: 8.7, quelle: "openfoodfacts:4061458236928" },
    { id: "off-4061458055734", seit: 3, emoji: "🍞", de: "Goldähren Protein Brot", en: "Goldähren Protein Bread", marke: "Goldähren", laden: "Aldi", kcal100: 259, protein100: 23, kh100: 10.6, fett100: 12.1, quelle: "openfoodfacts:4061458055734" },

    // --- Lidl ---
    { id: "off-4056489216155", seit: 3, emoji: "🍮", de: "Milbona High Protein Pudding Vanille", en: "Milbona High Protein Pudding Vanilla", marke: "Milbona", laden: "Lidl", kcal100: 75, protein100: 10, kh100: 5.2, fett100: 1.5, quelle: "openfoodfacts:4056489216155" },
    { id: "off-4056489216162", seit: 3, emoji: "🍮", de: "Milbona High Protein Pudding Schoko", en: "Milbona High Protein Pudding Chocolate", marke: "Milbona", laden: "Lidl", kcal100: 76, protein100: 10, kh100: 5.2, fett100: 1.5, quelle: "openfoodfacts:4056489216162" },
    { id: "off-4056489273264", seit: 3, emoji: "🍮", de: "Milbona High Protein Pudding Karamell", en: "Milbona High Protein Pudding Caramel", marke: "Milbona", laden: "Lidl", kcal100: 76, protein100: 10, kh100: 5.5, fett100: 1.5, quelle: "openfoodfacts:4056489273264" },
    { id: "off-4056489406594", seit: 3, emoji: "🍮", de: "Milbona High Protein Grießpudding Pur", en: "Milbona High Protein Semolina Pudding Plain", marke: "Milbona", laden: "Lidl", kcal100: 78, protein100: 7.6, kh100: 8.6, fett100: 1.4, quelle: "openfoodfacts:4056489406594" },
    { id: "off-4056489216216", seit: 3, emoji: "🥄", de: "Milbona High Protein Quark-Creme Natur", en: "Milbona High Protein Quark Cream Plain", marke: "Milbona", laden: "Lidl", kcal100: 67, protein100: 12.4, kh100: 3.2, fett100: 0.5, quelle: "openfoodfacts:4056489216216" },
    { id: "off-4056489601609", seit: 3, emoji: "🥄", de: "Milbona High Protein Quark-Creme Erdbeere", en: "Milbona High Protein Quark Cream Strawberry", marke: "Milbona", laden: "Lidl", kcal100: 68, protein100: 12.4, kh100: 3.5, fett100: 0.5, quelle: "openfoodfacts:4056489601609" },
    { id: "off-4056489258346", seit: 3, emoji: "🥣", de: "Milbona High Protein Joghurt Fruchtsorten", en: "Milbona High Protein Yogurt Fruit Flavours", marke: "Milbona", laden: "Lidl", kcal100: 65, protein100: 10, kh100: 6, fett100: 0.3, quelle: "openfoodfacts:4056489258346" },
    { id: "off-4056489382720", seit: 3, emoji: "🥣", de: "Milbona High Protein Fruchtjoghurt-Dessert", en: "Milbona High Protein Fruit Yogurt Dessert", marke: "Milbona", laden: "Lidl", kcal100: 76, protein100: 9, kh100: 10, fett100: 0, quelle: "openfoodfacts:4056489382720" },
    { id: "off-4056489406662", seit: 3, emoji: "🥤", de: "Milbona High Protein Drink Vanille", en: "Milbona High Protein Drink Vanilla", marke: "Milbona", laden: "Lidl", kcal100: 66, protein100: 10.5, kh100: 5.5, fett100: 0.2, quelle: "openfoodfacts:4056489406662" },
    { id: "off-4056489618133", seit: 3, emoji: "🥤", de: "Milbona High Protein Drink Schoko", en: "Milbona High Protein Drink Chocolate", marke: "Milbona", laden: "Lidl", kcal100: 67, protein100: 10.6, kh100: 5.3, fett100: 0.3, quelle: "openfoodfacts:4056489618133" },
    { id: "off-4056489247159", seit: 3, emoji: "🥛", de: "Milbona High Protein Kefir Pink Grapefruit", en: "Milbona High Protein Kefir Pink Grapefruit", marke: "Milbona", laden: "Lidl", kcal100: 53, protein100: 5.8, kh100: 4.4, fett100: 1.3, quelle: "openfoodfacts:4056489247159" },
    { id: "off-4056489416975", seit: 3, emoji: "🍮", de: "Milbona High Protein Mousse", en: "Milbona High Protein Mousse", marke: "Milbona", laden: "Lidl", kcal100: 142, protein100: 9.3, kh100: 14, fett100: 5.4, quelle: "openfoodfacts:4056489416975" },
    { id: "off-4335619027909", seit: 3, emoji: "🍰", de: "Milbona High Protein Tiramisu", en: "Milbona High Protein Tiramisu", marke: "Milbona", laden: "Lidl", kcal100: 190, protein100: 11.6, kh100: 23.7, fett100: 5.2, quelle: "openfoodfacts:4335619027909" },
    { id: "off-20955427", seit: 3, emoji: "🍫", de: "Milbona High Protein Quarkriegel", en: "Milbona High Protein Quark Bar", marke: "Milbona", laden: "Lidl", kcal100: 310, protein100: 22, kh100: 16, fett100: 19, quelle: "openfoodfacts:20955427" },
    { id: "off-4056489038641", seit: 3, emoji: "🍫", de: "IronMaxx Protein Bar Cookies & Cream", en: "IronMaxx Protein Bar Cookies & Cream", marke: "IronMaxx", laden: "Lidl", kcal100: 368, protein100: 50, kh100: 26, fett100: 10.6, quelle: "openfoodfacts:4056489038641" },
    { id: "off-4056489130741", seit: 3, emoji: "🍫", de: "IronMaxx Protein Bar Erdnuss", en: "IronMaxx Protein Bar Peanut", marke: "IronMaxx", laden: "Lidl", kcal100: 374, protein100: 50, kh100: 28.9, fett100: 10.8, quelle: "openfoodfacts:4056489130741" },
    { id: "off-4056489130758", seit: 3, emoji: "🍫", de: "IronMaxx Protein Bar Kokos", en: "IronMaxx Protein Bar Coconut", marke: "IronMaxx", laden: "Lidl", kcal100: 378, protein100: 50, kh100: 29, fett100: 11, quelle: "openfoodfacts:4056489130758" },
    { id: "off-4056489207092", seit: 3, emoji: "🍫", de: "IronMaxx Vegan Protein Bar", en: "IronMaxx Vegan Protein Bar", marke: "IronMaxx", laden: "Lidl", kcal100: 380, protein100: 26, kh100: 23, fett100: 18.5, quelle: "openfoodfacts:4056489207092" },
    { id: "off-4056489291213", seit: 3, emoji: "🍫", de: "Lidl Protein Crunchy Bar", en: "Lidl Protein Crunchy Bar", marke: "Lidl", laden: "Lidl", kcal100: 391, protein100: 33, kh100: 33.4, fett100: 16.4, quelle: "openfoodfacts:4056489291213" },
    { id: "off-4260648130675", seit: 3, emoji: "🥔", de: "IronMaxx Protein Chips", en: "IronMaxx Protein Chips", marke: "IronMaxx", laden: "Lidl", kcal100: 363, protein100: 40, kh100: 18, fett100: 11, quelle: "openfoodfacts:4260648130675" },
    { id: "off-4056489030317", seit: 3, emoji: "🥣", de: "Crownfield High Protein Müsli Knusper-Nuss", en: "Crownfield High Protein Muesli Crunchy Nut", marke: "Crownfield", laden: "Lidl", kcal100: 423, protein100: 29.1, kh100: 40.8, fett100: 14, quelle: "openfoodfacts:4056489030317" },
    { id: "off-4056489238614", seit: 3, emoji: "🍨", de: "Gelatelli High Protein Eis Creamy Chocolate", en: "Gelatelli High Protein Ice Cream Creamy Chocolate", marke: "Gelatelli", laden: "Lidl", kcal100: 111, protein100: 8.4, kh100: 17.3, fett100: 3, quelle: "openfoodfacts:4056489238614" },
    { id: "off-4056489238607", seit: 3, emoji: "🍨", de: "Gelatelli High Protein Eis Salted Caramel", en: "Gelatelli High Protein Ice Cream Salted Caramel", marke: "Gelatelli", laden: "Lidl", kcal100: 132, protein100: 7.1, kh100: 22.7, fett100: 3.3, quelle: "openfoodfacts:4056489238607" },
    { id: "off-4056489357117", seit: 3, emoji: "🥜", de: "Alesto Protein Mix Nüsse & Sojabohnen", en: "Alesto Protein Mix Nuts & Soybeans", marke: "Alesto", laden: "Lidl", kcal100: 586, protein100: 30.8, kh100: 6.8, fett100: 45.9, quelle: "openfoodfacts:4056489357117" },
    { id: "off-20138011", seit: 3, emoji: "🥜", de: "Alesto Peanut Butter Protein Balls", en: "Alesto Peanut Butter Protein Balls", marke: "Alesto", laden: "Lidl", kcal100: 411, protein100: 21, kh100: 38, fett100: 18, quelle: "openfoodfacts:20138011" },
    { id: "off-4056489196419", seit: 3, emoji: "🍞", de: "Tastino Protein Brot", en: "Tastino Protein Bread", marke: "Tastino", laden: "Lidl", kcal100: 301, protein100: 29.4, kh100: 9.5, fett100: 14.1, quelle: "openfoodfacts:4056489196419" },
    { id: "off-4056489417118", seit: 3, emoji: "🍖", de: "Chef Select High Protein Geflügel-Fleischbällchen", en: "Chef Select High Protein Chicken Meatballs", marke: "Chef Select", laden: "Lidl", kcal100: 224, protein100: 14, kh100: 5.5, fett100: 16, quelle: "openfoodfacts:4056489417118" },

    // --- Penny ---
    { id: "off-29480661", seit: 3, emoji: "🍮", de: "Penny High Protein Pudding Schoko", en: "Penny High Protein Pudding Chocolate", marke: "Penny", laden: "Penny", kcal100: 81, protein100: 10, kh100: 6.4, fett100: 1.6, quelle: "openfoodfacts:29480661" },
    { id: "off-21576553", seit: 3, emoji: "🍮", de: "Elite High Protein Mousse au Chocolat", en: "Elite High Protein Chocolate Mousse", marke: "Elite", laden: "Penny", kcal100: 86, protein100: 10, kh100: 5.8, fett100: 2.2, quelle: "openfoodfacts:21576553" },
    { id: "off-20352578", seit: 3, emoji: "🍨", de: "Rios High Protein Eis Double Chocolate", en: "Rios High Protein Ice Cream Double Chocolate", marke: "Rios", laden: "Penny", kcal100: 132, protein100: 9.4, kh100: 17.7, fett100: 2.7, quelle: "openfoodfacts:20352578" },

    // --- Billa, Billa Plus ---
    { id: "off-9010437011594", seit: 3, emoji: "🥣", de: "Billa Protein Naturjoghurt", en: "Billa Protein Natural Yogurt", marke: "Billa", laden: "Billa, Billa Plus", kcal100: 55, protein100: 8.6, kh100: 4, fett100: 0.5, quelle: "openfoodfacts:9010437011594" },
    { id: "off-9002233063020", seit: 3, emoji: "🥣", de: "Billa Protein Joghurt Erdbeere", en: "Billa Protein Yogurt Strawberry", marke: "Billa", laden: "Billa, Billa Plus", kcal100: 68, protein100: 11, kh100: 4.7, fett100: 0.5, quelle: "openfoodfacts:9002233063020" },
    { id: "off-9010437007313", seit: 3, emoji: "☕", de: "Billa Protein Caffè Latte", en: "Billa Protein Caffè Latte", marke: "Billa", laden: "Billa, Billa Plus", kcal100: 58, protein100: 6.8, kh100: 6.8, fett100: 0.5, quelle: "openfoodfacts:9010437007313" },
    { id: "off-9002233027602", seit: 3, emoji: "🍘", de: "Billa Protein Knäckebrot", en: "Billa Protein Crispbread", marke: "Billa", laden: "Billa, Billa Plus", kcal100: 510, protein100: 36, kh100: 15, fett100: 31, quelle: "openfoodfacts:9002233027602" },
    { id: "off-9002233059603", seit: 3, emoji: "🍞", de: "Billa Protein Brot mit Walnüssen", en: "Billa Protein Bread with Walnuts", marke: "Billa", laden: "Billa, Billa Plus", kcal100: 236, protein100: 18, kh100: 14, fett100: 12, quelle: "openfoodfacts:9002233059603" },
    { id: "off-8595002110229", seit: 3, emoji: "🍮", de: "Danone YoPRO Protein Pudding Vanille", en: "Danone YoPRO Protein Pudding Vanilla", marke: "Danone YoPRO", laden: "Billa, Billa Plus", kcal100: 73, protein100: 10, kh100: 6.1, fett100: 0.8, quelle: "openfoodfacts:8595002110229" },

    // --- Spar, Interspar, Eurospar ---
    { id: "off-9100000893310", seit: 3, emoji: "🥣", de: "Spar High Protein Knusper-Müsli", en: "Spar High Protein Crunchy Muesli", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 436, protein100: 24, kh100: 51, fett100: 14, quelle: "openfoodfacts:9100000893310" },
    { id: "off-9100000893358", seit: 3, emoji: "🥣", de: "Spar High Protein Knusper-Müsli Rote Beeren", en: "Spar High Protein Crunchy Muesli Red Berries", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 406, protein100: 20.4, kh100: 61.2, fett100: 7.8, quelle: "openfoodfacts:9100000893358" },
    { id: "off-9100000967004", seit: 3, emoji: "🥣", de: "Spar High-Protein-Porridge Kokos-Beeren", en: "Spar High Protein Porridge Coconut Berries", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 390, protein100: 24, kh100: 50, fett100: 9, quelle: "openfoodfacts:9100000967004" },
    { id: "off-9100000967028", seit: 3, emoji: "🥣", de: "Spar High-Protein-Porridge Schoko-Nuss-Kokos", en: "Spar High Protein Porridge Choc Nut Coconut", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 413, protein100: 24, kh100: 47, fett100: 13, quelle: "openfoodfacts:9100000967028" },
    { id: "off-9100000964867", seit: 3, emoji: "🌭", de: "Spar High Protein Wurst-Snack", en: "Spar High Protein Sausage Snack", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 336, protein100: 36, kh100: 1, fett100: 21, quelle: "openfoodfacts:9100000964867" },
    { id: "off-9100000962092", seit: 3, emoji: "🍞", de: "Spar Toast-Brötchen High Protein", en: "Spar High Protein Toast Rolls", marke: "Spar", laden: "Spar, Interspar, Eurospar", kcal100: 259, protein100: 23, kh100: 19, fett100: 8.3, quelle: "openfoodfacts:9100000962092" },
    { id: "off-9100000983035", seit: 3, emoji: "🌱", de: "Spar Veggie Veganes Faschiertes (Erbsenprotein)", en: "Spar Veggie Vegan Mince (Pea Protein)", marke: "Spar Veggie", laden: "Spar, Interspar, Eurospar", kcal100: 217, protein100: 14, kh100: 4.2, fett100: 15, quelle: "openfoodfacts:9100000983035" },

    // --- Spar ---
    { id: "off-9066001424604", seit: 3, emoji: "🥤", de: "Latella Protein Frucht & Molke Mango-Pfirsich", en: "Latella Protein Fruit & Whey Mango Peach", marke: "Latella", laden: "Spar", kcal100: 32, protein100: 4, kh100: 3.2, fett100: 0.5, quelle: "openfoodfacts:9066001424604" },
    { id: "off-7640151710040", seit: 3, emoji: "🥛", de: "Chiefs Protein Milk Choco Mountain", en: "Chiefs Protein Milk Choco Mountain", marke: "Chiefs", laden: "Spar", kcal100: 57, protein100: 7.9, kh100: 2.7, fett100: 1.4, quelle: "openfoodfacts:7640151710040" },
    { id: "off-9120079621485", seit: 3, emoji: "🍫", de: "Nussyy Bio High Protein Riegel Erdnuss-Banane-Kakao", en: "Nussyy Organic High Protein Bar Peanut Banana Cacao", marke: "Nussyy", laden: "Spar", kcal100: 380, protein100: 19, kh100: 50, fett100: 10, quelle: "openfoodfacts:9120079621485" },
    { id: "off-4260402483283", seit: 3, emoji: "🍫", de: "Veganz Protein Bar", en: "Veganz Protein Bar", marke: "Veganz", laden: "Spar", kcal100: 397, protein100: 29, kh100: 39, fett100: 13, quelle: "openfoodfacts:4260402483283" },
    { id: "off-4260044262499", seit: 3, emoji: "🍫", de: "PowerSystem Full Power 40 % Protein Panna Cotta", en: "PowerSystem Full Power 40% Protein Panna Cotta", marke: "PowerSystem", laden: "Spar", kcal100: 412, protein100: 40, kh100: 37, fett100: 14, quelle: "openfoodfacts:4260044262499" }
,

    // ===== Version 4: Ivys Wunschliste + Fitness-Klassiker =====
    // Markenprodukte: Open Food Facts (ODbL), wo dort nichts Verlässliches stand:
    // Herstellerangaben über Händlerseiten (More Nutrition: mueller.at, Ja! Natürlich: fddb.info,
    // PB2: USDA Branded Foods). Naturprodukte (Obst, Gemüse, Getreide): USDA FoodData Central.
    // Bei Hülsenfrüchten, Tofu & Co. bewusst nur EINE bekannte Marke.
    // --- Wurst & Fleisch ---
    { id: "off-9001426004659", seit: 4, emoji: "🌭", de: "Radatz Käsekrainer", en: "Radatz Cheese Sausage (Käsekrainer)", marke: "Radatz", laden: "Billa", kcal100: 293, protein100: 19, kh100: 0.5, fett100: 24, quelle: "openfoodfacts:9001426004659" },
    { id: "off-9003740091575", seit: 4, emoji: "🌭", de: "Hofstädter Puten-Käsekrainer", en: "Hofstädter Turkey Cheese Sausage", marke: "Hofstädter", kcal100: 199, protein100: 16, kh100: 0.5, fett100: 15, quelle: "openfoodfacts:9003740091575" },
    { id: "mk-janatuerlich-frankfurter", seit: 4, emoji: "🌭", de: "Ja! Natürlich Bio-Frankfurter", en: "Ja! Natürlich Organic Frankfurters", marke: "Ja! Natürlich", laden: "Billa, Billa Plus", kcal100: 232, protein100: 12.6, kh100: 0.1, fett100: 19.9, quelle: "fddb.info" },
    { id: "off-4061458234641", seit: 4, emoji: "🥓", de: "Salettis (Salami-Sticks)", en: "Salettis (Salami Sticks)", marke: "Güldenhof", laden: "Hofer, Aldi", kcal100: 491, protein100: 25, kh100: 1, fett100: 43, quelle: "openfoodfacts:4061458234641" },
    { id: "off-8004030344570", seit: 4, emoji: "🥫", de: "Rio Mare Thunfisch Naturale (in Wasser)", en: "Rio Mare Tuna in Water", marke: "Rio Mare", kcal100: 101, protein100: 24, kh100: 0, fett100: 0.5, quelle: "openfoodfacts:8004030344570" },
    { id: "off-4902950116496", seit: 4, emoji: "🥫", de: "Vier Diamanten Thunfisch in Olivenöl (abgetropft)", en: "Vier Diamanten Tuna in Olive Oil (drained)", marke: "Vier Diamanten", kcal100: 163, protein100: 24, kh100: 0.1, fett100: 7.4, quelle: "openfoodfacts:4902950116496" },

    // --- Käse ---
    { id: "off-9010158007715", seit: 4, emoji: "🧀", de: "Clever Mozzarella light", en: "Clever Mozzarella Light", marke: "Clever", laden: "Billa, Billa Plus", kcal100: 161, protein100: 20, kh100: 1, fett100: 8.5, quelle: "openfoodfacts:9010158007715" },
    { id: "off-20851255", seit: 4, emoji: "🧀", de: "Milbona Emmentaler", en: "Milbona Emmental", marke: "Milbona", laden: "Lidl", kcal100: 370, protein100: 28.2, kh100: 0.1, fett100: 28.5, quelle: "openfoodfacts:20851255" },
    { id: "off-4056489594116", seit: 4, emoji: "🧀", de: "Milbona Cheddar", en: "Milbona Cheddar", marke: "Milbona", laden: "Lidl", kcal100: 417, protein100: 25.4, kh100: 0.1, fett100: 34.9, quelle: "openfoodfacts:4056489594116" },
    { id: "off-4061462490927", seit: 4, emoji: "🧀", de: "Steirischer Bergkäse", en: "Styrian Mountain Cheese", marke: "Obersteirische Molkerei", laden: "Hofer", kcal100: 386, protein100: 27, kh100: 0, fett100: 31, quelle: "openfoodfacts:4061462490927" },
    { id: "off-4002683005200", seit: 4, emoji: "🧀", de: "Harzer Käse", en: "Harzer Cheese (Sour Milk Cheese)", marke: "Harzinger", kcal100: 125, protein100: 30, kh100: 0.1, fett100: 0.5, quelle: "openfoodfacts:4002683005200" },
    { id: "off-9100000907222", seit: 4, emoji: "🧀", de: "Spar Natur*pur Bio-Cottage-Cheese", en: "Spar Natur*pur Organic Cottage Cheese", marke: "Spar Natur*pur", laden: "Spar, Interspar, Eurospar", kcal100: 95, protein100: 11, kh100: 2.6, fett100: 4.5, quelle: "openfoodfacts:9100000907222" },

    // --- Vegane & vegetarische Proteinquellen (je eine Marke) ---
    { id: "off-3083681107876", seit: 4, emoji: "🫛", de: "Bonduelle Kichererbsen (Dose)", en: "Bonduelle Chickpeas (canned)", marke: "Bonduelle", kcal100: 140, protein100: 9.1, kh100: 17, fett100: 2.4, quelle: "openfoodfacts:3083681107876" },
    { id: "off-3083681107869", seit: 4, emoji: "🫘", de: "Bonduelle Linsen (Dose)", en: "Bonduelle Lentils (canned)", marke: "Bonduelle", kcal100: 133, protein100: 11, kh100: 17, fett100: 0.5, quelle: "openfoodfacts:3083681107869" },
    { id: "off-9010158017455", seit: 4, emoji: "🫘", de: "Ja! Natürlich Bio-Kidneybohnen (Dose)", en: "Ja! Natürlich Organic Kidney Beans (canned)", marke: "Ja! Natürlich", laden: "Billa, Billa Plus", kcal100: 108, protein100: 7.7, kh100: 15, fett100: 0.5, quelle: "openfoodfacts:9010158017455" },
    { id: "usda-red-lentils-dry", seit: 4, emoji: "🫘", de: "Rote Linsen (trocken)", en: "Red Lentils (dry)", kcal100: 352, protein100: 24.6, kh100: 63.4, fett100: 1.1, quelle: "usda" },
    { id: "off-6079501057497", seit: 4, emoji: "🍝", de: "Barilla Linsennudeln (roh)", en: "Barilla Red Lentil Pasta (dry)", marke: "Barilla", kcal100: 335, protein100: 25, kh100: 47.4, fett100: 2.4, quelle: "openfoodfacts:6079501057497" },
    { id: "off-4012359110107", seit: 4, emoji: "⬜", de: "Taifun Tofu Natur", en: "Taifun Tofu Plain", marke: "Taifun", kcal100: 119, protein100: 13, kh100: 1.3, fett100: 6.7, quelle: "openfoodfacts:4012359110107" },
    { id: "off-4058172508080", seit: 4, emoji: "🟫", de: "dmBio Räuchertofu", en: "dmBio Smoked Tofu", marke: "dmBio", laden: "dm", kcal100: 128, protein100: 13, kh100: 0.7, fett100: 7.8, quelle: "openfoodfacts:4058172508080" },
    { id: "off-5411788043328", seit: 4, emoji: "🟫", de: "Lima Seitan", en: "Lima Seitan", marke: "Lima", kcal100: 117, protein100: 21.3, kh100: 4.1, fett100: 1.3, quelle: "openfoodfacts:5411788043328" },
    { id: "off-4066447519662", seit: 4, emoji: "🌱", de: "dmBio Soja-Schnetzel (trocken)", en: "dmBio Soy Chunks (dry)", marke: "dmBio", laden: "dm", kcal100: 371, protein100: 52, kh100: 16, fett100: 7.6, quelle: "openfoodfacts:4066447519662" },
    { id: "off-4056489183457", seit: 4, emoji: "🌱", de: "Vemondo Veganes Hack", en: "Vemondo Vegan Mince", marke: "Vemondo", laden: "Lidl", kcal100: 188, protein100: 14.6, kh100: 8.9, fett100: 9.2, quelle: "openfoodfacts:4056489183457" },
    { id: "off-4058172904400", seit: 4, emoji: "🥜", de: "dmBio Erdnussmehl (entölt)", en: "dmBio Peanut Flour (defatted)", marke: "dmBio", laden: "dm", kcal100: 387, protein100: 45, kh100: 16, fett100: 13, quelle: "openfoodfacts:4058172904400" },
    { id: "usda-soy-drink", seit: 4, emoji: "🥛", de: "Sojadrink ungesüßt", en: "Soy Drink unsweetened", kcal100: 33, protein100: 3.3, kh100: 0.2, fett100: 1.8, quelle: "usda" },
    { id: "off-4311596640355", seit: 4, emoji: "🥣", de: "Sojajoghurt Natur", en: "Soy Yogurt Plain", kcal100: 53, protein100: 4.1, kh100: 3.1, fett100: 2.3, quelle: "openfoodfacts:4311596640355" },

    // --- Protein-Pulver & Fitness-Klassiker (auch zum Abnehmen) ---
    { id: "mk-more-iced-coffee", seit: 4, emoji: "💪", de: "More Nutrition More Protein Iced Coffee", en: "More Nutrition More Protein Iced Coffee", marke: "More Nutrition", laden: "dm, Müller", kcal100: 374, protein100: 75, kh100: 7.5, fett100: 3.7, quelle: "mueller.at" },
    { id: "mk-pb2-original", seit: 4, emoji: "🥜", de: "PB2 Erdnussbutter-Pulver", en: "PB2 Powdered Peanut Butter", marke: "PB2", kcal100: 462, protein100: 46.2, kh100: 38.5, fett100: 11.5, quelle: "usda-branded" },
    { id: "off-4250519661254", seit: 4, emoji: "🥞", de: "ESN Protein Pancake Mix", en: "ESN Protein Pancake Mix", marke: "ESN", kcal100: 358, protein100: 55.6, kh100: 26.7, fett100: 2.2, quelle: "openfoodfacts:4250519661254" },
    { id: "off-4056489376194", seit: 4, emoji: "🍜", de: "Vitasia Konjak-Nudeln", en: "Vitasia Konjac Noodles", marke: "Vitasia", laden: "Lidl", kcal100: 11, protein100: 0, kh100: 1.2, fett100: 0, quelle: "openfoodfacts:4056489376194" },
    { id: "off-4260644046154", seit: 4, emoji: "🍯", de: "More Nutrition Zero Sirup", en: "More Nutrition Zero Syrup", marke: "More Nutrition", laden: "dm, Müller", kcal100: 1, protein100: 0, kh100: 0, fett100: 0, quelle: "openfoodfacts:4260644046154" },
    // Erythrit ist ein Zuckeralkohol: steht laut EU-Recht auf der Packung bei den Kohlenhydraten,
    // wird aber nicht verstoffwechselt (0 kcal, kein Blutzuckeranstieg) → in der App überall 0.
    { id: "off-4311501016473", seit: 4, emoji: "🧂", de: "Erythrit (Zuckerersatz)", en: "Erythritol (Sweetener)", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "openfoodfacts:4311501016473" },
    { id: "off-7622210355270", seit: 4, emoji: "🍫", de: "Bensdorp Kakaopulver", en: "Bensdorp Cocoa Powder", marke: "Bensdorp", kcal100: 405, protein100: 23, kh100: 14, fett100: 20, quelle: "openfoodfacts:7622210355270" },
    { id: "usda-popcorn", seit: 4, emoji: "🍿", de: "Popcorn (ohne Fett gepoppt)", en: "Popcorn (air-popped)", kcal100: 387, protein100: 12.9, kh100: 77.8, fett100: 4.5, quelle: "usda" },
    { id: "off-4001242004197", seit: 4, emoji: "🍿", de: "Chio Mikrowellen-Popcorn salzig", en: "Chio Microwave Popcorn Salted", marke: "Chio", kcal100: 407, protein100: 8.5, kh100: 51, fett100: 17, quelle: "openfoodfacts:4001242004197" },
    { id: "off-4066447435115", seit: 4, emoji: "🌾", de: "dmBio Flohsamenschalen", en: "dmBio Psyllium Husks", marke: "dmBio", laden: "dm", kcal100: 191, protein100: 1, kh100: 2.2, fett100: 0.2, quelle: "openfoodfacts:4066447435115" },
    { id: "off-4058172696480", seit: 4, emoji: "🌱", de: "dmBio Leinsamen geschrotet", en: "dmBio Ground Flaxseed", marke: "dmBio", laden: "dm", kcal100: 540, protein100: 22, kh100: 3, fett100: 43, quelle: "openfoodfacts:4058172696480" },
    { id: "off-4066447123159", seit: 4, emoji: "🌾", de: "dmBio Haferkleie", en: "dmBio Oat Bran", marke: "dmBio", laden: "dm", kcal100: 360, protein100: 16, kh100: 52, fett100: 7.6, quelle: "openfoodfacts:4066447123159" },
    { id: "usda-coffee", seit: 4, emoji: "☕", de: "Kaffee schwarz", en: "Black Coffee", kcal100: 2, protein100: 0.1, kh100: 0, fett100: 0, quelle: "usda" },
    { id: "usda-cola-zero", seit: 4, emoji: "🥤", de: "Cola Zero / Light", en: "Cola Zero / Diet", kcal100: 0.3, protein100: 0, kh100: 0, fett100: 0, quelle: "usda" },
    { id: "usda-mustard", seit: 4, emoji: "🌭", de: "Senf", en: "Mustard", kcal100: 66, protein100: 4, kh100: 5.8, fett100: 3.3, quelle: "usda" },
    { id: "usda-ketchup", seit: 4, emoji: "🍅", de: "Tomatenketchup", en: "Tomato Ketchup", kcal100: 102, protein100: 1.2, kh100: 23.2, fett100: 0.1, quelle: "usda" },
    { id: "usda-soy-sauce", seit: 4, emoji: "🥢", de: "Sojasauce", en: "Soy Sauce", kcal100: 53, protein100: 8.1, kh100: 4.9, fett100: 0.6, quelle: "usda" },

    // --- Kohlenhydrat-Quellen ---
    { id: "off-9010158009061", seit: 4, emoji: "🍚", de: "Clever Basmatireis (roh)", en: "Clever Basmati Rice (dry)", marke: "Clever", laden: "Billa, Billa Plus", kcal100: 348, protein100: 8, kh100: 77, fett100: 0.8, quelle: "openfoodfacts:9010158009061" },
    { id: "usda-jasmine-dry", seit: 4, emoji: "🍚", de: "Jasminreis (roh)", en: "Jasmine Rice (dry)", kcal100: 360, protein100: 7, kh100: 79, fett100: 0.6, quelle: "usda" },
    { id: "usda-brownrice-dry", seit: 4, emoji: "🍚", de: "Vollkornreis (roh)", en: "Brown Rice (dry)", kcal100: 370, protein100: 7.9, kh100: 77.2, fett100: 2.9, quelle: "usda" },
    { id: "off-4104420081468", seit: 4, emoji: "🥣", de: "Alnatura Reisflocken", en: "Alnatura Rice Flakes", marke: "Alnatura", laden: "dm", kcal100: 386, protein100: 8.2, kh100: 79.4, fett100: 3.2, quelle: "openfoodfacts:4104420081468" },
    { id: "usda-potato-raw", seit: 4, emoji: "🥔", de: "Kartoffeln (roh)", en: "Potatoes (raw)", kcal100: 77, protein100: 2, kh100: 17.5, fett100: 0.1, quelle: "usda" },
    { id: "usda-sweetpotato-raw", seit: 4, emoji: "🍠", de: "Süßkartoffel (roh)", en: "Sweet Potato (raw)", kcal100: 86, protein100: 1.6, kh100: 20.1, fett100: 0.1, quelle: "usda" },
    { id: "usda-butternut", seit: 4, emoji: "🎃", de: "Butternut-Kürbis (roh)", en: "Butternut Squash (raw)", kcal100: 45, protein100: 1, kh100: 11.7, fett100: 0.1, quelle: "usda" },
    { id: "off-3083681117905", seit: 4, emoji: "🌽", de: "Bonduelle Mais (Dose)", en: "Bonduelle Sweetcorn (canned)", marke: "Bonduelle", kcal100: 80, protein100: 2.9, kh100: 11, fett100: 1.9, quelle: "openfoodfacts:3083681117905" },
    { id: "usda-couscous-dry", seit: 4, emoji: "🍚", de: "Couscous (roh)", en: "Couscous (dry)", kcal100: 376, protein100: 12.8, kh100: 77.4, fett100: 0.6, quelle: "usda" },
    { id: "usda-bulgur-dry", seit: 4, emoji: "🌾", de: "Bulgur (roh)", en: "Bulgur (dry)", kcal100: 342, protein100: 12.3, kh100: 75.9, fett100: 1.3, quelle: "usda" },
    { id: "usda-millet-dry", seit: 4, emoji: "🌾", de: "Hirse (roh)", en: "Millet (dry)", kcal100: 378, protein100: 11, kh100: 72.9, fett100: 4.2, quelle: "usda" },
    { id: "usda-buckwheat-dry", seit: 4, emoji: "🌾", de: "Buchweizen (roh)", en: "Buckwheat (dry)", kcal100: 343, protein100: 13.3, kh100: 71.5, fett100: 3.4, quelle: "usda" },
    { id: "usda-polenta-dry", seit: 4, emoji: "🌽", de: "Polenta / Maisgrieß (roh)", en: "Polenta / Cornmeal (dry)", kcal100: 352, protein100: 7.6, kh100: 76, fett100: 1.3, quelle: "usda" },
    { id: "usda-gnocchi", seit: 4, emoji: "🥟", de: "Gnocchi (Kühlregal)", en: "Gnocchi (fresh, packaged)", kcal100: 160, protein100: 4, kh100: 33, fett100: 1, quelle: "usda" },
    { id: "usda-kaisersemmel", seit: 4, emoji: "🥖", de: "Kaisersemmel", en: "Kaiser Roll", kcal100: 272, protein100: 9, kh100: 55, fett100: 1.5, quelle: "usda" },
    { id: "usda-toast", seit: 4, emoji: "🍞", de: "Toastbrot (Weizen)", en: "White Toast Bread", kcal100: 265, protein100: 8.2, kh100: 48, fett100: 3.8, quelle: "usda" },
    { id: "usda-crispbread", seit: 4, emoji: "🍘", de: "Knäckebrot (Roggen)", en: "Rye Crispbread", kcal100: 330, protein100: 9, kh100: 64, fett100: 1.5, quelle: "usda" },
    { id: "usda-spelt-flakes", seit: 4, emoji: "🥣", de: "Dinkelflocken", en: "Spelt Flakes", kcal100: 344, protein100: 14, kh100: 63, fett100: 2.5, quelle: "usda" },
    { id: "usda-raspberries", seit: 4, emoji: "🫐", de: "Himbeeren", en: "Raspberries", kcal100: 52, protein100: 1.2, kh100: 11.9, fett100: 0.7, quelle: "usda" },
    { id: "usda-blackberries", seit: 4, emoji: "🫐", de: "Brombeeren", en: "Blackberries", kcal100: 43, protein100: 1.4, kh100: 9.6, fett100: 0.5, quelle: "usda" },

    // --- Obst ---
    { id: "usda-pear", seit: 4, emoji: "🍐", de: "Birne", en: "Pear", kcal100: 57, protein100: 0.4, kh100: 15.2, fett100: 0.1, quelle: "usda" },
    { id: "usda-peach", seit: 4, emoji: "🍑", de: "Pfirsich", en: "Peach", kcal100: 39, protein100: 0.9, kh100: 9.5, fett100: 0.3, quelle: "usda" },
    { id: "usda-nectarine", seit: 4, emoji: "🍑", de: "Nektarine", en: "Nectarine", kcal100: 44, protein100: 1.1, kh100: 10.6, fett100: 0.3, quelle: "usda" },
    { id: "usda-plum", seit: 4, emoji: "🫐", de: "Zwetschke / Pflaume", en: "Plum", kcal100: 46, protein100: 0.7, kh100: 11.4, fett100: 0.3, quelle: "usda" },
    { id: "usda-apricot", seit: 4, emoji: "🍑", de: "Marille / Aprikose", en: "Apricot", kcal100: 48, protein100: 1.4, kh100: 11.1, fett100: 0.4, quelle: "usda" },
    { id: "usda-cherries", seit: 4, emoji: "🍒", de: "Kirschen", en: "Cherries", kcal100: 63, protein100: 1.1, kh100: 16, fett100: 0.2, quelle: "usda" },
    { id: "usda-watermelon", seit: 4, emoji: "🍉", de: "Wassermelone", en: "Watermelon", kcal100: 30, protein100: 0.6, kh100: 7.6, fett100: 0.2, quelle: "usda" },
    { id: "usda-honeydew", seit: 4, emoji: "🍈", de: "Honigmelone", en: "Honeydew Melon", kcal100: 36, protein100: 0.5, kh100: 9.1, fett100: 0.1, quelle: "usda" },
    { id: "usda-mandarin", seit: 4, emoji: "🍊", de: "Mandarine", en: "Mandarin", kcal100: 53, protein100: 0.8, kh100: 13.3, fett100: 0.3, quelle: "usda" },
    { id: "usda-grapefruit", seit: 4, emoji: "🍊", de: "Grapefruit", en: "Grapefruit", kcal100: 42, protein100: 0.8, kh100: 10.7, fett100: 0.1, quelle: "usda" },
    { id: "usda-lemon", seit: 4, emoji: "🍋", de: "Zitrone", en: "Lemon", kcal100: 29, protein100: 1.1, kh100: 9.3, fett100: 0.3, quelle: "usda" },
    { id: "usda-pomegranate", seit: 4, emoji: "🔴", de: "Granatapfel", en: "Pomegranate", kcal100: 83, protein100: 1.7, kh100: 18.7, fett100: 1.2, quelle: "usda" },
    { id: "usda-papaya", seit: 4, emoji: "🧡", de: "Papaya", en: "Papaya", kcal100: 43, protein100: 0.5, kh100: 10.8, fett100: 0.3, quelle: "usda" },
    { id: "usda-fig", seit: 4, emoji: "🟣", de: "Feige (frisch)", en: "Fig (fresh)", kcal100: 74, protein100: 0.8, kh100: 19.2, fett100: 0.3, quelle: "usda" },
    { id: "usda-raisins", seit: 4, emoji: "🍇", de: "Rosinen", en: "Raisins", kcal100: 299, protein100: 3.1, kh100: 79.2, fett100: 0.5, quelle: "usda" },
    { id: "usda-cauliflower", seit: 4, emoji: "🥦", de: "Karfiol / Blumenkohl", en: "Cauliflower", kcal100: 25, protein100: 1.9, kh100: 5, fett100: 0.3, quelle: "usda" },
    { id: "usda-peas", seit: 4, emoji: "🫛", de: "Erbsen (TK)", en: "Green Peas (frozen)", kcal100: 77, protein100: 5.2, kh100: 13.6, fett100: 0.4, quelle: "usda" },

    // --- Gemüse ---
    { id: "usda-kohlrabi", seit: 4, emoji: "🥬", de: "Kohlrabi", en: "Kohlrabi", kcal100: 27, protein100: 1.7, kh100: 6.2, fett100: 0.1, quelle: "usda" },
    { id: "usda-beetroot", seit: 4, emoji: "🟣", de: "Rote Rüben", en: "Beetroot", kcal100: 43, protein100: 1.6, kh100: 9.6, fett100: 0.2, quelle: "usda" },
    { id: "usda-redcabbage", seit: 4, emoji: "🥬", de: "Rotkraut", en: "Red Cabbage", kcal100: 31, protein100: 1.4, kh100: 7.4, fett100: 0.2, quelle: "usda" },
    { id: "usda-sauerkraut", seit: 4, emoji: "🥬", de: "Sauerkraut", en: "Sauerkraut", kcal100: 19, protein100: 0.9, kh100: 4.3, fett100: 0.1, quelle: "usda" },
    { id: "usda-brussels", seit: 4, emoji: "🥬", de: "Kohlsprossen / Rosenkohl", en: "Brussels Sprouts", kcal100: 43, protein100: 3.4, kh100: 9, fett100: 0.3, quelle: "usda" },
    { id: "usda-eggplant", seit: 4, emoji: "🍆", de: "Melanzani / Aubergine", en: "Eggplant", kcal100: 25, protein100: 1, kh100: 5.9, fett100: 0.2, quelle: "usda" },

    // ===== Version 5: Kochbuch – Zutaten fürs erste Rezept + Start-Rezepte =====
    // Eiklarpulver & Natron: USDA. Backpulver: Richtwert typischer Packungen (nur in kleinen Mengen relevant).
    { id: "usda-eggwhite-powder", seit: 5, emoji: "🥚", de: "Eiklarpulver", en: "Egg White Powder", kcal100: 382, protein100: 81.1, kh100: 7.8, fett100: 0.3, quelle: "usda" },
    { id: "usda-baking-soda", seit: 5, emoji: "🧂", de: "Natron", en: "Baking Soda", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "usda" },
    { id: "usda-baking-powder", seit: 5, emoji: "🧂", de: "Backpulver", en: "Baking Powder", kcal100: 108, protein100: 0, kh100: 27, fett100: 0, quelle: "richtwert" },

    // Start-Rezepte: Werte pro 100 g rechnet die App aus den Zutaten (hier nur als Rückfallwert).
    // Rezeptidee aus einem Instagram-Kommentar von slona_kawa, Mengen 1:1 übernommen, Temperatur korrigiert.
    {
        id: "rezept-protein-brot", seit: 5, emoji: "🍞",
        de: "Low-Carb Protein-Brot", en: "Low-Carb Protein Bread",
        kcal100: 237.2, protein100: 21.1, kh100: 3, fett100: 15.3, quelle: "rezept: slona_kawa (Instagram)",
        rezept: { zutaten: [ { lebensmittelId: "start-egg-raw", gramm: 220 }, { lebensmittelId: "start-butter", gramm: 100 }, { lebensmittelId: "start-cottage", gramm: 300 }, { lebensmittelId: "usda-eggwhite-powder", gramm: 120 }, { lebensmittelId: "usda-baking-soda", gramm: 10 }, { lebensmittelId: "usda-baking-powder", gramm: 4 } ], gewichtFertig: 0, portionen: 10 },
        anleitung: {
            de: "1. Ofen auf 160 °C vorheizen.\n2. 4 Eier (ca. 220 g), weiche Butter, Hüttenkäse, Eiklarpulver, Natron und Backpulver zu einem glatten Teig verrühren.\n3. Den Teig in eine mit Backpapier ausgelegte Kastenform füllen.\n4. Ca. 35 Minuten backen.\n5. Auskühlen lassen und in 10 Scheiben schneiden.\n\nHinweis: Im Originalrezept stehen 320 °C – gemeint sind sehr wahrscheinlich 320 °F (≈ 160 °C).\nRezeptidee: slona_kawa (Instagram)",
            en: "1. Preheat the oven to 160 °C (320 °F).\n2. Mix 4 eggs (about 220 g), soft butter, cottage cheese, egg white powder, baking soda and baking powder into a smooth batter.\n3. Pour the batter into a loaf pan lined with baking paper.\n4. Bake for about 35 minutes.\n5. Let it cool and cut into 10 slices.\n\nNote: The original recipe says 320 °C – it almost certainly means 320 °F (≈ 160 °C).\nRecipe idea: slona_kawa (Instagram)"
        }
    },

    // ===== Version 6: Creator FitFabi (@fitfabi_graz) =====
    // Mahlzeiten und Mengen aus Fabis eigenen Screenshots (mit seinem Okay).
    // Seine Zutaten-Werte stammen aus seiner Tracking-App und sind hier auf 100 g umgerechnet.
    // Haferflocken und Beeren nutzen vorhandene Einträge mit sehr ähnlichen Werten.
    // Bei Rezepten rechnet die App die Werte selbst aus den Zutaten aus (kcal100: 0 ist nur Platzhalter).
    { id: "fabi-lowcarb-spaghetti", seit: 6, emoji: "🍝", de: "Low-Carb-Spaghetti n°5", en: "Low Carb Spaghetti No. 5", kcal100: 342, protein100: 26, kh100: 49, fett100: 2, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-veganer-lachs", seit: 6, emoji: "🐟", de: "Veganer Lachs", en: "Vegan Salmon Alternative", kcal100: 207, protein100: 15, kh100: 7, fett100: 13, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-kichererbsen-fusilli", seit: 6, emoji: "🍝", de: "Bio Primo Kichererbsen-Fusilli", en: "Bio Primo Chickpea Fusilli", marke: "Bio Primo", kcal100: 365, protein100: 22, kh100: 51, fett100: 6, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-soja-bolognese", seit: 6, emoji: "🥫", de: "Vegetarische Soja-Bolognese", en: "Vegetarian Soy Bolognese", kcal100: 81.1, protein100: 4, kh100: 9.1, fett100: 2.9, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-veggie-hack", seit: 6, emoji: "🌱", de: "Veggie-Hack Erbse & Jackfruit (trocken)", en: "Veggie Mince Pea & Jackfruit (dry)", kcal100: 382.7, protein100: 70.7, kh100: 1.3, fett100: 9.3, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-express-reis", seit: 6, emoji: "🍚", de: "Express-Reis Mediterran", en: "Express Rice Mediterranean", kcal100: 150, protein100: 3.2, kh100: 30.8, fett100: 1.6, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-gemuesebaellchen", seit: 6, emoji: "🧆", de: "Vegane Gemüsebällchen", en: "Vegan Veggie Balls", kcal100: 143, protein100: 10, kh100: 14, fett100: 3.5, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-kartoffeln-vorgegart", seit: 6, emoji: "🥔", de: "Kartoffeln vorgegart", en: "Pre-cooked Potatoes", kcal100: 70, protein100: 2, kh100: 15, fett100: 0.7, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-linseneintopf", seit: 6, emoji: "🍲", de: "Linseneintopf", en: "Lentil Stew", kcal100: 60, protein100: 3.7, kh100: 8.7, fett100: 0.7, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-tofu", seit: 6, emoji: "⬜", de: "Tofu natur (Fabis Werte)", en: "Plain Tofu (Fabi's values)", kcal100: 127, protein100: 13, kh100: 0.7, fett100: 7.7, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-prozis-whey", seit: 6, emoji: "💪", de: "Prozis 100% Whey Prime Vanille", en: "Prozis 100% Whey Prime Vanilla", marke: "Prozis", kcal100: 400, protein100: 85, kh100: 3.3, fett100: 5, quelle: "influencer: fitfabi_graz" },
    { id: "fabi-porridge", seit: 6, emoji: "🥣", de: "Protein-Porridge mit Beeren", en: "Protein Porridge with Berries", influencer: "fitfabi", mahlzeit: "fruehstueck", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: fitfabi_graz",
      rezept: { zutaten: [ { lebensmittelId: "start-oats", gramm: 100 }, { lebensmittelId: "fabi-prozis-whey", gramm: 60 }, { lebensmittelId: "start-berries-frozen", gramm: 50 } ], gewichtFertig: 0, portionen: 1 } },
    { id: "fabi-bolognese", seit: 6, emoji: "🍝", de: "Kichererbsen-Fusilli Bolognese", en: "Chickpea Fusilli Bolognese", influencer: "fitfabi", mahlzeit: "mittag", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: fitfabi_graz",
      rezept: { zutaten: [ { lebensmittelId: "fabi-kichererbsen-fusilli", gramm: 300 }, { lebensmittelId: "fabi-soja-bolognese", gramm: 350 }, { lebensmittelId: "fabi-veggie-hack", gramm: 75 } ], gewichtFertig: 0, portionen: 1 } },
    { id: "fabi-lachs-pasta", seit: 6, emoji: "🍝", de: "Low-Carb-Pasta mit veganem Lachs", en: "Low Carb Pasta with Vegan Salmon", influencer: "fitfabi", mahlzeit: "snack", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: fitfabi_graz",
      rezept: { zutaten: [ { lebensmittelId: "fabi-lowcarb-spaghetti", gramm: 100 }, { lebensmittelId: "fabi-veganer-lachs", gramm: 100 } ], gewichtFertig: 0, portionen: 1 } },
    { id: "fabi-reis-tofu", seit: 6, emoji: "🍚", de: "Mediterraner Reis mit Tofu", en: "Mediterranean Rice with Tofu", influencer: "fitfabi", mahlzeit: "abend", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: fitfabi_graz",
      rezept: { zutaten: [ { lebensmittelId: "fabi-express-reis", gramm: 250 }, { lebensmittelId: "fabi-tofu", gramm: 300 } ], gewichtFertig: 0, portionen: 1 } },
    { id: "fabi-linsen", seit: 6, emoji: "🍲", de: "Linseneintopf mit Gemüsebällchen & Kartoffeln", en: "Lentil Stew with Veggie Balls & Potatoes", influencer: "fitfabi", mahlzeit: "abend", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: fitfabi_graz",
      rezept: { zutaten: [ { lebensmittelId: "fabi-gemuesebaellchen", gramm: 200 }, { lebensmittelId: "fabi-kartoffeln-vorgegart", gramm: 300 }, { lebensmittelId: "fabi-linseneintopf", gramm: 300 } ], gewichtFertig: 0, portionen: 1 } },

    // ===== Version 7: Rezepte von Ivy (@teaxuxu) =====
    // Frischkäse Doppelrahm: USDA (cream cheese). Carnivore-Brot: nur tierische Zutaten.
    { id: "start-creamcheese-full", seit: 7, emoji: "🧀", de: "Frischkäse natur (Doppelrahm)", en: "Cream Cheese (full fat)", kcal100: 342, protein100: 5.9, kh100: 4.1, fett100: 34.2, quelle: "usda" },
    { id: "teaxuxu-carnivore-brot", seit: 7, emoji: "🍞", de: "Carnivore-Brot", en: "Carnivore Bread", influencer: "teaxuxu", mahlzeit: "fruehstueck",
      kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "influencer: teaxuxu",
      rezept: { zutaten: [ { lebensmittelId: "start-egg-raw", gramm: 330 }, { lebensmittelId: "start-creamcheese-full", gramm: 200 }, { lebensmittelId: "usda-eggwhite-powder", gramm: 60 }, { lebensmittelId: "start-parmesan", gramm: 50 }, { lebensmittelId: "start-butter", gramm: 30 } ], gewichtFertig: 0, portionen: 10 },
      anleitung: { de: "1. Ofen auf 170 °C Ober-/Unterhitze vorheizen und eine Kastenform mit Backpapier auslegen.\n2. 6 Eier (ca. 330 g) und den Frischkäse glatt rühren.\n3. Eiklarpulver, geriebenen Parmesan, die geschmolzene Butter und eine Prise Salz unterrühren, bis ein dicker, glatter Teig entsteht.\n4. Den Teig in die Form füllen und glatt streichen.\n5. 30–35 Minuten backen, bis die Oberfläche goldbraun ist und ein Holzstäbchen sauber herauskommt.\n6. Gut auskühlen lassen (das Brot fällt dabei etwas zusammen) und in 10 Scheiben schneiden.\n\nTipp: Wiege das Brot nach dem Backen und trag das Gewicht im Rezept ein – dann stimmen die Werte pro Scheibe noch genauer.", en: "1. Preheat the oven to 170 \u00b0C (top and bottom heat) and line a loaf pan with baking paper.\n2. Whisk 6 eggs (about 330 g) and the cream cheese until smooth.\n3. Stir in the egg white powder, grated parmesan, melted butter and a pinch of salt until you get a thick, smooth batter.\n4. Pour the batter into the pan and smooth the top.\n5. Bake for 30\u201335 minutes until golden and a wooden skewer comes out clean.\n6. Let it cool completely (it sinks a little) and cut into 10 slices.\n\nTip: Weigh the bread after baking and enter the weight in the recipe for even more accurate values per slice." } },

    // ===== Version 8: Große Supermarkt-Erweiterung (Open Food Facts, beliebteste Produkte in Österreich) =====
    // Milch, Pflanzendrinks, Joghurt, Käse, Brot, Müsli, Pizza, Fertiggerichte, Snacks, Getränke, Süßes.
    // Alle Werte pro 100 g/ml, geprüft: kcal ≈ 4·Protein + 4·KH + 9·Fett.
    // --- Milch ---
    { id: "off-4099200029153", seit: 8, emoji: "🥛", de: "Milfina Vollmilch", en: "Milfina Whole Milk", marke: "Milfina", laden: "Hofer", kcal100: 64, protein100: 3.3, kh100: 4.8, fett100: 3.5, quelle: "openfoodfacts:4099200029153" },
    { id: "off-9019100211606", seit: 8, emoji: "🥛", de: "NÖM Vollmilch länger frisch", en: "NÖM Whole Milk (ESL)", marke: "NÖM", kcal100: 64, protein100: 3.3, kh100: 4.7, fett100: 3.5, quelle: "openfoodfacts:9019100211606" },
    { id: "off-9009504007691", seit: 8, emoji: "🥛", de: "Ja! Natürlich Bio-Heublumenmilch", en: "Ja! Natürlich Organic Hay Milk", marke: "Ja! Natürlich", laden: "Billa", kcal100: 67, protein100: 3.3, kh100: 4.8, fett100: 3.8, quelle: "openfoodfacts:9009504007691" },
    { id: "off-4099200030555", seit: 8, emoji: "🥛", de: "Milfina Enjoy free! Milch laktosefrei", en: "Milfina Lactose-free Milk", marke: "Milfina", laden: "Hofer", kcal100: 49, protein100: 3.4, kh100: 4.8, fett100: 1.8, quelle: "openfoodfacts:4099200030555" },
    { id: "off-4099200014111", seit: 8, emoji: "🥛", de: "Zurück zum Ursprung Bergbauern-Heumilch", en: "Zurück zum Ursprung Mountain Hay Milk", marke: "Zurück zum Ursprung", laden: "Hofer", kcal100: 66, protein100: 3.4, kh100: 4.8, fett100: 3.7, quelle: "openfoodfacts:4099200014111" },
    { id: "off-9100000155982", seit: 8, emoji: "🥛", de: "Spar Natur*pur Bergbauern Bio-Vollmilch", en: "Spar Natur*pur Organic Whole Milk", marke: "Spar Natur*pur", laden: "Spar", kcal100: 69, protein100: 3.3, kh100: 4.8, fett100: 4, quelle: "openfoodfacts:9100000155982" },

    // --- Pflanzendrinks ---
    { id: "off-5411188112709", seit: 8, emoji: "🌰", de: "Alpro Mandeldrink geröstet ohne Zucker", en: "Alpro Roasted Almond Unsweetened", marke: "Alpro", kcal100: 13, protein100: 0.4, kh100: 0, fett100: 1.1, quelle: "openfoodfacts:5411188112709" },
    { id: "off-9020200017616", seit: 8, emoji: "🌰", de: "Joya Mandel Drink", en: "Joya Almond Drink", marke: "Joya", kcal100: 14, protein100: 0.4, kh100: 0.1, fett100: 1.2, quelle: "openfoodfacts:9020200017616" },
    { id: "off-5411188116592", seit: 8, emoji: "🥥", de: "Alpro Kokosdrink", en: "Alpro Coconut Drink", marke: "Alpro", kcal100: 20, protein100: 0.1, kh100: 2.7, fett100: 0.8, quelle: "openfoodfacts:5411188116592" },
    { id: "off-5411188115472", seit: 8, emoji: "🌱", de: "Alpro Sojadrink Original", en: "Alpro Soya Drink Original", marke: "Alpro", kcal100: 39, protein100: 3, kh100: 2.5, fett100: 1.8, quelle: "openfoodfacts:5411188115472" },
    { id: "off-5411188115533", seit: 8, emoji: "🌱", de: "Alpro Sojadrink Vanille", en: "Alpro Soya Drink Vanilla", marke: "Alpro", kcal100: 57, protein100: 3, kh100: 6.7, fett100: 1.8, quelle: "openfoodfacts:5411188115533" },
    { id: "off-5411188115458", seit: 8, emoji: "🍫", de: "Alpro Sojadrink Schoko", en: "Alpro Soya Drink Chocolate", marke: "Alpro", kcal100: 61, protein100: 3.1, kh100: 7.9, fett100: 1.8, quelle: "openfoodfacts:5411188115458" },
    { id: "off-5411188134985", seit: 8, emoji: "🌱", de: "Alpro Not Milk", en: "Alpro Not Milk", marke: "Alpro", kcal100: 59, protein100: 0.7, kh100: 5.7, fett100: 3.5, quelle: "openfoodfacts:5411188134985" },
    { id: "off-7394376615894", seit: 8, emoji: "🌾", de: "Oatly Haferdrink Original", en: "Oatly Oat Drink Original", marke: "Oatly", kcal100: 39, protein100: 1.1, kh100: 7.2, fett100: 0.5, quelle: "openfoodfacts:7394376615894" },
    { id: "off-7394376616129", seit: 8, emoji: "🌾", de: "Oatly Haferdrink Calcium", en: "Oatly Oat Drink Calcium", marke: "Oatly", kcal100: 45, protein100: 1, kh100: 6.5, fett100: 1.5, quelle: "openfoodfacts:7394376616129" },
    { id: "off-9020200030974", seit: 8, emoji: "🌾", de: "Happy Oats Barista Haferdrink", en: "Happy Oats Barista Oat Drink", marke: "Happy Oats", kcal100: 58, protein100: 0.6, kh100: 8.1, fett100: 2.6, quelle: "openfoodfacts:9020200030974" },
    { id: "off-4061462786051", seit: 8, emoji: "🌾", de: "Just Veg! Barista Hafer-Drink", en: "Just Veg! Barista Oat Drink", marke: "Just Veg!", laden: "Hofer", kcal100: 58, protein100: 0.6, kh100: 8.1, fett100: 2.6, quelle: "openfoodfacts:4061462786051" },
    { id: "off-4099200240268", seit: 8, emoji: "🌾", de: "Zurück zum Ursprung Hafer-Drink Natur", en: "Zurück zum Ursprung Oat Drink", marke: "Zurück zum Ursprung", laden: "Hofer", kcal100: 42, protein100: 0.8, kh100: 7.6, fett100: 0.8, quelle: "openfoodfacts:4099200240268" },
    { id: "off-4056489244707", seit: 8, emoji: "🥥", de: "Vemondo Bio Kokos-Reis-Drink", en: "Vemondo Organic Coconut Rice Drink", marke: "Vemondo", laden: "Lidl", kcal100: 23, protein100: 0.1, kh100: 2.7, fett100: 1.3, quelle: "openfoodfacts:4056489244707" },

    // --- Joghurt ---
    { id: "off-20917920", seit: 8, emoji: "🥣", de: "Milbona Griechisches Joghurt 2 %", en: "Milbona Greek Yogurt 2%", marke: "Milbona", laden: "Lidl", kcal100: 58, protein100: 6, kh100: 4, fett100: 2, quelle: "openfoodfacts:20917920" },
    { id: "off-4099200017303", seit: 8, emoji: "🥣", de: "Lyttos Griechisches Joghurt 2 %", en: "Lyttos Greek Yogurt 2%", marke: "Lyttos", laden: "Hofer", kcal100: 71, protein100: 8.7, kh100: 4.5, fett100: 2, quelle: "openfoodfacts:4099200017303" },
    { id: "off-9066001253501", seit: 8, emoji: "🥣", de: "Schärdinger Joghurt natur", en: "Schärdinger Plain Yogurt", marke: "Schärdinger", kcal100: 68, protein100: 4, kh100: 4.1, fett100: 4, quelle: "openfoodfacts:9066001253501" },
    { id: "off-9100000988078", seit: 8, emoji: "🥣", de: "Spar Bio-Naturjoghurt 3,6 %", en: "Spar Organic Plain Yogurt 3.6%", marke: "Spar", laden: "Spar", kcal100: 65, protein100: 3.8, kh100: 3.9, fett100: 3.6, quelle: "openfoodfacts:9100000988078" },
    { id: "off-9100000157269", seit: 8, emoji: "🥥", de: "Spar Natur*pur Bio-Kokos natur (vegan)", en: "Spar Natur*pur Organic Coconut Yogurt Alternative", marke: "Spar Natur*pur", laden: "Spar", kcal100: 97, protein100: 1.4, kh100: 5.1, fett100: 7.7, quelle: "openfoodfacts:9100000157269" },
    { id: "off-9007971840704", seit: 8, emoji: "🍓", de: "Ehrmann Almighurt", en: "Ehrmann Almighurt", marke: "Ehrmann", kcal100: 110, protein100: 3.1, kh100: 15, fett100: 4.2, quelle: "openfoodfacts:9007971840704" },
    { id: "off-4014500059570", seit: 8, emoji: "🍒", de: "Zott Sahne-Joghurt Amarena-Kirsche", en: "Zott Cream Yogurt Amarena Cherry", marke: "Zott", kcal100: 134, protein100: 2.5, kh100: 11.9, fett100: 8.1, quelle: "openfoodfacts:4014500059570" },
    { id: "off-4009700036995", seit: 8, emoji: "🍒", de: "Danone Activia Kirsche", en: "Danone Activia Cherry", marke: "Danone", kcal100: 88, protein100: 3.9, kh100: 11.7, fett100: 2.9, quelle: "openfoodfacts:4009700036995" },
    { id: "off-4009700072573", seit: 8, emoji: "🫐", de: "Danone Activia 100 % pflanzlich Heidelbeere", en: "Danone Activia Plant-based Blueberry", marke: "Danone", kcal100: 64, protein100: 3.7, kh100: 6.2, fett100: 2.2, quelle: "openfoodfacts:4009700072573" },
    { id: "off-4009700074720", seit: 8, emoji: "🥛", de: "Danone Actimel Classic", en: "Danone Actimel Classic", marke: "Danone", kcal100: 73, protein100: 3, kh100: 10.8, fett100: 1.6, quelle: "openfoodfacts:4009700074720" },
    { id: "off-9035000007224", seit: 8, emoji: "💪", de: "Danone MyPRO+ Heidelbeere", en: "Danone MyPRO+ Blueberry", marke: "Danone", kcal100: 56, protein100: 9.3, kh100: 3.6, fett100: 0.1, quelle: "openfoodfacts:9035000007224" },
    { id: "off-5411188119098", seit: 8, emoji: "🥥", de: "Alpro Natur mit Kokosnuss", en: "Alpro Plain with Coconut", marke: "Alpro", kcal100: 54, protein100: 3.9, kh100: 2.4, fett100: 2.8, quelle: "openfoodfacts:5411188119098" },
    { id: "off-5411188118121", seit: 8, emoji: "🌱", de: "Alpro Soja-Joghurtalternative ungesüßt", en: "Alpro Soya Plain Unsweetened", marke: "Alpro", kcal100: 42, protein100: 4, kh100: 0, fett100: 2.3, quelle: "openfoodfacts:5411188118121" },
    { id: "off-5411188128588", seit: 8, emoji: "🌱", de: "Alpro Skyr Style ungesüßt", en: "Alpro Skyr Style Unsweetened", marke: "Alpro", kcal100: 61, protein100: 5.8, kh100: 0, fett100: 3.3, quelle: "openfoodfacts:5411188128588" },
    { id: "off-5411188125808", seit: 8, emoji: "🥭", de: "Alpro Mango ohne Zuckerzusatz", en: "Alpro Mango No Added Sugar", marke: "Alpro", kcal100: 62, protein100: 3.7, kh100: 6, fett100: 2.2, quelle: "openfoodfacts:5411188125808" },
    { id: "off-5411188126416", seit: 8, emoji: "🫐", de: "Alpro Soja Blaubeere", en: "Alpro Soya Blueberry", marke: "Alpro", kcal100: 69, protein100: 3.7, kh100: 8.1, fett100: 2.2, quelle: "openfoodfacts:5411188126416" },

    // --- Skyr ---
    { id: "off-4056489090045", seit: 8, emoji: "🥣", de: "Milbona Skyr natur", en: "Milbona Skyr Plain", marke: "Milbona", laden: "Lidl", kcal100: 57, protein100: 8.9, kh100: 4.6, fett100: 0.2, quelle: "openfoodfacts:4056489090045" },
    { id: "off-4056489118206", seit: 8, emoji: "🍓", de: "Milbona Skyr Erdbeere", en: "Milbona Skyr Strawberry", marke: "Milbona", laden: "Lidl", kcal100: 56, protein100: 8.9, kh100: 4.5, fett100: 0.2, quelle: "openfoodfacts:4056489118206" },
    { id: "off-4099200141411", seit: 8, emoji: "🥣", de: "Desira Skyr natur", en: "Desira Skyr Plain", marke: "Desira", laden: "Hofer", kcal100: 62, protein100: 11, kh100: 4, fett100: 0.2, quelle: "openfoodfacts:4099200141411" },
    { id: "off-4019300168095", seit: 8, emoji: "🥣", de: "Exquisa Milder Skyr", en: "Exquisa Mild Skyr", marke: "Exquisa", kcal100: 64, protein100: 11, kh100: 4, fett100: 0.2, quelle: "openfoodfacts:4019300168095" },
    { id: "off-9100000444178", seit: 8, emoji: "🥣", de: "Spar Bio-Skyr natur", en: "Spar Organic Skyr Plain", marke: "Spar", laden: "Spar", kcal100: 62, protein100: 11, kh100: 4, fett100: 0.2, quelle: "openfoodfacts:9100000444178" },
    { id: "off-9100000007540", seit: 8, emoji: "🥣", de: "S-Budget Skyr", en: "S-Budget Skyr", marke: "S-Budget", laden: "Spar", kcal100: 58, protein100: 9.5, kh100: 4, fett100: 0.5, quelle: "openfoodfacts:9100000007540" },
    { id: "off-9010158015024", seit: 8, emoji: "🥣", de: "Ja! Natürlich Bio-Skyr natur", en: "Ja! Natürlich Organic Skyr", marke: "Ja! Natürlich", laden: "Billa", kcal100: 58, protein100: 9.5, kh100: 4, fett100: 0.5, quelle: "openfoodfacts:9010158015024" },

    // --- Topfen ---
    { id: "off-20001940", seit: 8, emoji: "🥣", de: "Milbona Speisequark 20 %", en: "Milbona Quark 20%", marke: "Milbona", laden: "Lidl", kcal100: 97, protein100: 10.3, kh100: 3.7, fett100: 4.3, quelle: "openfoodfacts:20001940" },
    { id: "off-9100000021508", seit: 8, emoji: "🥣", de: "Spar Magertopfen", en: "Spar Low-fat Quark", marke: "Spar", laden: "Spar", kcal100: 72, protein100: 14, kh100: 4.1, fett100: 0.5, quelle: "openfoodfacts:9100000021508" },
    { id: "off-4099200029139", seit: 8, emoji: "🥣", de: "Milfina Magertopfen", en: "Milfina Low-fat Quark", marke: "Milfina", laden: "Hofer", kcal100: 72, protein100: 14, kh100: 4.1, fett100: 0.2, quelle: "openfoodfacts:4099200029139" },
    { id: "off-9009504007998", seit: 8, emoji: "🥣", de: "Clever Speisetopfen mager", en: "Clever Low-fat Quark", marke: "Clever", laden: "Billa", kcal100: 71, protein100: 12.5, kh100: 4.1, fett100: 0.2, quelle: "openfoodfacts:9009504007998" },
    { id: "off-4099200029184", seit: 8, emoji: "🥣", de: "Milfina Speisetopfen 20 %", en: "Milfina Quark 20%", marke: "Milfina", laden: "Hofer", kcal100: 98, protein100: 11, kh100: 3.7, fett100: 4.4, quelle: "openfoodfacts:4099200029184" },
    { id: "off-9004584040415", seit: 8, emoji: "🥣", de: "Ja! Natürlich Bio-Speisetopfen mager", en: "Ja! Natürlich Organic Low-fat Quark", marke: "Ja! Natürlich", laden: "Billa", kcal100: 70, protein100: 12, kh100: 4.1, fett100: 0.5, quelle: "openfoodfacts:9004584040415" },
    { id: "off-9011600003187", seit: 8, emoji: "🧀", de: "Wojnar's Liptauer scharf", en: "Wojnar's Liptauer Spread (spicy)", marke: "Wojnar's", kcal100: 205, protein100: 8.4, kh100: 4.7, fett100: 17, quelle: "openfoodfacts:9011600003187" },

    // --- Pudding ---
    { id: "off-4002971243703", seit: 8, emoji: "🍫", de: "Ehrmann High Protein Pudding Schoko", en: "Ehrmann High Protein Pudding Chocolate", marke: "Ehrmann", kcal100: 76, protein100: 10, kh100: 5.5, fett100: 3, quelle: "openfoodfacts:4002971243703" },
    { id: "off-4002971243901", seit: 8, emoji: "🍮", de: "Ehrmann High Protein Pudding Karamell", en: "Ehrmann High Protein Pudding Caramel", marke: "Ehrmann", kcal100: 76, protein100: 10, kh100: 5.5, fett100: 1.5, quelle: "openfoodfacts:4002971243901" },
    { id: "off-4002971244007", seit: 8, emoji: "☕", de: "Ehrmann High Protein Pudding Kaffee", en: "Ehrmann High Protein Pudding Coffee", marke: "Ehrmann", kcal100: 76, protein100: 10, kh100: 5.7, fett100: 1.5, quelle: "openfoodfacts:4002971244007" },
    { id: "off-5411188137887", seit: 8, emoji: "🍮", de: "Alpro High Protein Dessert Vanille", en: "Alpro High Protein Dessert Vanilla", marke: "Alpro", kcal100: 95, protein100: 10, kh100: 7.7, fett100: 2.5, quelle: "openfoodfacts:5411188137887" },
    { id: "off-5411188137863", seit: 8, emoji: "🍫", de: "Alpro High Protein Dessert Schoko", en: "Alpro High Protein Dessert Chocolate", marke: "Alpro", kcal100: 97, protein100: 10.2, kh100: 7, fett100: 2.9, quelle: "openfoodfacts:5411188137863" },
    { id: "off-4000521027421", seit: 8, emoji: "🍮", de: "Dr. Oetker High Protein Grießpudding", en: "Dr. Oetker High Protein Semolina Pudding", marke: "Dr. Oetker", kcal100: 92, protein100: 5.5, kh100: 11, fett100: 1.4, quelle: "openfoodfacts:4000521027421" },
    { id: "off-4056489109709", seit: 8, emoji: "🍫", de: "Milbona Schoko-Pudding mit Sahne", en: "Milbona Chocolate Pudding with Cream", marke: "Milbona", laden: "Lidl", kcal100: 101, protein100: 3.1, kh100: 15.7, fett100: 2.7, quelle: "openfoodfacts:4056489109709" },
    { id: "off-4000521465407", seit: 8, emoji: "🍫", de: "Dr. Oetker Paradies Creme Schoko", en: "Dr. Oetker Paradise Cream Chocolate", marke: "Dr. Oetker", kcal100: 121, protein100: 3.7, kh100: 18, fett100: 3.5, quelle: "openfoodfacts:4000521465407" },

    // --- Käse ---
    { id: "off-7622300315733", seit: 8, emoji: "🧀", de: "Philadelphia Original", en: "Philadelphia Original", marke: "Philadelphia", kcal100: 225, protein100: 5.4, kh100: 4.3, fett100: 21, quelle: "openfoodfacts:7622300315733" },
    { id: "off-7622300318147", seit: 8, emoji: "🧀", de: "Philadelphia Balance", en: "Philadelphia Light", marke: "Philadelphia", kcal100: 147, protein100: 7.4, kh100: 5.2, fett100: 11, quelle: "openfoodfacts:7622300318147" },
    { id: "off-7622300318116", seit: 8, emoji: "🧀", de: "Philadelphia Kräuter", en: "Philadelphia Herbs", marke: "Philadelphia", kcal100: 212, protein100: 5.2, kh100: 4.5, fett100: 19, quelle: "openfoodfacts:7622300318116" },
    { id: "off-4019300097005", seit: 8, emoji: "🧀", de: "Exquisa Körniger Frischkäse", en: "Exquisa Cottage Cheese", marke: "Exquisa", kcal100: 65, protein100: 13, kh100: 1, fett100: 0.8, quelle: "openfoodfacts:4019300097005" },
    { id: "off-9006548353005", seit: 8, emoji: "🧀", de: "Schärdinger Landfrischkäse natur", en: "Schärdinger Country Cream Cheese", marke: "Schärdinger", kcal100: 97, protein100: 11, kh100: 3, fett100: 4.5, quelle: "openfoodfacts:9006548353005" },
    { id: "off-9006548353104", seit: 8, emoji: "🧀", de: "Schärdinger Landfrischkäse Schnittlauch", en: "Schärdinger Country Cream Cheese Chives", marke: "Schärdinger", kcal100: 97, protein100: 11, kh100: 3, fett100: 4.5, quelle: "openfoodfacts:9006548353104" },
    { id: "off-8000430138931", seit: 8, emoji: "🧀", de: "Galbani Burrata", en: "Galbani Burrata", marke: "Galbani", kcal100: 256, protein100: 8, kh100: 2, fett100: 24, quelle: "openfoodfacts:8000430138931" },
    { id: "off-3073780902366", seit: 8, emoji: "🧀", de: "Babybel Original", en: "Babybel Original", marke: "Babybel", kcal100: 295, protein100: 22, kh100: 0, fett100: 23, quelle: "openfoodfacts:3073780902366" },
    { id: "off-3023260005100", seit: 8, emoji: "🧀", de: "Salakis Schafkäse natur", en: "Salakis Sheep Cheese", marke: "Salakis", kcal100: 272, protein100: 16, kh100: 0.8, fett100: 23, quelle: "openfoodfacts:3023260005100" },
    { id: "off-4056489010630", seit: 8, emoji: "🧀", de: "Milbona Emmentaler gerieben", en: "Milbona Grated Emmental", marke: "Milbona", laden: "Lidl", kcal100: 370, protein100: 27, kh100: 2.6, fett100: 28, quelle: "openfoodfacts:4056489010630" },
    { id: "off-9100000747569", seit: 8, emoji: "🧀", de: "S-Budget Gouda in Scheiben", en: "S-Budget Gouda Slices", marke: "S-Budget", laden: "Spar", kcal100: 358, protein100: 23, kh100: 0.5, fett100: 29, quelle: "openfoodfacts:9100000747569" },
    { id: "off-9010158003502", seit: 8, emoji: "🧀", de: "Clever Gouda", en: "Clever Gouda", marke: "Clever", laden: "Billa", kcal100: 338, protein100: 26, kh100: 0, fett100: 26, quelle: "openfoodfacts:9010158003502" },
    { id: "off-8003518106211", seit: 8, emoji: "🧀", de: "Grana Padano gerieben", en: "Grana Padano Grated", marke: "Grana Padano", kcal100: 398, protein100: 33, kh100: 0, fett100: 29, quelle: "openfoodfacts:8003518106211" },
    { id: "off-9100000736556", seit: 8, emoji: "🧀", de: "Spar Mozzarella", en: "Spar Mozzarella", marke: "Spar", laden: "Spar", kcal100: 234, protein100: 17, kh100: 1, fett100: 18, quelle: "openfoodfacts:9100000736556" },
    { id: "off-4056489126836", seit: 8, emoji: "🧀", de: "Lovilio Mozzarella light", en: "Lovilio Mozzarella Light", marke: "Lovilio", laden: "Lidl", kcal100: 157, protein100: 19, kh100: 1, fett100: 8.5, quelle: "openfoodfacts:4056489126836" },
    { id: "off-9100000719849", seit: 8, emoji: "🧀", de: "Spar Vital Mozzarella light", en: "Spar Vital Mozzarella Light", marke: "Spar Vital", laden: "Spar", kcal100: 188, protein100: 19, kh100: 1, fett100: 12, quelle: "openfoodfacts:9100000719849" },
    { id: "off-4099200019673", seit: 8, emoji: "🧀", de: "Milfina Mozzarella gerieben", en: "Milfina Grated Mozzarella", marke: "Milfina", laden: "Hofer", kcal100: 319, protein100: 25, kh100: 3, fett100: 23, quelle: "openfoodfacts:4099200019673" },
    { id: "off-4099200018836", seit: 8, emoji: "🧀", de: "Cucina Nobile Mozzarella Classico", en: "Cucina Nobile Mozzarella", marke: "Cucina Nobile", laden: "Hofer", kcal100: 250, protein100: 18, kh100: 1.5, fett100: 19, quelle: "openfoodfacts:4099200018836" },
    { id: "off-9010158005148", seit: 8, emoji: "🧀", de: "Ja! Natürlich Bio-Mozzarella", en: "Ja! Natürlich Organic Mozzarella", marke: "Ja! Natürlich", laden: "Billa", kcal100: 234, protein100: 17, kh100: 1, fett100: 18, quelle: "openfoodfacts:9010158005148" },
    { id: "off-4061458047173", seit: 8, emoji: "🧀", de: "Cucina Nobile Mascarpone", en: "Cucina Nobile Mascarpone", marke: "Cucina Nobile", laden: "Hofer", kcal100: 394, protein100: 6, kh100: 2.5, fett100: 40, quelle: "openfoodfacts:4061458047173" },

    // --- Rahm & Butter ---
    { id: "off-4099200029115", seit: 8, emoji: "🥛", de: "Milfina Sauerrahm 15 %", en: "Milfina Sour Cream 15%", marke: "Milfina", laden: "Hofer", kcal100: 160, protein100: 3, kh100: 3.2, fett100: 15, quelle: "openfoodfacts:4099200029115" },
    { id: "off-9019100617101", seit: 8, emoji: "🥛", de: "NÖM Schlagobers", en: "NÖM Whipping Cream", marke: "NÖM", kcal100: 346, protein100: 2.2, kh100: 3.3, fett100: 36, quelle: "openfoodfacts:9019100617101" },
    { id: "off-9100000020761", seit: 8, emoji: "🥛", de: "Spar Crème fraîche natur", en: "Spar Crème Fraîche", marke: "Spar", laden: "Spar", kcal100: 309, protein100: 2.3, kh100: 2.3, fett100: 32, quelle: "openfoodfacts:9100000020761" },
    { id: "off-9006286000261", seit: 8, emoji: "🥛", de: "QimiQ natur", en: "QimiQ Plain", marke: "QimiQ", kcal100: 169, protein100: 4.5, kh100: 4, fett100: 15, quelle: "openfoodfacts:9006286000261" },
    { id: "off-9100000021102", seit: 8, emoji: "🧈", de: "Spar Teebutter", en: "Spar Butter", marke: "Spar", laden: "Spar", kcal100: 743, protein100: 0.6, kh100: 0.6, fett100: 82, quelle: "openfoodfacts:9100000021102" },
    { id: "off-4099200021201", seit: 8, emoji: "🧈", de: "Milfina Teebutter", en: "Milfina Butter", marke: "Milfina", laden: "Hofer", kcal100: 744, protein100: 0.7, kh100: 0.7, fett100: 78.5, quelle: "openfoodfacts:4099200021201" },
    { id: "off-4001954161348", seit: 8, emoji: "🧈", de: "Kerrygold Butter mit Meersalz", en: "Kerrygold Butter with Sea Salt", marke: "Kerrygold", kcal100: 725, protein100: 0.6, kh100: 0.6, fett100: 80, quelle: "openfoodfacts:4001954161348" },
    { id: "off-8719200053922", seit: 8, emoji: "🧈", de: "Rama mit Meersalz", en: "Rama with Sea Salt", marke: "Rama", kcal100: 622, protein100: 0.5, kh100: 0.6, fett100: 70, quelle: "openfoodfacts:8719200053922" },
    { id: "off-8719200101432", seit: 8, emoji: "🌱", de: "Flora Plant Butter", en: "Flora Plant Butter", marke: "Flora", kcal100: 699, protein100: 0.4, kh100: 0.4, fett100: 79, quelle: "openfoodfacts:8719200101432" },

    // --- Brot ---
    { id: "off-6410500090014", seit: 8, emoji: "🍞", de: "Finn Crisp Original", en: "Finn Crisp Original", marke: "Finn Crisp", kcal100: 350, protein100: 10, kh100: 61, fett100: 2.6, quelle: "openfoodfacts:6410500090014" },
    { id: "off-7300400114714", seit: 8, emoji: "🍞", de: "Wasa Vollkorn Roggen", en: "Wasa Whole Grain Rye", marke: "Wasa", kcal100: 330, protein100: 9, kh100: 60, fett100: 1.5, quelle: "openfoodfacts:7300400114714" },
    { id: "off-7300400255905", seit: 8, emoji: "🍞", de: "Wasa Knäckebrot Sesam", en: "Wasa Sesame Crispbread", marke: "Wasa", kcal100: 403, protein100: 13, kh100: 63, fett100: 9.5, quelle: "openfoodfacts:7300400255905" },
    { id: "off-4099200010281", seit: 8, emoji: "🍞", de: "Happy Harvest Roggenvollkorn-Knäckebrot", en: "Happy Harvest Rye Crispbread", marke: "Happy Harvest", laden: "Hofer", kcal100: 349, protein100: 12, kh100: 64, fett100: 1.6, quelle: "openfoodfacts:4099200010281" },
    { id: "off-4056489018636", seit: 8, emoji: "🌯", de: "Snack Day Vollkorn-Tortilla-Wraps", en: "Snack Day Wholemeal Tortilla Wraps", marke: "Snack Day", laden: "Lidl", kcal100: 309, protein100: 10, kh100: 53, fett100: 7.6, quelle: "openfoodfacts:4056489018636" },
    { id: "off-7311310312879", seit: 8, emoji: "🌯", de: "Santa Maria Soft Tortilla Wraps", en: "Santa Maria Soft Tortilla Wraps", marke: "Santa Maria", kcal100: 292, protein100: 8, kh100: 53.2, fett100: 4.7, quelle: "openfoodfacts:7311310312879" },
    { id: "off-4071800001012", seit: 8, emoji: "🍞", de: "Harry Vital + Fit", en: "Harry Vital + Fit Bread", marke: "Harry", kcal100: 241, protein100: 7.7, kh100: 35, fett100: 4.9, quelle: "openfoodfacts:4071800001012" },
    { id: "off-4071800000879", seit: 8, emoji: "🍞", de: "Harry 1688 Unser Mildes", en: "Harry 1688 Mild Wheat-Rye Bread", marke: "Harry", kcal100: 242, protein100: 7.5, kh100: 45, fett100: 2.7, quelle: "openfoodfacts:4071800000879" },
    { id: "off-4061458045827", seit: 8, emoji: "🍞", de: "Goldähren Sandwichtoast Saaten", en: "Goldähren Seeded Sandwich Toast", marke: "Goldähren", laden: "Hofer", kcal100: 298, protein100: 9.5, kh100: 41, fett100: 9.5, quelle: "openfoodfacts:4061458045827" },
    { id: "off-9100000136967", seit: 8, emoji: "🍞", de: "S-Budget Toastbrot", en: "S-Budget Toast Bread", marke: "S-Budget", laden: "Spar", kcal100: 213, protein100: 7.7, kh100: 41, fett100: 1.4, quelle: "openfoodfacts:9100000136967" },
    { id: "off-9005300019159", seit: 8, emoji: "🍞", de: "Ölz Vollkorn-Toast", en: "Ölz Wholemeal Toast", marke: "Ölz", kcal100: 235, protein100: 8.8, kh100: 37, fett100: 4.1, quelle: "openfoodfacts:9005300019159" },
    { id: "off-9010437300223", seit: 8, emoji: "🍞", de: "Billa Bio Roggen-Vollkornbrot", en: "Billa Organic Rye Wholegrain Bread", marke: "Billa Bio", laden: "Billa", kcal100: 202, protein100: 6, kh100: 38, fett100: 1.1, quelle: "openfoodfacts:9010437300223" },
    { id: "off-4000446001018", seit: 8, emoji: "🍞", de: "Mestemacher Pumpernickel", en: "Mestemacher Pumpernickel", marke: "Mestemacher", kcal100: 181, protein100: 4.6, kh100: 32.8, fett100: 1, quelle: "openfoodfacts:4000446001018" },
    { id: "off-9100000772240", seit: 8, emoji: "🍘", de: "Spar Natur*pur Reiswaffeln", en: "Spar Natur*pur Rice Cakes", marke: "Spar Natur*pur", laden: "Spar", kcal100: 350, protein100: 6.7, kh100: 72, fett100: 3.3, quelle: "openfoodfacts:9100000772240" },

    // --- Müsli ---
    { id: "off-40897677", seit: 8, emoji: "🥣", de: "Crownfield Haferflocken zart", en: "Crownfield Fine Oats", marke: "Crownfield", laden: "Lidl", kcal100: 371, protein100: 13.2, kh100: 59.5, fett100: 6.7, quelle: "openfoodfacts:40897677" },
    { id: "off-9100000441207", seit: 8, emoji: "🥣", de: "Spar Natur*pur Haferflocken zart", en: "Spar Natur*pur Fine Oats", marke: "Spar Natur*pur", laden: "Spar", kcal100: 370, protein100: 13, kh100: 59, fett100: 7, quelle: "openfoodfacts:9100000441207" },
    { id: "off-9003740076190", seit: 8, emoji: "🥣", de: "Ja! Natürlich Bio-Haferflocken grob", en: "Ja! Natürlich Organic Rolled Oats", marke: "Ja! Natürlich", laden: "Billa", kcal100: 372, protein100: 14, kh100: 59, fett100: 7, quelle: "openfoodfacts:9003740076190" },
    { id: "off-4099200211329", seit: 8, emoji: "🥣", de: "Zurück zum Ursprung Großblatt-Haferflocken", en: "Zurück zum Ursprung Jumbo Oats", marke: "Zurück zum Ursprung", laden: "Hofer", kcal100: 370, protein100: 13, kh100: 59, fett100: 7, quelle: "openfoodfacts:4099200211329" },
    { id: "off-4000521662103", seit: 8, emoji: "🥣", de: "Vitalis Knuspermüsli weniger süß", en: "Vitalis Crunchy Muesli Less Sweet", marke: "Vitalis", kcal100: 435, protein100: 11, kh100: 57, fett100: 15, quelle: "openfoodfacts:4000521662103" },
    { id: "off-9003740095009", seit: 8, emoji: "🥣", de: "Ja! Natürlich Basismüsli", en: "Ja! Natürlich Basic Muesli", marke: "Ja! Natürlich", laden: "Billa", kcal100: 352, protein100: 12, kh100: 58, fett100: 5.5, quelle: "openfoodfacts:9003740095009" },
    { id: "off-9010158017486", seit: 8, emoji: "🥣", de: "Billa Bio Hafer-Crunchy-Müsli", en: "Billa Organic Oat Crunchy Muesli", marke: "Billa Bio", laden: "Billa", kcal100: 437, protein100: 11, kh100: 61, fett100: 15, quelle: "openfoodfacts:9010158017486" },
    { id: "off-9120009600269", seit: 8, emoji: "🥣", de: "Zagler Bio Naked Müsli", en: "Zagler Organic Naked Muesli", marke: "Zagler", kcal100: 370, protein100: 12, kh100: 58, fett100: 7.3, quelle: "openfoodfacts:9120009600269" },
    { id: "off-3387390339499", seit: 8, emoji: "🥣", de: "Nestlé Fitness Cerealien", en: "Nestlé Fitness Cereal", marke: "Nestlé", kcal100: 372, protein100: 9.9, kh100: 75.4, fett100: 1.5, quelle: "openfoodfacts:3387390339499" },
    { id: "off-7613033212949", seit: 8, emoji: "🍫", de: "Nestlé Nesquik Cerealien", en: "Nestlé Nesquik Cereal", marke: "Nestlé", kcal100: 377, protein100: 8.5, kh100: 75.2, fett100: 2.8, quelle: "openfoodfacts:7613033212949" },
    { id: "off-4058172307348", seit: 8, emoji: "🥣", de: "dmBio Cornflakes ungesüßt", en: "dmBio Cornflakes Unsweetened", marke: "dmBio", laden: "dm", kcal100: 371, protein100: 8, kh100: 80, fett100: 1, quelle: "openfoodfacts:4058172307348" },
    { id: "off-4104420018709", seit: 8, emoji: "🥣", de: "Alnatura Dinkel gepufft", en: "Alnatura Puffed Spelt", marke: "Alnatura", kcal100: 391, protein100: 9.7, kh100: 78, fett100: 3, quelle: "openfoodfacts:4104420018709" },

    // --- Pizza ---
    { id: "off-4001724038993", seit: 8, emoji: "🍕", de: "Dr. Oetker Ristorante Pizza Tonno", en: "Dr. Oetker Ristorante Pizza Tonno", marke: "Dr. Oetker", kcal100: 227, protein100: 10, kh100: 23, fett100: 9.7, quelle: "openfoodfacts:4001724038993" },
    { id: "off-4001724819103", seit: 8, emoji: "🍕", de: "Dr. Oetker Ristorante Pizza Funghi", en: "Dr. Oetker Ristorante Pizza Funghi", marke: "Dr. Oetker", kcal100: 231, protein100: 7.6, kh100: 22, fett100: 12, quelle: "openfoodfacts:4001724819103" },
    { id: "off-4001724819202", seit: 8, emoji: "🍕", de: "Dr. Oetker Ristorante Pizza Prosciutto", en: "Dr. Oetker Ristorante Pizza Prosciutto", marke: "Dr. Oetker", kcal100: 228, protein100: 9.9, kh100: 24, fett100: 9.9, quelle: "openfoodfacts:4001724819202" },
    { id: "off-4001724819905", seit: 8, emoji: "🍕", de: "Dr. Oetker Ristorante Pizza Vegetale", en: "Dr. Oetker Ristorante Pizza Vegetable", marke: "Dr. Oetker", kcal100: 190, protein100: 6.9, kh100: 21.9, fett100: 7.7, quelle: "openfoodfacts:4001724819905" },
    { id: "off-4001724039082", seit: 8, emoji: "🍕", de: "Dr. Oetker Ristorante Pizza Hawaii", en: "Dr. Oetker Ristorante Pizza Hawaii", marke: "Dr. Oetker", kcal100: 208, protein100: 8.7, kh100: 25, fett100: 7.6, quelle: "openfoodfacts:4001724039082" },
    { id: "off-4001724040842", seit: 8, emoji: "🍕", de: "Dr. Oetker La Mia Pinsa Rindersalami", en: "Dr. Oetker La Mia Pinsa Beef Salami", marke: "Dr. Oetker", kcal100: 225, protein100: 8.5, kh100: 36, fett100: 5.8, quelle: "openfoodfacts:4001724040842" },
    { id: "off-4009233006847", seit: 8, emoji: "🍕", de: "Wagner Die Backfrische Mozzarella", en: "Wagner Die Backfrische Mozzarella", marke: "Wagner", kcal100: 213, protein100: 10.2, kh100: 26.3, fett100: 7, quelle: "openfoodfacts:4009233006847" },
    { id: "off-7613035925489", seit: 8, emoji: "🍕", de: "Wagner Steinofen Pizza Salami", en: "Wagner Stone Oven Pizza Salami", marke: "Wagner", kcal100: 252, protein100: 10.9, kh100: 27.6, fett100: 10.4, quelle: "openfoodfacts:7613035925489" },
    { id: "off-4009233003655", seit: 8, emoji: "🍕", de: "Wagner Steinofen Pizza Diavolo", en: "Wagner Stone Oven Pizza Diavolo", marke: "Wagner", kcal100: 231, protein100: 9.7, kh100: 25.5, fett100: 9.5, quelle: "openfoodfacts:4009233003655" },
    { id: "off-8015673029946", seit: 8, emoji: "🍕", de: "Italpizza 5 Formaggi", en: "Italpizza 5 Cheese", marke: "Italpizza", kcal100: 237, protein100: 11, kh100: 25, fett100: 10, quelle: "openfoodfacts:8015673029946" },
    { id: "off-9100000450254", seit: 8, emoji: "🍕", de: "Spar Pizza Vegetariana", en: "Spar Vegetarian Pizza", marke: "Spar", laden: "Spar", kcal100: 205, protein100: 8.2, kh100: 27, fett100: 6.5, quelle: "openfoodfacts:9100000450254" },
    { id: "off-4099200053905", seit: 8, emoji: "🍕", de: "Cucina Nobile Steinofenpizza", en: "Cucina Nobile Stone Oven Pizza", marke: "Cucina Nobile", laden: "Hofer", kcal100: 232, protein100: 9.8, kh100: 26, fett100: 9.3, quelle: "openfoodfacts:4099200053905" },
    { id: "off-20206734", seit: 8, emoji: "🍕", de: "Villa Gusto Steinofen-Pizza Thunfisch", en: "Villa Gusto Stone Oven Pizza Tuna", marke: "Villa Gusto", laden: "Lidl", kcal100: 235, protein100: 10.4, kh100: 28.4, fett100: 8.5, quelle: "openfoodfacts:20206734" },
    { id: "off-4061464437760", seit: 8, emoji: "🍕", de: "Pizz'ah Pinsa gegrilltes Gemüse", en: "Pizz'ah Pinsa Grilled Vegetables", marke: "Pizz'ah", laden: "Hofer", kcal100: 216, protein100: 8.1, kh100: 29, fett100: 7.1, quelle: "openfoodfacts:4061464437760" },

    // --- Fertiggerichte & Vorrat ---
    { id: "off-4250241203524", seit: 8, emoji: "🐟", de: "Iglo Fischstäbchen", en: "Iglo Fish Fingers", marke: "Iglo", kcal100: 203, protein100: 13, kh100: 18, fett100: 8.6, quelle: "openfoodfacts:4250241203524" },
    { id: "off-4056489318408", seit: 8, emoji: "🍗", de: "Lidl Chicken Nuggets", en: "Lidl Chicken Nuggets", marke: "Lidl", laden: "Lidl", kcal100: 230, protein100: 10.9, kh100: 16.5, fett100: 13, quelle: "openfoodfacts:4056489318408" },
    { id: "off-4056489009214", seit: 8, emoji: "🥟", de: "Baresa Tortellini Prosciutto Crudo", en: "Baresa Tortellini Prosciutto Crudo", marke: "Baresa", laden: "Lidl", kcal100: 291, protein100: 13, kh100: 45, fett100: 6.1, quelle: "openfoodfacts:4056489009214" },
    { id: "off-20622381", seit: 8, emoji: "🫘", de: "Freshona Linsen (Dose)", en: "Freshona Lentils (canned)", marke: "Freshona", laden: "Lidl", kcal100: 88, protein100: 6.3, kh100: 12.7, fett100: 0.5, quelle: "openfoodfacts:20622381" },
    { id: "off-8715700131139", seit: 8, emoji: "🫘", de: "Heinz Baked Beans", en: "Heinz Baked Beans", marke: "Heinz", kcal100: 81, protein100: 4.8, kh100: 15.5, fett100: 0.4, quelle: "openfoodfacts:8715700131139" },
    { id: "off-20113476", seit: 8, emoji: "🌶️", de: "El Tequito Chili con Carne", en: "El Tequito Chili con Carne", marke: "El Tequito", laden: "Lidl", kcal100: 88, protein100: 4.8, kh100: 6.9, fett100: 3.9, quelle: "openfoodfacts:20113476" },
    { id: "off-8004030860001", seit: 8, emoji: "🐟", de: "Rio Mare Insalatissime Couscous & Thunfisch", en: "Rio Mare Insalatissime Couscous & Tuna", marke: "Rio Mare", kcal100: 244, protein100: 9, kh100: 15, fett100: 16, quelle: "openfoodfacts:8004030860001" },
    { id: "off-20117122", seit: 8, emoji: "🐟", de: "Fjord Krone Thunfisch im eigenen Saft", en: "Fjord Krone Tuna in Own Juice", marke: "Fjord Krone", laden: "Lidl", kcal100: 118, protein100: 26, kh100: 0, fett100: 1.5, quelle: "openfoodfacts:20117122" },
    { id: "off-5011157630175", seit: 8, emoji: "🍚", de: "Tilda Basmati Reis (roh)", en: "Tilda Basmati Rice (dry)", marke: "Tilda", kcal100: 351, protein100: 7.8, kh100: 77.7, fett100: 0.8, quelle: "openfoodfacts:5011157630175" },
    { id: "off-4099200121567", seit: 8, emoji: "🍲", de: "Primana Gulaschsuppe", en: "Primana Goulash Soup", marke: "Primana", laden: "Hofer", kcal100: 83, protein100: 5.3, kh100: 5.9, fett100: 4.1, quelle: "openfoodfacts:4099200121567" },
    { id: "off-9000275611513", seit: 8, emoji: "🍲", de: "Knorr Hühnersuppe mit Nudeln", en: "Knorr Chicken Noodle Soup", marke: "Knorr", kcal100: 41, protein100: 2.6, kh100: 4.4, fett100: 1.3, quelle: "openfoodfacts:9000275611513" },
    { id: "off-9100000994826", seit: 8, emoji: "🌯", de: "Spar Falafel-Wrap", en: "Spar Falafel Wrap", marke: "Spar", laden: "Spar", kcal100: 240, protein100: 6.1, kh100: 32, fett100: 8.8, quelle: "openfoodfacts:9100000994826" },
    { id: "off-9002233059511", seit: 8, emoji: "🌯", de: "Billa Freshy Wrap Caesar Huhn", en: "Billa Freshy Caesar Chicken Wrap", marke: "Billa", laden: "Billa", kcal100: 216, protein100: 9, kh100: 25, fett100: 8.3, quelle: "openfoodfacts:9002233059511" },

    // --- Nudeln & Saucen ---
    { id: "off-8076800105056", seit: 8, emoji: "🍝", de: "Barilla Spaghetti Nr. 5", en: "Barilla Spaghetti No. 5", marke: "Barilla", kcal100: 359, protein100: 13, kh100: 71, fett100: 2, quelle: "openfoodfacts:8076800105056" },
    { id: "off-8076802085738", seit: 8, emoji: "🍝", de: "Barilla Penne Rigate", en: "Barilla Penne Rigate", marke: "Barilla", kcal100: 359, protein100: 13, kh100: 71, fett100: 2, quelle: "openfoodfacts:8076802085738" },
    { id: "off-8076802085981", seit: 8, emoji: "🍝", de: "Barilla Fusilli", en: "Barilla Fusilli", marke: "Barilla", kcal100: 359, protein100: 13, kh100: 71, fett100: 2, quelle: "openfoodfacts:8076802085981" },
    { id: "off-8076809529419", seit: 8, emoji: "🍝", de: "Barilla Spaghetti Integrale (Vollkorn)", en: "Barilla Whole Wheat Spaghetti", marke: "Barilla", kcal100: 347, protein100: 13, kh100: 64, fett100: 2.5, quelle: "openfoodfacts:8076809529419" },
    { id: "off-20995751", seit: 8, emoji: "🍝", de: "Combino Bio Vollkorn-Penne", en: "Combino Organic Wholemeal Penne", marke: "Combino", laden: "Lidl", kcal100: 343, protein100: 13, kh100: 65, fett100: 1.9, quelle: "openfoodfacts:20995751" },
    { id: "off-8076809513722", seit: 8, emoji: "🍅", de: "Barilla Sauce Basilico", en: "Barilla Basilico Sauce", marke: "Barilla", kcal100: 64, protein100: 1.6, kh100: 7.6, fett100: 2.6, quelle: "openfoodfacts:8076809513722" },
    { id: "off-8076809513678", seit: 8, emoji: "🍅", de: "Barilla Sauce Bolognese", en: "Barilla Bolognese Sauce", marke: "Barilla", kcal100: 86, protein100: 4.2, kh100: 7.5, fett100: 4, quelle: "openfoodfacts:8076809513678" },
    { id: "off-8076809513388", seit: 8, emoji: "🌶️", de: "Barilla Sauce Arrabbiata", en: "Barilla Arrabbiata Sauce", marke: "Barilla", kcal100: 60, protein100: 1.4, kh100: 5.5, fett100: 3.1, quelle: "openfoodfacts:8076809513388" },
    { id: "off-8076809523547", seit: 8, emoji: "🌿", de: "Barilla Pesto Rosso", en: "Barilla Pesto Rosso", marke: "Barilla", kcal100: 329, protein100: 3.8, kh100: 12, fett100: 29, quelle: "openfoodfacts:8076809523547" },
    { id: "off-20425555", seit: 8, emoji: "🌿", de: "Italiamo Pesto alla Genovese", en: "Italiamo Pesto Genovese", marke: "Italiamo", laden: "Lidl", kcal100: 470, protein100: 5, kh100: 7.7, fett100: 46, quelle: "openfoodfacts:20425555" },
    { id: "off-8715700016504", seit: 8, emoji: "🍅", de: "Heinz Tomato Ketchup", en: "Heinz Tomato Ketchup", marke: "Heinz", kcal100: 102, protein100: 1.2, kh100: 23.2, fett100: 0.1, quelle: "openfoodfacts:8715700016504" },
    { id: "off-8715035110205", seit: 8, emoji: "🥢", de: "Kikkoman Sojasauce", en: "Kikkoman Soy Sauce", marke: "Kikkoman", kcal100: 77, protein100: 10, kh100: 3.2, fett100: 0, quelle: "openfoodfacts:8715035110205" },
    { id: "off-8853662056012", seit: 8, emoji: "🌶️", de: "Sriracha Sauce scharf", en: "Sriracha Hot Sauce", marke: "Exotic Food", kcal100: 139, protein100: 2.3, kh100: 28, fett100: 1.2, quelle: "openfoodfacts:8853662056012" },

    // --- Wurst & Schinken ---
    { id: "off-9001455033057", seit: 8, emoji: "🥓", de: "Berger Wellness-Schinken", en: "Berger Wellness Ham", marke: "Berger", kcal100: 102, protein100: 20, kh100: 0.5, fett100: 2, quelle: "openfoodfacts:9001455033057" },
    { id: "off-20027810", seit: 8, emoji: "🥓", de: "Wiesenthaler Toastschinken", en: "Wiesenthaler Toast Ham", marke: "Wiesenthaler", laden: "Lidl", kcal100: 106, protein100: 19, kh100: 0.7, fett100: 3, quelle: "openfoodfacts:20027810" },
    { id: "off-4061458145077", seit: 8, emoji: "🥓", de: "Gut Drei Eichen Koch-Hinterschinken", en: "Gut Drei Eichen Cooked Ham", marke: "Gut Drei Eichen", laden: "Hofer", kcal100: 103, protein100: 20, kh100: 1, fett100: 2, quelle: "openfoodfacts:4061458145077" },
    { id: "off-9001369002521", seit: 8, emoji: "🦃", de: "Stastnik Putenbrust geräuchert", en: "Stastnik Smoked Turkey Breast", marke: "Stastnik", kcal100: 99, protein100: 19, kh100: 3.1, fett100: 1.2, quelle: "openfoodfacts:9001369002521" },
    { id: "off-4099200043944", seit: 8, emoji: "🌭", de: "Landhof Extrawurst", en: "Landhof Extrawurst (Austrian Sausage)", marke: "Landhof", laden: "Hofer", kcal100: 245, protein100: 11, kh100: 2.9, fett100: 21, quelle: "openfoodfacts:4099200043944" },
    { id: "off-4099200043456", seit: 8, emoji: "🦃", de: "Hütthaler Feine Putenextra", en: "Hütthaler Turkey Extrawurst", marke: "Hütthaler", laden: "Hofer", kcal100: 191, protein100: 12, kh100: 2, fett100: 15, quelle: "openfoodfacts:4099200043456" },
    { id: "off-4061458016377", seit: 8, emoji: "🥓", de: "Gut Drei Eichen Schwarzwälder Schinken", en: "Gut Drei Eichen Black Forest Ham", marke: "Gut Drei Eichen", laden: "Hofer", kcal100: 243, protein100: 26, kh100: 1, fett100: 15, quelle: "openfoodfacts:4061458016377" },
    { id: "off-9100200101246", seit: 8, emoji: "🌭", de: "Tann Käsekrainer", en: "Tann Cheese Sausage", marke: "Tann", laden: "Spar", kcal100: 290, protein100: 20, kh100: 0.7, fett100: 23, quelle: "openfoodfacts:9100200101246" },

    // --- Vegan & Vegetarisch ---
    { id: "off-1230000068017", seit: 8, emoji: "🍔", de: "Beyond Burger", en: "Beyond Burger", marke: "Beyond Meat", kcal100: 196, protein100: 16, kh100: 5.6, fett100: 12, quelle: "openfoodfacts:1230000068017" },
    { id: "off-7613036915076", seit: 8, emoji: "🍔", de: "Garden Gourmet Sensational Burger", en: "Garden Gourmet Sensational Burger", marke: "Garden Gourmet", kcal100: 197, protein100: 14, kh100: 1.9, fett100: 13.5, quelle: "openfoodfacts:7613036915076" },
    { id: "off-7290111562396", seit: 8, emoji: "🌱", de: "Garden Gourmet Vegane Filet-Stücke", en: "Garden Gourmet Vegan Fillet Pieces", marke: "Garden Gourmet", kcal100: 149, protein100: 22.5, kh100: 1.2, fett100: 4.7, quelle: "openfoodfacts:7290111562396" },
    { id: "off-7649994063504", seit: 8, emoji: "🌱", de: "planted.chicken natur", en: "planted.chicken Plain", marke: "planted", kcal100: 144, protein100: 24, kh100: 1.8, fett100: 3.4, quelle: "openfoodfacts:7649994063504" },
    { id: "off-7610227935219", seit: 8, emoji: "🌱", de: "The Green Mountain Filet Hähnchen-Art", en: "The Green Mountain Plant-based Chicken Fillet", marke: "The Green Mountain", kcal100: 155, protein100: 12, kh100: 5.1, fett100: 8.3, quelle: "openfoodfacts:7610227935219" },
    { id: "off-9100000739489", seit: 8, emoji: "⬜", de: "Spar Veggie Bio-Tofu geräuchert", en: "Spar Veggie Organic Smoked Tofu", marke: "Spar Veggie", laden: "Spar", kcal100: 158, protein100: 18, kh100: 2.3, fett100: 8.6, quelle: "openfoodfacts:9100000739489" },
    { id: "off-9009865002731", seit: 8, emoji: "🌱", de: "Vegavita Soja-Schnetzel (trocken)", en: "Vegavita Soy Chunks (dry)", marke: "Vegavita", laden: "Billa", kcal100: 332, protein100: 49, kh100: 27, fett100: 1.2, quelle: "openfoodfacts:9009865002731" },
    { id: "off-9010437015820", seit: 8, emoji: "🌱", de: "Vegavita Pulled Chunks", en: "Vegavita Pulled Chunks", marke: "Vegavita", laden: "Billa", kcal100: 225, protein100: 27, kh100: 5, fett100: 9.7, quelle: "openfoodfacts:9010437015820" },

    // --- Protein ---
    { id: "off-4066447083972", seit: 8, emoji: "💪", de: "dm Sportness Proteinriegel 34 % Peanut Caramel", en: "dm Sportness Protein Bar 34% Peanut Caramel", marke: "dm Sportness", laden: "dm", kcal100: 373, protein100: 34, kh100: 26, fett100: 17, quelle: "openfoodfacts:4066447083972" },
    { id: "off-7340001803129", seit: 8, emoji: "💪", de: "Barebells Protein Bar Crunchy Fudge", en: "Barebells Protein Bar Crunchy Fudge", marke: "Barebells", kcal100: 370, protein100: 36, kh100: 33, fett100: 15, quelle: "openfoodfacts:7340001803129" },
    { id: "off-4260446586148", seit: 8, emoji: "💪", de: "Hej Crispy Protein Bar Brownie", en: "Hej Crispy Protein Bar Brownie", marke: "Hej", kcal100: 369, protein100: 34.4, kh100: 37.7, fett100: 14.5, quelle: "openfoodfacts:4260446586148" },
    { id: "off-4260363487214", seit: 8, emoji: "💪", de: "Foodspring Vegan Protein Bar", en: "Foodspring Vegan Protein Bar", marke: "Foodspring", kcal100: 331, protein100: 30, kh100: 24, fett100: 8.3, quelle: "openfoodfacts:4260363487214" },
    { id: "off-9100000904122", seit: 8, emoji: "💪", de: "Spar Hafer-Riegel Erdnuss-Kakao (Protein)", en: "Spar Oat Bar Peanut Cocoa (Protein)", marke: "Spar", laden: "Spar", kcal100: 407, protein100: 20.4, kh100: 46, fett100: 14, quelle: "openfoodfacts:9100000904122" },
    { id: "off-4058172510939", seit: 8, emoji: "💪", de: "dm Sportness Proteinpulver neutral", en: "dm Sportness Protein Powder Neutral", marke: "dm Sportness", laden: "dm", kcal100: 388, protein100: 87, kh100: 4, fett100: 2.6, quelle: "openfoodfacts:4058172510939" },
    { id: "off-4058172216527", seit: 8, emoji: "💪", de: "dm Sportness Whey Himbeer-Joghurt", en: "dm Sportness Whey Raspberry Yogurt", marke: "dm Sportness", laden: "dm", kcal100: 359, protein100: 80.8, kh100: 3.4, fett100: 2.2, quelle: "openfoodfacts:4058172216527" },
    { id: "off-4260744952133", seit: 8, emoji: "💪", de: "nu3 Vegan Protein", en: "nu3 Vegan Protein", marke: "nu3", kcal100: 390, protein100: 71, kh100: 5.3, fett100: 8.2, quelle: "openfoodfacts:4260744952133" },
    { id: "off-7610095231406", seit: 8, emoji: "💪", de: "Zweifel Vaya Protein Snack Paprika", en: "Zweifel Vaya Protein Snack Paprika", marke: "Zweifel", kcal100: 424, protein100: 21, kh100: 54, fett100: 12, quelle: "openfoodfacts:7610095231406" },

    // --- Getränke ---
    { id: "off-5449000000439", seit: 8, emoji: "🥤", de: "Coca-Cola Original", en: "Coca-Cola Original", marke: "Coca-Cola", kcal100: 42, protein100: 0, kh100: 10.6, fett100: 0, quelle: "openfoodfacts:5449000000439" },
    { id: "off-5449000131836", seit: 8, emoji: "🥤", de: "Coca-Cola Zero", en: "Coca-Cola Zero", marke: "Coca-Cola", kcal100: 0, protein100: 0, kh100: 0, fett100: 0, quelle: "openfoodfacts:5449000131836" },
    { id: "off-5449000006271", seit: 8, emoji: "🥤", de: "Fanta Orange", en: "Fanta Orange", marke: "Fanta", kcal100: 48, protein100: 0, kh100: 11.7, fett100: 0, quelle: "openfoodfacts:5449000006271" },
    { id: "off-90162800", seit: 8, emoji: "⚡", de: "Red Bull Sugarfree", en: "Red Bull Sugarfree", marke: "Red Bull", kcal100: 2, protein100: 0, kh100: 0, fett100: 0, quelle: "openfoodfacts:90162800" },
    { id: "off-90433689", seit: 8, emoji: "⚡", de: "Red Bull Edition", en: "Red Bull Edition", marke: "Red Bull", kcal100: 45, protein100: 0, kh100: 11, fett100: 0, quelle: "openfoodfacts:90433689" },
    { id: "off-5060337501972", seit: 8, emoji: "⚡", de: "Monster Energy Ultra", en: "Monster Energy Ultra", marke: "Monster", kcal100: 2, protein100: 0, kh100: 0.9, fett100: 0, quelle: "openfoodfacts:5060337501972" },
    { id: "off-4029764001807", seit: 8, emoji: "🥤", de: "Club-Mate Original", en: "Club-Mate Original", marke: "Club-Mate", kcal100: 20, protein100: 0, kh100: 5, fett100: 0, quelle: "openfoodfacts:4029764001807" },
    { id: "off-90087066", seit: 8, emoji: "🍊", de: "Rauch Happy Day 100 % Orange", en: "Rauch Happy Day 100% Orange", marke: "Rauch", kcal100: 44, protein100: 0.7, kh100: 8.7, fett100: 0.5, quelle: "openfoodfacts:90087066" },
    { id: "off-90087011", seit: 8, emoji: "🍎", de: "Rauch Happy Day Apfel", en: "Rauch Happy Day Apple", marke: "Rauch", kcal100: 46, protein100: 0.5, kh100: 11, fett100: 0.5, quelle: "openfoodfacts:90087011" },
    { id: "off-9006900205652", seit: 8, emoji: "🍊", de: "Pfanner Bio-Orangensaft", en: "Pfanner Organic Orange Juice", marke: "Pfanner", kcal100: 43, protein100: 0.7, kh100: 9, fett100: 0.5, quelle: "openfoodfacts:9006900205652" },
    { id: "off-5038862138161", seit: 8, emoji: "🥥", de: "Innocent Kokoswasser", en: "Innocent Coconut Water", marke: "Innocent", kcal100: 14, protein100: 0, kh100: 3.5, fett100: 0, quelle: "openfoodfacts:5038862138161" },
    { id: "off-5760466920537", seit: 8, emoji: "☕", de: "Starbucks Caffè Latte (Kühlregal)", en: "Starbucks Caffè Latte (chilled)", marke: "Starbucks", kcal100: 70, protein100: 2.8, kh100: 8.7, fett100: 2.4, quelle: "openfoodfacts:5760466920537" },
    { id: "off-9019100787408", seit: 8, emoji: "☕", de: "NÖM Wiener Eiskaffee", en: "NÖM Viennese Iced Coffee", marke: "NÖM", kcal100: 54, protein100: 1.7, kh100: 7.8, fett100: 1.8, quelle: "openfoodfacts:9019100787408" },
    { id: "off-90280153", seit: 8, emoji: "🫖", de: "Carpe Diem Kombucha Classic", en: "Carpe Diem Kombucha Classic", marke: "Carpe Diem", kcal100: 24, protein100: 0.5, kh100: 5.8, fett100: 0.5, quelle: "openfoodfacts:90280153" },

    // --- Süßes ---
    { id: "off-80050865", seit: 8, emoji: "🍫", de: "Nutella", en: "Nutella", marke: "Ferrero", kcal100: 539, protein100: 6.3, kh100: 57.5, fett100: 30.9, quelle: "openfoodfacts:80050865" },
    { id: "off-7622210693280", seit: 8, emoji: "🍫", de: "Milka Alpenmilch", en: "Milka Alpine Milk", marke: "Milka", kcal100: 539, protein100: 6.5, kh100: 57, fett100: 31, quelle: "openfoodfacts:7622210693280" },
    { id: "off-3045140118502", seit: 8, emoji: "🍫", de: "Milka Ganze Nuss", en: "Milka Whole Hazelnuts", marke: "Milka", kcal100: 563, protein100: 8.2, kh100: 47, fett100: 37, quelle: "openfoodfacts:3045140118502" },
    { id: "off-3046920022606", seit: 8, emoji: "🍫", de: "Lindt Excellence 85 % Kakao", en: "Lindt Excellence 85% Cocoa", marke: "Lindt", kcal100: 584, protein100: 12.5, kh100: 22, fett100: 46, quelle: "openfoodfacts:3046920022606" },
    { id: "off-20995553", seit: 8, emoji: "🍫", de: "J.D. Gross Edelbitter 85 %", en: "J.D. Gross Dark 85%", marke: "J.D. Gross", laden: "Lidl", kcal100: 576, protein100: 11.2, kh100: 21.6, fett100: 47.2, quelle: "openfoodfacts:20995553" },
    { id: "off-4000417702005", seit: 8, emoji: "🍫", de: "Ritter Sport Dunkle Voll-Nuss", en: "Ritter Sport Dark Whole Hazelnut", marke: "Ritter Sport", kcal100: 577, protein100: 8.4, kh100: 39, fett100: 41, quelle: "openfoodfacts:4000417702005" },
    { id: "off-9000331604275", seit: 8, emoji: "🧇", de: "Manner Original Neapolitaner Schnitten", en: "Manner Original Wafers", marke: "Manner", kcal100: 526, protein100: 8.1, kh100: 52, fett100: 31, quelle: "openfoodfacts:9000331604275" },
    { id: "off-4008400260921", seit: 8, emoji: "🍫", de: "Kinder Country", en: "Kinder Country", marke: "Ferrero", kcal100: 561, protein100: 8.6, kh100: 54.9, fett100: 33.8, quelle: "openfoodfacts:4008400260921" },
    { id: "off-4008400191423", seit: 8, emoji: "🍫", de: "Milchschnitte", en: "Milk Slice", marke: "Ferrero", kcal100: 421, protein100: 7.9, kh100: 34, fett100: 27.9, quelle: "openfoodfacts:4008400191423" },
    { id: "off-4008400221021", seit: 8, emoji: "🍫", de: "Kinder Maxi", en: "Kinder Maxi", marke: "Ferrero", kcal100: 566, protein100: 8.7, kh100: 53.5, fett100: 35, quelle: "openfoodfacts:4008400221021" },
    { id: "off-40084015", seit: 8, emoji: "🍫", de: "Duplo", en: "Duplo", marke: "Ferrero", kcal100: 551, protein100: 6.1, kh100: 56, fett100: 33, quelle: "openfoodfacts:40084015" },
    { id: "off-4014400400007", seit: 8, emoji: "🍬", de: "Toffifee", en: "Toffifee", marke: "Storck", kcal100: 520, protein100: 6, kh100: 58.9, fett100: 29, quelle: "openfoodfacts:4014400400007" },
    { id: "off-4008400183022", seit: 8, emoji: "🥥", de: "Raffaello", en: "Raffaello", marke: "Ferrero", kcal100: 627, protein100: 7.4, kh100: 38.6, fett100: 48.3, quelle: "openfoodfacts:4008400183022" },
    { id: "off-5000159031103", seit: 8, emoji: "🍫", de: "Maltesers", en: "Maltesers", marke: "Mars", kcal100: 504, protein100: 8.5, kh100: 62, fett100: 25, quelle: "openfoodfacts:5000159031103" },
    { id: "off-5900951028502", seit: 8, emoji: "🍫", de: "Twix", en: "Twix", marke: "Mars", kcal100: 494, protein100: 4.4, kh100: 65, fett100: 24, quelle: "openfoodfacts:5900951028502" },
    { id: "off-5000159419123", seit: 8, emoji: "🍫", de: "Balisto Honig-Mandel", en: "Balisto Honey Almond", marke: "Mars", kcal100: 518, protein100: 6.7, kh100: 59, fett100: 28, quelle: "openfoodfacts:5000159419123" },
    { id: "off-4017100122910", seit: 8, emoji: "🍪", de: "Leibniz Butterkeks 30 % weniger Zucker", en: "Leibniz Butter Biscuit 30% Less Sugar", marke: "Leibniz", kcal100: 442, protein100: 8.5, kh100: 70, fett100: 9.6, quelle: "openfoodfacts:4017100122910" },
    { id: "off-5410126006339", seit: 8, emoji: "🍪", de: "Lotus Biscoff", en: "Lotus Biscoff", marke: "Lotus", kcal100: 484, protein100: 4.9, kh100: 72.6, fett100: 19, quelle: "openfoodfacts:5410126006339" },
    { id: "off-7622300165628", seit: 8, emoji: "🍪", de: "Oreo Mini", en: "Oreo Mini", marke: "Oreo", kcal100: 476, protein100: 5.1, kh100: 68, fett100: 20, quelle: "openfoodfacts:7622300165628" },
    { id: "off-9002975302838", seit: 8, emoji: "🍬", de: "Haribo Goldbären", en: "Haribo Gold Bears", marke: "Haribo", kcal100: 343, protein100: 6.9, kh100: 77, fett100: 0.5, quelle: "openfoodfacts:9002975302838" },
    { id: "off-8712566328352", seit: 8, emoji: "🍦", de: "Magnum Classic", en: "Magnum Classic", marke: "Magnum", kcal100: 217, protein100: 2.3, kh100: 22, fett100: 13, quelle: "openfoodfacts:8712566328352" },
    { id: "off-8711327373105", seit: 8, emoji: "🍦", de: "Ben & Jerry's Cookie Dough", en: "Ben & Jerry's Cookie Dough", marke: "Ben & Jerry's", kcal100: 273, protein100: 4.1, kh100: 31, fett100: 15, quelle: "openfoodfacts:8711327373105" },
    { id: "off-5027324001839", seit: 8, emoji: "🍡", de: "Little Moons Mochi Mango & Passionsfrucht", en: "Little Moons Mochi Mango & Passion Fruit", marke: "Little Moons", kcal100: 241, protein100: 1.5, kh100: 38, fett100: 9.4, quelle: "openfoodfacts:5027324001839" },
    { id: "off-9001432047541", seit: 8, emoji: "🍑", de: "Darbo Marille 1/3 weniger Zucker", en: "Darbo Apricot 1/3 Less Sugar", marke: "Darbo", kcal100: 135, protein100: 0.7, kh100: 32, fett100: 0, quelle: "openfoodfacts:9001432047541" },
    { id: "off-9001432039058", seit: 8, emoji: "🍓", de: "Darbo Himbeer-Marmelade", en: "Darbo Raspberry Jam", marke: "Darbo", kcal100: 219, protein100: 0.6, kh100: 53, fett100: 0, quelle: "openfoodfacts:9001432039058" },
    { id: "off-4099200177977", seit: 8, emoji: "🍯", de: "Grandessa Blütenhonig", en: "Grandessa Blossom Honey", marke: "Grandessa", laden: "Hofer", kcal100: 302, protein100: 0.4, kh100: 75, fett100: 0, quelle: "openfoodfacts:4099200177977" },
    { id: "off-0037600106412", seit: 8, emoji: "🥜", de: "Skippy Erdnusscreme Extra Crunchy", en: "Skippy Extra Crunchy Peanut Butter", marke: "Skippy", kcal100: 603, protein100: 27.5, kh100: 15.6, fett100: 43.9, quelle: "openfoodfacts:0037600106412" },
    { id: "off-8410076601216", seit: 8, emoji: "🍫", de: "Nature Valley Crunchy Hafer & Honig", en: "Nature Valley Crunchy Oats & Honey", marke: "Nature Valley", kcal100: 456, protein100: 8.1, kh100: 64.5, fett100: 17.2, quelle: "openfoodfacts:8410076601216" },

    // --- Salzig & Nüsse ---
    { id: "off-5053990138722", seit: 8, emoji: "🥔", de: "Pringles Original", en: "Pringles Original", marke: "Pringles", kcal100: 534, protein100: 5.9, kh100: 56, fett100: 31, quelle: "openfoodfacts:5053990138722" },
    { id: "off-5053990138753", seit: 8, emoji: "🥔", de: "Pringles Sour Cream & Onion", en: "Pringles Sour Cream & Onion", marke: "Pringles", kcal100: 536, protein100: 4.6, kh100: 56, fett100: 32, quelle: "openfoodfacts:5053990138753" },
    { id: "off-7610095014009", seit: 8, emoji: "🥔", de: "Zweifel Paprika Chips", en: "Zweifel Paprika Chips", marke: "Zweifel", kcal100: 544, protein100: 5.5, kh100: 51, fett100: 34, quelle: "openfoodfacts:7610095014009" },
    { id: "off-4003586102072", seit: 8, emoji: "🥔", de: "Funny-frisch Ofen Chips Paprika", en: "Funny-frisch Oven Chips Paprika", marke: "Funny-frisch", kcal100: 405, protein100: 6.1, kh100: 72, fett100: 9.2, quelle: "openfoodfacts:4003586102072" },
    { id: "off-9000159019893", seit: 8, emoji: "🍿", de: "Kelly's Golden Pop Popcorn", en: "Kelly's Golden Pop Popcorn", marke: "Kelly's", kcal100: 414, protein100: 8.3, kh100: 40, fett100: 18, quelle: "openfoodfacts:9000159019893" },
    { id: "off-9000189000625", seit: 8, emoji: "🥨", de: "Kelly's Soletti", en: "Kelly's Soletti Salt Sticks", marke: "Kelly's", kcal100: 378, protein100: 12, kh100: 73, fett100: 3.1, quelle: "openfoodfacts:9000189000625" },
    { id: "off-5410041001204", seit: 8, emoji: "🍘", de: "Tuc Original", en: "Tuc Original Crackers", marke: "Tuc", kcal100: 482, protein100: 8.3, kh100: 67, fett100: 19, quelle: "openfoodfacts:5410041001204" },
    { id: "off-8410076481597", seit: 8, emoji: "🌮", de: "Old El Paso Tortilla Nachips", en: "Old El Paso Tortilla Nachips", marke: "Old El Paso", kcal100: 492, protein100: 7.8, kh100: 59, fett100: 23.6, quelle: "openfoodfacts:8410076481597" },
    { id: "off-7610095231505", seit: 8, emoji: "🫘", de: "Zweifel Vaya Bean Snack Salt", en: "Zweifel Vaya Bean Snack Salt", marke: "Zweifel", kcal100: 424, protein100: 17, kh100: 57, fett100: 13, quelle: "openfoodfacts:7610095231505" },
    { id: "off-20267605", seit: 8, emoji: "🥜", de: "Alesto Cashewkerne", en: "Alesto Cashews", marke: "Alesto", laden: "Lidl", kcal100: 600, protein100: 20.5, kh100: 19.8, fett100: 47.6, quelle: "openfoodfacts:20267605" },
    { id: "off-20005733", seit: 8, emoji: "🥜", de: "Alesto Walnusskerne", en: "Alesto Walnuts", marke: "Alesto", laden: "Lidl", kcal100: 712, protein100: 15.5, kh100: 3.7, fett100: 69.1, quelle: "openfoodfacts:20005733" },
    { id: "off-20133214", seit: 8, emoji: "🥜", de: "Alesto Pistazienkerne geröstet ohne Salz", en: "Alesto Roasted Unsalted Pistachios", marke: "Alesto", laden: "Lidl", kcal100: 605, protein100: 26.5, kh100: 10.3, fett100: 49.2, quelle: "openfoodfacts:20133214" },
    { id: "off-9100000698168", seit: 8, emoji: "🥜", de: "S-Budget Jumbo Erdnüsse", en: "S-Budget Jumbo Peanuts", marke: "S-Budget", laden: "Spar", kcal100: 613, protein100: 26, kh100: 11, fett100: 51, quelle: "openfoodfacts:9100000698168" },
    { id: "off-4008258185001", seit: 8, emoji: "🍒", de: "Seeberger Cranberries", en: "Seeberger Cranberries", marke: "Seeberger", kcal100: 338, protein100: 0.3, kh100: 78, fett100: 1.3, quelle: "openfoodfacts:4008258185001" },
    { id: "off-9100000800523", seit: 8, emoji: "🌴", de: "Spar Natur*pur Datteln", en: "Spar Natur*pur Dates", marke: "Spar Natur*pur", laden: "Spar", kcal100: 293, protein100: 1.9, kh100: 65, fett100: 0.5, quelle: "openfoodfacts:9100000800523" },

    // --- TK-Gemüse ---
    { id: "off-9000143017126", seit: 8, emoji: "🫛", de: "Iglo Junge Erbsen", en: "Iglo Young Peas", marke: "Iglo", kcal100: 70, protein100: 4.9, kh100: 9, fett100: 0.6, quelle: "openfoodfacts:9000143017126" },
    { id: "off-8000920602812", seit: 8, emoji: "🥦", de: "Iglo Wok-Gemüse", en: "Iglo Wok Vegetables", marke: "Iglo", kcal100: 30, protein100: 1.8, kh100: 4.2, fett100: 0.3, quelle: "openfoodfacts:8000920602812" },
    { id: "off-9008695949520", seit: 8, emoji: "🫛", de: "Iglo Ganze Fisolen", en: "Iglo Whole Green Beans", marke: "Iglo", kcal100: 31, protein100: 2, kh100: 4.3, fett100: 0.2, quelle: "openfoodfacts:9008695949520" },
    { id: "off-9000143145423", seit: 8, emoji: "🥬", de: "Iglo Kohlsprossen", en: "Iglo Brussels Sprouts", marke: "Iglo", kcal100: 45, protein100: 3.5, kh100: 2.7, fett100: 1.3, quelle: "openfoodfacts:9000143145423" },
    { id: "off-9100000066189", seit: 8, emoji: "🥬", de: "Spar Natur*pur Blattspinat-Minis", en: "Spar Natur*pur Leaf Spinach Minis", marke: "Spar Natur*pur", laden: "Spar", kcal100: 26, protein100: 3.1, kh100: 0.5, fett100: 0.8, quelle: "openfoodfacts:9100000066189" },
    { id: "off-4099200105291", seit: 8, emoji: "🥦", de: "Nature's Gold Pfannengemüse", en: "Nature's Gold Pan Vegetables", marke: "Nature's Gold", laden: "Hofer", kcal100: 76, protein100: 2.6, kh100: 7.3, fett100: 3.4, quelle: "openfoodfacts:4099200105291" },

    // ===== Version 9: Carnivore – Speck, Fleisch, Innereien, Fette, Fisch (Wunsch Ivy) =====
    // quelle "usda" = USDA FoodData Central, "durchschnitt" = typische Packungs-/Tabellenwerte (gerundet).
    { id: "carn-bacon-raw", seit: 9, emoji: "🥓", de: "Frühstücksspeck / Bacon (roh)", en: "Bacon (raw)", kcal100: 417, protein100: 12.6, kh100: 1.3, fett100: 39.7, quelle: "usda" },
    { id: "carn-bacon-crispy", seit: 9, emoji: "🥓", de: "Bacon knusprig gebraten", en: "Bacon (pan-fried, crispy)", kcal100: 541, protein100: 37, kh100: 1.4, fett100: 41.8, quelle: "usda" },
    { id: "carn-bauchspeck", seit: 9, emoji: "🥓", de: "Bauchspeck geräuchert", en: "Smoked Pork Belly Bacon", kcal100: 450, protein100: 15, kh100: 0.5, fett100: 43, quelle: "durchschnitt" },
    { id: "carn-tiroler-speck", seit: 9, emoji: "🥓", de: "Tiroler Speck / Schinkenspeck", en: "Tyrolean Speck (smoked ham)", kcal100: 320, protein100: 29, kh100: 0.5, fett100: 22.5, quelle: "durchschnitt" },
    { id: "carn-lardo", seit: 9, emoji: "🥓", de: "Rückenspeck / Lardo", en: "Pork Back Fat / Lardo", kcal100: 812, protein100: 2.9, kh100: 0, fett100: 88.7, quelle: "usda" },
    { id: "carn-grammeln", seit: 9, emoji: "🥓", de: "Grammeln (Grieben)", en: "Pork Cracklings (Grammeln)", kcal100: 640, protein100: 30, kh100: 0, fett100: 58, quelle: "durchschnitt" },
    { id: "carn-pork-rinds", seit: 9, emoji: "🥓", de: "Schweineschwarte / Chicharrón (Snack)", en: "Pork Rinds (snack)", kcal100: 544, protein100: 61.3, kh100: 0, fett100: 31.3, quelle: "usda" },
    { id: "carn-schweinebauch", seit: 9, emoji: "🥩", de: "Schweinebauch (roh)", en: "Pork Belly (raw)", kcal100: 518, protein100: 9.3, kh100: 0, fett100: 53, quelle: "usda" },
    { id: "carn-schweinekotelett", seit: 9, emoji: "🥩", de: "Schweinskotelett (roh)", en: "Pork Chop (raw)", kcal100: 160, protein100: 21, kh100: 0, fett100: 8.5, quelle: "durchschnitt" },
    { id: "carn-schweinsschulter", seit: 9, emoji: "🥩", de: "Schweinsschulter (roh)", en: "Pork Shoulder (raw)", kcal100: 200, protein100: 18, kh100: 0, fett100: 14, quelle: "durchschnitt" },
    { id: "carn-ribeye", seit: 9, emoji: "🥩", de: "Ribeye / Entrecôte (roh)", en: "Ribeye Steak (raw)", kcal100: 220, protein100: 20, kh100: 0, fett100: 15.5, quelle: "durchschnitt" },
    { id: "carn-rinderfilet", seit: 9, emoji: "🥩", de: "Rinderfilet (roh)", en: "Beef Tenderloin (raw)", kcal100: 121, protein100: 21, kh100: 0, fett100: 4, quelle: "durchschnitt" },
    { id: "carn-rumpsteak", seit: 9, emoji: "🥩", de: "Rumpsteak / Hüftsteak (roh)", en: "Rump / Sirloin Steak (raw)", kcal100: 145, protein100: 21.5, kh100: 0, fett100: 6.5, quelle: "durchschnitt" },
    { id: "carn-rinderbrust", seit: 9, emoji: "🥩", de: "Rinderbrust / Brisket (roh)", en: "Beef Brisket (raw)", kcal100: 250, protein100: 18, kh100: 0, fett100: 20, quelle: "durchschnitt" },
    { id: "carn-rinderleber", seit: 9, emoji: "🫀", de: "Rinderleber (roh)", en: "Beef Liver (raw)", kcal100: 135, protein100: 20.4, kh100: 3.9, fett100: 3.6, quelle: "usda" },
    { id: "carn-rinderherz", seit: 9, emoji: "🫀", de: "Rinderherz (roh)", en: "Beef Heart (raw)", kcal100: 112, protein100: 17.7, kh100: 0.1, fett100: 3.9, quelle: "usda" },
    { id: "carn-rinderzunge", seit: 9, emoji: "👅", de: "Rinderzunge (roh)", en: "Beef Tongue (raw)", kcal100: 224, protein100: 14.9, kh100: 3.7, fett100: 16.1, quelle: "usda" },
    { id: "carn-rinderniere", seit: 9, emoji: "🫘", de: "Rinderniere (roh)", en: "Beef Kidney (raw)", kcal100: 99, protein100: 17.4, kh100: 0.3, fett100: 3.1, quelle: "usda" },
    { id: "carn-knochenmark", seit: 9, emoji: "🦴", de: "Knochenmark (Rind)", en: "Beef Bone Marrow", kcal100: 786, protein100: 6.7, kh100: 0, fett100: 84.4, quelle: "usda" },
    { id: "carn-knochenbruehe", seit: 9, emoji: "🍲", de: "Knochenbrühe (Rind)", en: "Beef Bone Broth", kcal100: 20, protein100: 4, kh100: 0.3, fett100: 0.4, quelle: "durchschnitt" },
    { id: "carn-rindertalg", seit: 9, emoji: "🧈", de: "Rindertalg", en: "Beef Tallow", kcal100: 902, protein100: 0, kh100: 0, fett100: 100, quelle: "usda" },
    { id: "carn-schmalz", seit: 9, emoji: "🧈", de: "Schweineschmalz", en: "Lard", kcal100: 902, protein100: 0, kh100: 0, fett100: 100, quelle: "usda" },
    { id: "carn-gaenseschmalz", seit: 9, emoji: "🧈", de: "Gänseschmalz", en: "Goose Fat", kcal100: 900, protein100: 0, kh100: 0, fett100: 99.8, quelle: "usda" },
    { id: "carn-ghee", seit: 9, emoji: "🧈", de: "Ghee / Butterschmalz", en: "Ghee / Clarified Butter", kcal100: 876, protein100: 0.3, kh100: 0, fett100: 99.5, quelle: "usda" },
    { id: "carn-lamm", seit: 9, emoji: "🐑", de: "Lammfleisch (roh)", en: "Lamb (raw)", kcal100: 282, protein100: 16.6, kh100: 0, fett100: 23.4, quelle: "usda" },
    { id: "carn-hirsch", seit: 9, emoji: "🦌", de: "Hirsch / Reh (roh)", en: "Venison (raw)", kcal100: 120, protein100: 23, kh100: 0, fett100: 2.4, quelle: "usda" },
    { id: "carn-ente", seit: 9, emoji: "🦆", de: "Ente mit Haut (roh)", en: "Duck with Skin (raw)", kcal100: 404, protein100: 11.5, kh100: 0, fett100: 39.3, quelle: "usda" },
    { id: "carn-huehnerschenkel-haut", seit: 9, emoji: "🍗", de: "Hühnerschenkel mit Haut (roh)", en: "Chicken Thigh with Skin (raw)", kcal100: 221, protein100: 16.5, kh100: 0, fett100: 16.6, quelle: "usda" },
    { id: "carn-chicken-wings", seit: 9, emoji: "🍗", de: "Hühnerflügerl (roh)", en: "Chicken Wings (raw)", kcal100: 203, protein100: 18.3, kh100: 0, fett100: 14, quelle: "usda" },
    { id: "carn-huehnerherzen", seit: 9, emoji: "🫀", de: "Hühnerherzen (roh)", en: "Chicken Hearts (raw)", kcal100: 153, protein100: 15.6, kh100: 0.7, fett100: 9.3, quelle: "usda" },
    { id: "carn-huehnerleber", seit: 9, emoji: "🫀", de: "Hühnerleber (roh)", en: "Chicken Liver (raw)", kcal100: 119, protein100: 16.9, kh100: 0.7, fett100: 4.8, quelle: "usda" },
    { id: "carn-sardinen", seit: 9, emoji: "🐟", de: "Sardinen in Öl (abgetropft)", en: "Sardines in Oil (drained)", kcal100: 208, protein100: 24.6, kh100: 0, fett100: 11.5, quelle: "usda" },
    { id: "carn-makrele", seit: 9, emoji: "🐟", de: "Makrele (roh)", en: "Mackerel (raw)", kcal100: 205, protein100: 18.6, kh100: 0, fett100: 13.9, quelle: "usda" },
    { id: "carn-hering", seit: 9, emoji: "🐟", de: "Hering (roh)", en: "Herring (raw)", kcal100: 158, protein100: 18, kh100: 0, fett100: 9, quelle: "usda" },
    { id: "carn-forelle", seit: 9, emoji: "🐟", de: "Forelle (roh)", en: "Trout (raw)", kcal100: 141, protein100: 19.9, kh100: 0, fett100: 6.2, quelle: "usda" },
    { id: "carn-muscheln", seit: 9, emoji: "🦪", de: "Miesmuscheln (roh)", en: "Mussels (raw)", kcal100: 86, protein100: 11.9, kh100: 3.7, fett100: 2.2, quelle: "usda" },
    { id: "carn-kaviar", seit: 9, emoji: "🐟", de: "Fischrogen / Kaviar", en: "Fish Roe / Caviar", kcal100: 264, protein100: 24.6, kh100: 4, fett100: 17.9, quelle: "usda" },
    { id: "carn-eigelb", seit: 9, emoji: "🥚", de: "Eigelb", en: "Egg Yolk", kcal100: 322, protein100: 15.9, kh100: 3.6, fett100: 26.5, quelle: "usda" },
    { id: "carn-schlagobers", seit: 9, emoji: "🥛", de: "Schlagobers / Sahne 36 %", en: "Heavy Cream 36%", kcal100: 345, protein100: 2.1, kh100: 2.9, fett100: 36, quelle: "durchschnitt" },
    { id: "carn-bergkaese", seit: 9, emoji: "🧀", de: "Bergkäse", en: "Mountain Cheese", kcal100: 400, protein100: 28, kh100: 0, fett100: 32, quelle: "durchschnitt" },
    { id: "carn-camembert", seit: 9, emoji: "🧀", de: "Camembert", en: "Camembert", kcal100: 300, protein100: 19.8, kh100: 0.5, fett100: 24.3, quelle: "usda" },
    { id: "carn-salami", seit: 9, emoji: "🍖", de: "Salami", en: "Salami", kcal100: 406, protein100: 24, kh100: 1, fett100: 34, quelle: "durchschnitt" },
    { id: "carn-rohschinken", seit: 9, emoji: "🥓", de: "Rohschinken / Prosciutto", en: "Prosciutto / Cured Ham", kcal100: 248, protein100: 26, kh100: 0, fett100: 16, quelle: "durchschnitt" },
    { id: "carn-leberkaese", seit: 9, emoji: "🍖", de: "Leberkäse", en: "Leberkäse (meatloaf)", kcal100: 290, protein100: 12, kh100: 1, fett100: 26.5, quelle: "durchschnitt" },
    { id: "carn-leberwurst", seit: 9, emoji: "🍖", de: "Leberwurst", en: "Liver Sausage", kcal100: 325, protein100: 15, kh100: 1, fett100: 29, quelle: "durchschnitt" },
    { id: "carn-gelatine", seit: 9, emoji: "🍮", de: "Gelatine (Pulver)", en: "Gelatin (powder)", kcal100: 335, protein100: 85.6, kh100: 0, fett100: 0.1, quelle: "usda" },
    { id: "carn-kollagen", seit: 9, emoji: "💪", de: "Kollagenpulver", en: "Collagen Powder", kcal100: 360, protein100: 90, kh100: 0, fett100: 0, quelle: "durchschnitt" }
];

// Wie viel wiegt EIN Stück bzw. eine Scheibe? (Durchschnitt, essbarer Anteil; Basis USDA "medium"/Packungsangaben)
// Damit kann man im Tagesplan auch "2 Stk. Ei" statt "100 g" eintragen.
const STUECK_GEWICHTE = {
    "start-egg": [50, "stueck"], "start-egg-raw": [50, "stueck"],
    "start-banana": [118, "stueck"], "start-apple": [182, "stueck"], "start-orange": [131, "stueck"],
    "start-kiwi": [69, "stueck"], "start-tomato": [123, "stueck"], "start-avocado": [136, "stueck"],
    "start-mango": [200, "stueck"], "usda-pear": [178, "stueck"], "usda-peach": [150, "stueck"],
    "usda-nectarine": [142, "stueck"], "usda-plum": [40, "stueck"],
    "start-ricecake": [8, "scheibe"], "start-bread": [50, "scheibe"], "usda-toast": [25, "scheibe"],
    "usda-crispbread": [10, "scheibe"], "usda-kaisersemmel": [55, "stueck"],
    "start-wrap": [60, "stueck"], "start-proteinbar": [50, "stueck"],
    "carn-eigelb": [17, "stueck"], "carn-bacon-crispy": [8, "scheibe"], "carn-bacon-raw": [15, "scheibe"]
};
STARTDATEN.forEach(function (eintrag) {
    const s = STUECK_GEWICHTE[eintrag.id];
    if (s && !eintrag.stueck) eintrag.stueck = { g: s[0], art: s[1] };
});

// Schnelles Nachschlagen per id: STARTDATEN_NACH_ID["start-oats"] → Haferflocken
const STARTDATEN_NACH_ID = {};
STARTDATEN.forEach(function (eintrag) {
    STARTDATEN_NACH_ID[eintrag.id] = eintrag;
});
