// Built-in, serving-first food database.
//
// Online sources index products by weight, which is useless for things nobody
// weighs: a pouch of fruit snacks, a scoop of Huel, a roti. Every row here
// carries the unit a person actually counts plus the grams behind it, so the
// app can log "2 scoops" and still do the macro math.
//
// Values are per one unit, from published labels or standard reference
// portions. They are close, not laboratory-exact, and homemade dishes vary
// with the recipe.

// [name, brand, keywords, unit, grams, kcal, protein, carbs, fat, sugar, fiber, sodium(mg)]
const RAW = [
  // --- Huel and other shakes -------------------------------------------------
  ['Black Edition powder', 'Huel', 'shake powder meal replacement', 'scoop', 45, 200, 20, 8.5, 8.5, 0.5, 3.5, 180],
  ['Powder v3.1', 'Huel', 'shake powder meal replacement', 'scoop', 50, 200, 14.5, 22.5, 6.5, 0.5, 3.5, 150],
  ['Ready-to-drink', 'Huel', 'shake bottle grab and go', 'bottle', 500, 400, 20, 37, 19, 5, 5, 300],
  ['Complete Protein powder', 'Huel', 'shake powder protein', 'scoop', 31, 110, 20, 3, 2, 0.5, 2, 200],
  ['Daily Greens', 'Huel', 'shake powder greens', 'scoop', 7.5, 25, 2, 3, 0.5, 0.5, 1, 40],
  ['Bar', 'Huel', 'bar snack', 'bar', 55, 200, 12, 23, 6, 8, 5, 130],
  ['Gold Standard Whey', 'Optimum Nutrition', 'shake powder protein', 'scoop', 31, 120, 24, 3, 1.5, 1, 1, 130],
  ['Protein shake', 'Premier Protein', 'shake bottle protein', 'bottle', 325, 160, 30, 5, 3, 1, 3, 230],
  ['Core Power Elite', 'Fairlife', 'shake bottle protein', 'bottle', 414, 230, 42, 9, 3.5, 6, 0, 330],
  ['Organic Protein powder', 'Orgain', 'shake powder protein vegan', 'scoop', 46, 150, 21, 15, 4, 1, 6, 250],
  ['Genuine Protein Shake', 'Muscle Milk', 'shake bottle protein', 'bottle', 414, 160, 25, 9, 4, 1, 3, 290],
  ['Homemade protein shake', 'generic', 'shake blender', 'shake', 400, 300, 30, 30, 6, 20, 3, 200],

  // --- Snacks ----------------------------------------------------------------
  ['Fruit Snacks Mixed Fruit', 'Welchs', 'snack gummy fruit welch', 'pouch', 25.5, 80, 0, 19, 0, 11, 0, 15],
  ['Goldfish Cheddar', 'Pepperidge Farm', 'snack cracker', 'serving', 30, 140, 3, 20, 5, 0, 1, 250],
  ['Cheez-It Original', 'Cheez-It', 'snack cracker', 'serving', 30, 150, 3, 17, 8, 0, 1, 230],
  ['Ruffles Original', 'Ruffles', 'snack chips crisps', 'bag', 28, 160, 2, 15, 10, 0, 1, 160],
  ['Lays Classic', 'Lays', 'snack chips crisps', 'bag', 28, 160, 2, 15, 10, 0, 1, 170],
  ['Doritos Nacho Cheese', 'Doritos', 'snack chips crisps', 'bag', 28, 150, 2, 18, 8, 1, 1, 210],
  ['Takis Fuego', 'Takis', 'snack chips spicy', 'serving', 28, 150, 2, 16, 8, 0, 1, 390],
  ['Pringles Original', 'Pringles', 'snack chips crisps', 'serving', 28, 150, 1, 16, 9, 0, 1, 150],
  ['Pretzels', 'Rold Gold', 'snack', 'serving', 28, 110, 3, 23, 1, 1, 1, 420],
  ['Buttered popcorn', 'Orville Redenbacher', 'snack', 'cup', 8, 35, 1, 4, 2, 0, 1, 60],
  ['Oreo cookie', 'Oreo', 'snack cookie dessert', 'cookie', 11.3, 53, 0.5, 8.3, 2.3, 4.7, 0.3, 36],
  ['Chips Ahoy cookie', 'Chips Ahoy', 'snack cookie dessert', 'cookie', 16, 80, 1, 10.7, 3.7, 6, 0.3, 50],
  ['Pop-Tart frosted strawberry', 'Kelloggs', 'snack pastry breakfast', 'pastry', 52, 200, 2, 38, 5, 16, 1, 170],
  ['Rice Krispies Treat', 'Kelloggs', 'snack bar', 'bar', 22, 90, 1, 17, 2, 8, 0, 105],
  ['Fruit by the Foot', 'Betty Crocker', 'snack fruit gummy', 'roll', 21, 80, 0, 17, 1.5, 10, 0, 50],
  ['Gushers', 'Betty Crocker', 'snack fruit gummy', 'pouch', 25, 90, 0, 20, 1, 13, 0, 45],
  ['Beef jerky Original', 'Jack Links', 'snack protein meat', 'ounce', 28, 80, 11, 6, 1, 5, 0, 590],
  ['Trail mix', 'generic', 'snack nuts', 'quarter cup', 35, 170, 5, 16, 11, 9, 2, 60],
  ['Almonds', 'generic', 'snack nuts', 'ounce', 28, 164, 6, 6, 14, 1, 3.5, 0],
  ['Cashews', 'generic', 'snack nuts', 'ounce', 28, 157, 5, 9, 12, 2, 1, 3],
  ['Peanuts roasted salted', 'generic', 'snack nuts', 'ounce', 28, 166, 7, 6, 14, 1, 2, 116],
  ['Dark chocolate 70%', 'generic', 'snack dessert chocolate', 'serving', 28, 170, 2, 13, 12, 7, 3, 6],
  ['Milk chocolate bar', 'Hersheys', 'snack dessert chocolate hershey', 'bar', 43, 220, 3, 26, 13, 24, 1, 35],
  ['Glazed donut', 'Krispy Kreme', 'snack dessert pastry', 'donut', 49, 190, 3, 22, 11, 10, 1, 95],
  ['Blueberry muffin', 'generic', 'snack dessert pastry', 'muffin', 113, 380, 6, 55, 15, 30, 2, 400],
  ['Hummus', 'Sabra', 'snack dip spread', 'serving', 28, 70, 2, 4, 5, 0, 2, 130],

  // --- Bars ------------------------------------------------------------------
  ['Clif Bar Chocolate Chip', 'Clif', 'bar snack energy', 'bar', 68, 250, 9, 45, 5, 21, 5, 150],
  ['Quest Bar Chocolate Chip', 'Quest', 'bar snack protein', 'bar', 60, 190, 21, 21, 8, 1, 14, 230],
  ['RXBAR Chocolate Sea Salt', 'RXBAR', 'bar snack protein', 'bar', 52, 210, 12, 24, 9, 13, 5, 260],
  ['Oats n Honey granola bar', 'Nature Valley', 'bar snack granola', 'pack', 42, 190, 4, 29, 7, 11, 2, 180],
  ['Dark Chocolate Nuts bar', 'KIND', 'bar snack', 'bar', 40, 200, 6, 16, 15, 5, 7, 125],
  ['Protein bar', 'Pure Protein', 'bar snack protein', 'bar', 50, 200, 20, 17, 6, 3, 1, 190],
  ['Cereal bar', 'generic', 'bar snack breakfast', 'bar', 37, 130, 2, 26, 3, 12, 1, 110],

  // --- Grains and staples ----------------------------------------------------
  ['White rice, cooked', 'generic', 'staple grain rice', 'cup', 158, 205, 4.3, 45, 0.4, 0.1, 0.6, 2],
  ['Brown rice, cooked', 'generic', 'staple grain rice', 'cup', 195, 216, 5, 45, 1.8, 0.7, 3.5, 10],
  ['Basmati rice, cooked', 'generic', 'staple grain rice indian', 'cup', 158, 191, 4, 40, 0.5, 0.1, 0.7, 2],
  ['Quinoa, cooked', 'generic', 'staple grain', 'cup', 185, 222, 8, 39, 3.6, 1.6, 5, 13],
  ['Pasta, cooked', 'generic', 'staple grain noodles', 'cup', 140, 220, 8, 43, 1.3, 0.8, 2.5, 1],
  ['White bread', 'generic', 'staple bread', 'slice', 28, 75, 2.6, 14, 1, 1.5, 0.8, 145],
  ['Whole wheat bread', 'generic', 'staple bread', 'slice', 28, 70, 3.6, 12, 1, 1.4, 2, 130],
  ['Plain bagel', 'generic', 'staple bread breakfast', 'bagel', 98, 260, 10, 51, 1.5, 5, 2, 450],
  ['Flour tortilla', 'generic', 'staple bread wrap', 'tortilla', 45, 140, 4, 24, 3.5, 1, 1, 340],
  ['Corn tortilla', 'generic', 'staple bread wrap', 'tortilla', 26, 60, 1.5, 12, 0.7, 0.2, 1.5, 10],
  ['Rolled oats, dry', 'Quaker', 'staple grain breakfast oatmeal', 'half cup', 40, 150, 5, 27, 3, 1, 4, 0],
  ['Honey Nut Cheerios', 'General Mills', 'staple cereal breakfast', 'cup', 37, 140, 3, 30, 2, 12, 3, 210],
  ['Frozen waffle', 'Eggo', 'staple breakfast', 'waffle', 35, 95, 2, 15, 3, 2, 1, 200],
  ['Pancake', 'generic', 'staple breakfast', 'pancake', 77, 175, 5, 22, 7, 5, 1, 350],
  ['Baked potato', 'generic', 'staple vegetable', 'medium potato', 173, 161, 4.3, 37, 0.2, 2, 3.8, 17],
  ['Baked sweet potato', 'generic', 'staple vegetable', 'medium potato', 151, 130, 2.4, 30, 0.2, 9, 4.7, 72],

  // --- Protein ---------------------------------------------------------------
  ['Chicken breast, cooked', 'generic', 'protein meat poultry', 'breast', 174, 284, 53, 0, 6, 0, 0, 127],
  ['Chicken thigh, cooked', 'generic', 'protein meat poultry', 'thigh', 111, 209, 26, 0, 11, 0, 0, 88],
  ['Ground beef 90/10, cooked', 'generic', 'protein meat beef', 'serving', 113, 199, 23, 0, 11, 0, 0, 75],
  ['Ground turkey 93/7, cooked', 'generic', 'protein meat poultry', 'serving', 113, 170, 22, 0, 9, 0, 0, 90],
  ['Salmon, cooked', 'generic', 'protein fish seafood', 'fillet', 170, 350, 39, 0, 21, 0, 0, 115],
  ['Tilapia, cooked', 'generic', 'protein fish seafood', 'fillet', 145, 180, 37, 0, 3, 0, 0, 80],
  ['Shrimp, cooked', 'generic', 'protein fish seafood', 'serving', 113, 112, 24, 1, 1, 0, 0, 640],
  ['Tuna in water', 'StarKist', 'protein fish seafood canned', 'pouch', 74, 70, 16, 0, 0.5, 0, 0, 180],
  ['Large egg', 'generic', 'protein breakfast', 'egg', 50, 72, 6.3, 0.4, 4.8, 0.2, 0, 71],
  ['Egg whites', 'generic', 'protein breakfast', 'cup', 243, 126, 26, 1.8, 0.4, 1.7, 0, 400],
  ['Bacon, cooked', 'generic', 'protein meat breakfast pork', 'slice', 10, 43, 3, 0.1, 3.3, 0, 0, 185],
  ['Turkey deli slices', 'Oscar Mayer', 'protein meat sandwich', 'slice', 28, 30, 5, 1, 0.5, 1, 0, 350],
  ['Firm tofu', 'generic', 'protein vegetarian vegan soy', 'serving', 85, 94, 10, 2, 5, 1, 1, 12],
  ['Black beans, cooked', 'generic', 'protein vegetarian beans legume', 'half cup', 86, 114, 7.6, 20, 0.5, 0.3, 7.5, 1],
  ['Chickpeas, cooked', 'generic', 'protein vegetarian beans legume', 'half cup', 82, 135, 7.3, 22, 2.1, 4, 6.2, 6],
  ['Lentils, cooked', 'generic', 'protein vegetarian beans legume dal', 'cup', 198, 230, 18, 40, 0.8, 3.6, 15.6, 4],

  // --- Dairy -----------------------------------------------------------------
  ['2% milk', 'generic', 'dairy drink', 'cup', 244, 122, 8, 12, 4.8, 12, 0, 115],
  ['Whole milk', 'generic', 'dairy drink', 'cup', 244, 149, 8, 12, 8, 12, 0, 105],
  ['2% milk', 'Fairlife', 'dairy drink protein', 'cup', 240, 120, 13, 6, 5, 6, 0, 120],
  ['Unsweetened almond milk', 'Almond Breeze', 'dairy drink vegan', 'cup', 240, 30, 1, 1, 2.5, 0, 1, 170],
  ['Oat milk', 'Oatly', 'dairy drink vegan', 'cup', 240, 120, 3, 16, 5, 7, 2, 100],
  ['Greek yogurt, plain nonfat', 'Chobani', 'dairy yogurt protein', 'cup', 227, 130, 22, 9, 0, 6, 0, 85],
  ['Cottage cheese 2%', 'Good Culture', 'dairy protein', 'cup', 226, 180, 24, 8, 5, 7, 0, 480],
  ['Cheddar cheese', 'generic', 'dairy cheese', 'slice', 28, 113, 7, 0.4, 9, 0.1, 0, 180],
  ['Shredded mozzarella', 'generic', 'dairy cheese', 'quarter cup', 28, 85, 6, 1, 6, 0.2, 0, 180],
  ['String cheese', 'Sargento', 'dairy cheese snack', 'stick', 28, 80, 6, 1, 6, 0, 0, 200],
  ['Butter', 'generic', 'dairy fat', 'tbsp', 14, 102, 0.1, 0, 11.5, 0, 0, 91],
  ['Vanilla ice cream', 'Breyers', 'dairy dessert', 'half cup', 66, 140, 2, 16, 7, 14, 0, 45],

  // --- Produce ---------------------------------------------------------------
  ['Banana', 'generic', 'produce fruit', 'medium banana', 118, 105, 1.3, 27, 0.4, 14, 3.1, 1],
  ['Apple', 'generic', 'produce fruit', 'medium apple', 182, 95, 0.5, 25, 0.3, 19, 4.4, 2],
  ['Orange', 'generic', 'produce fruit', 'medium orange', 131, 62, 1.2, 15, 0.2, 12, 3.1, 0],
  ['Strawberries', 'generic', 'produce fruit berries', 'cup', 152, 49, 1, 12, 0.5, 7, 3, 2],
  ['Blueberries', 'generic', 'produce fruit berries', 'cup', 148, 84, 1.1, 21, 0.5, 15, 3.6, 1],
  ['Grapes', 'generic', 'produce fruit', 'cup', 151, 104, 1.1, 27, 0.2, 23, 1.4, 3],
  ['Watermelon', 'generic', 'produce fruit', 'cup', 152, 46, 0.9, 12, 0.2, 9, 0.6, 2],
  ['Mango', 'generic', 'produce fruit', 'cup', 165, 99, 1.4, 25, 0.6, 23, 2.6, 2],
  ['Avocado', 'generic', 'produce fruit vegetable', 'half avocado', 100, 160, 2, 9, 15, 0.7, 7, 7],
  ['Broccoli, cooked', 'generic', 'produce vegetable', 'cup', 156, 55, 3.7, 11, 0.6, 2.2, 5.1, 64],
  ['Raw spinach', 'generic', 'produce vegetable greens', 'cup', 30, 7, 0.9, 1.1, 0.1, 0.1, 0.7, 24],
  ['Baby carrots', 'generic', 'produce vegetable', 'serving', 85, 35, 0.6, 8, 0.1, 5, 2.5, 78],
  ['Mixed salad greens', 'generic', 'produce vegetable greens', 'cup', 36, 8, 0.7, 1.5, 0.1, 0.5, 0.9, 10],

  // --- Spreads, oils, condiments ---------------------------------------------
  ['Peanut butter', 'Jif', 'spread nut butter', 'tbsp', 16, 95, 3.5, 3.5, 8, 1.5, 1, 70],
  ['Almond butter', 'generic', 'spread nut butter', 'tbsp', 16, 98, 3.4, 3, 8.9, 0.7, 1.6, 36],
  ['Nutella', 'Nutella', 'spread dessert chocolate', 'tbsp', 18.5, 100, 1, 11, 6, 10.5, 0.5, 7.5],
  ['Honey', 'generic', 'spread sweetener', 'tbsp', 21, 64, 0.1, 17, 0, 17, 0, 1],
  ['Maple syrup', 'generic', 'spread sweetener breakfast', 'tbsp', 20, 52, 0, 13, 0, 12, 0, 2],
  ['Mayonnaise', 'Hellmanns', 'condiment sauce mayo', 'tbsp', 14, 90, 0, 0, 10, 0, 0, 90],
  ['Ketchup', 'Heinz', 'condiment sauce', 'tbsp', 17, 20, 0, 5, 0, 4, 0, 160],
  ['Ranch dressing', 'Hidden Valley', 'condiment sauce dressing', 'tbsp', 15, 70, 0, 1, 7, 1, 0, 130],
  ['Olive oil', 'generic', 'condiment oil fat', 'tbsp', 14, 119, 0, 0, 13.5, 0, 0, 0],
  ['Soy sauce', 'Kikkoman', 'condiment sauce', 'tbsp', 15, 10, 1.3, 1, 0, 0.1, 0, 920],
  ['Sriracha', 'Huy Fong', 'condiment sauce spicy', 'tsp', 5, 5, 0, 1, 0, 1, 0, 80],

  // --- Drinks ----------------------------------------------------------------
  ['Thirst Quencher', 'Gatorade', 'drink sports', 'bottle', 591, 140, 0, 36, 0, 34, 0, 270],
  ['Powerade', 'Powerade', 'drink sports', 'bottle', 591, 130, 0, 35, 0, 34, 0, 250],
  ['Coca-Cola', 'Coca-Cola', 'drink soda coke', 'can', 355, 140, 0, 39, 0, 39, 0, 45],
  ['Sprite', 'Sprite', 'drink soda', 'can', 355, 140, 0, 38, 0, 38, 0, 65],
  ['Diet Coke', 'Coca-Cola', 'drink soda', 'can', 355, 0, 0, 0, 0, 0, 0, 40],
  ['Orange juice', 'Tropicana', 'drink juice breakfast', 'cup', 248, 110, 2, 26, 0, 22, 0.5, 0],
  ['Energy drink', 'Celsius', 'drink energy', 'can', 355, 10, 0, 2, 0, 0, 0, 0],
  ['Red Bull', 'Red Bull', 'drink energy', 'can', 250, 110, 1, 28, 0, 27, 0, 105],
  ['Monster Energy', 'Monster', 'drink energy', 'can', 473, 210, 0, 54, 0, 54, 0, 370],
  ['Green Tea', 'Arizona', 'drink tea', 'can', 680, 240, 0, 60, 0, 60, 0, 60],
  ['Black coffee', 'generic', 'drink coffee', 'cup', 240, 2, 0.3, 0, 0, 0, 0, 5],
  ['Latte with whole milk', 'Starbucks', 'drink coffee', 'grande', 473, 190, 13, 19, 7, 18, 0, 170],
  ['Chocolate milk', 'generic', 'drink dairy', 'cup', 250, 208, 8, 26, 8.5, 24, 2, 150],
  ['Mixed berry smoothie', 'generic', 'drink smoothie', 'cup', 240, 160, 2, 38, 1, 30, 4, 20],

  // --- Indian ----------------------------------------------------------------
  ['Roti / chapati', 'generic', 'indian bread staple', 'roti', 40, 120, 3, 22, 2.5, 0.5, 2.5, 120],
  ['Naan', 'generic', 'indian bread staple', 'naan', 90, 260, 9, 45, 5, 3, 2, 420],
  ['Dal', 'generic', 'indian curry lentil', 'cup', 200, 180, 10, 25, 4, 2, 8, 400],
  ['Chana masala', 'generic', 'indian curry chickpea', 'cup', 200, 240, 10, 32, 8, 6, 9, 550],
  ['Paneer butter masala', 'generic', 'indian curry cheese', 'cup', 200, 380, 12, 18, 28, 8, 3, 700],
  ['Paneer', 'generic', 'indian cheese protein', 'serving', 50, 160, 9, 2, 13, 1, 0, 15],
  ['Chicken curry', 'generic', 'indian curry meat', 'cup', 200, 290, 24, 10, 17, 4, 2, 620],
  ['Chicken biryani', 'generic', 'indian rice meat', 'cup', 220, 350, 18, 45, 11, 3, 3, 700],
  ['Idli', 'generic', 'indian breakfast south', 'idli', 40, 58, 1.6, 12, 0.2, 0.1, 0.6, 65],
  ['Dosa, plain', 'generic', 'indian breakfast south', 'dosa', 80, 168, 4, 28, 4, 0.5, 1.5, 290],
  ['Samosa', 'generic', 'indian snack fried', 'samosa', 75, 260, 4, 28, 15, 2, 2, 420],
  ['Upma', 'generic', 'indian breakfast south', 'cup', 180, 250, 6, 38, 8, 2, 3, 480],
  ['Poha', 'generic', 'indian breakfast', 'cup', 160, 270, 5, 45, 8, 3, 2, 400],
  ['Curd / plain yogurt', 'generic', 'indian dairy yogurt', 'cup', 245, 150, 8.5, 11, 8, 11, 0, 115],

  // --- Fast food -------------------------------------------------------------
  ['Big Mac', 'McDonalds', 'fast food burger mcdonald', 'burger', 219, 590, 25, 46, 34, 9, 3, 1050],
  ['McChicken', 'McDonalds', 'fast food sandwich chicken mcdonald', 'sandwich', 143, 400, 14, 39, 21, 5, 2, 560],
  ['Chicken McNuggets, 10 pc', 'McDonalds', 'fast food chicken mcdonald', 'order', 162, 420, 23, 25, 25, 0, 1, 840],
  ['Medium fries', 'McDonalds', 'fast food fries mcdonald', 'order', 111, 320, 4, 43, 15, 0, 4, 260],
  ['Chicken Sandwich', 'Chick-fil-A', 'fast food sandwich chicken chickfila', 'sandwich', 183, 440, 29, 41, 17, 6, 2, 1400],
  ['Nuggets, 8 pc', 'Chick-fil-A', 'fast food chicken chickfila', 'order', 127, 250, 27, 11, 11, 1, 1, 1210],
  ['Chicken burrito bowl', 'Chipotle', 'fast food bowl mexican', 'bowl', 510, 625, 45, 60, 22, 4, 9, 1500],
  ['Turkey sub, 6 inch', 'Subway', 'fast food sandwich', 'sandwich', 219, 280, 18, 46, 3.5, 7, 5, 760],
  ['Whopper', 'Burger King', 'fast food burger', 'burger', 270, 670, 28, 51, 40, 11, 2, 980],
  ['Crunchy Taco', 'Taco Bell', 'fast food mexican', 'taco', 78, 170, 8, 13, 10, 1, 3, 310],
  ['Double-Double', 'In-N-Out', 'fast food burger', 'burger', 330, 670, 37, 39, 41, 10, 3, 1440],
  ['Orange Chicken', 'Panda Express', 'fast food chinese', 'serving', 156, 490, 25, 51, 23, 19, 2, 820],
  ['Cheese pizza slice', 'generic', 'fast food pizza', 'slice', 107, 285, 12, 36, 10, 4, 2, 640],
  ['Pepperoni pizza slice', 'generic', 'fast food pizza', 'slice', 111, 313, 13, 36, 13, 4, 2, 760],
];

const ZERO_MICROS = { potassium: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0, vitaminD: 0 };

// "pouch" -> "pouches", "scoop" -> "scoops".
function pluralize(unit) {
  if (/(ch|sh|s|x|z)$/.test(unit)) return unit + 'es';
  return unit + 's';
}

function toItem(row, i) {
  const [name, brand, keywords, unit, grams, calories, protein, carbs, fat, sugar, fiber, sodium] = row;
  const perServing = { calories, protein, carbs, fat, sugar, fiber, sodium, ...ZERO_MICROS };
  const factor = 100 / grams;
  const macrosPer100g = {};
  for (const [k, v] of Object.entries(perServing)) macrosPer100g[k] = v * factor;
  const cleanBrand = brand === 'generic' ? '' : brand;
  return {
    id: 'local_' + i,
    name,
    brand: cleanBrand,
    source: 'Built-in',
    serving: { unit, unitPlural: pluralize(unit), grams },
    perServing,
    macrosPer100g,
    // Loose keywords so "shake", "vegan" or "spicy" also find things.
    haystack: `${name} ${cleanBrand} ${keywords}`.toLowerCase(),
  };
}

export const LOCAL_FOODS = RAW.map(toItem);

export function searchLocal(query) {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const hits = [];
  for (const food of LOCAL_FOODS) {
    if (!terms.every((t) => food.haystack.includes(t))) continue;
    // An exact brand match ("huel") outranks a food that merely mentions the
    // word among its keywords.
    let score = 0;
    if (food.brand.toLowerCase() === q) score += 100;
    if (food.name.toLowerCase().startsWith(q)) score += 60;
    if (food.haystack.startsWith(q)) score += 30;
    hits.push({ food, score });
  }
  // Sort is stable, so equal scores keep the table's own order, which puts the
  // flagship item of a brand ahead of its side products.
  return hits.sort((a, b) => b.score - a.score).map((h) => h.food);
}
