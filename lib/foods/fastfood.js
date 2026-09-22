// Chain restaurant items, from published nutrition guides.
// [name, brand, keywords, unit, grams, kcal, protein, carbs, fat, sugar, fiber,
//  sodium(mg), potassium(mg), calcium(mg), iron(mg), vitC(mg), vitA(mcg), vitD(mcg)]

export default [
  // McDonald's
  ['Big Mac', 'McDonalds', 'fast food burger mcdonald', 'burger', 219, 590, 25, 46, 34, 9, 3, 1050, 400, 260, 4.5, 1, 90, 0.2],
  ['Quarter Pounder with Cheese', 'McDonalds', 'fast food burger mcdonald', 'burger', 202, 520, 30, 42, 26, 10, 2, 1140, 500, 300, 4.5, 1, 100, 0.2],
  ['Cheeseburger', 'McDonalds', 'fast food burger mcdonald', 'burger', 115, 300, 15, 32, 13, 7, 2, 720, 230, 200, 2.5, 1, 60, 0.1],
  ['McChicken', 'McDonalds', 'fast food sandwich chicken mcdonald', 'sandwich', 143, 400, 14, 39, 21, 5, 2, 560, 250, 100, 2.5, 1, 20, 0.1],
  ['Chicken McNuggets, 10 pc', 'McDonalds', 'fast food chicken mcdonald', 'order', 162, 420, 23, 25, 25, 0, 1, 840, 400, 20, 1.5, 1, 10, 0.1],
  ['Medium fries', 'McDonalds', 'fast food fries mcdonald', 'order', 111, 320, 4, 43, 15, 0, 4, 260, 600, 20, 0.8, 6, 0, 0],
  ['Egg McMuffin', 'McDonalds', 'fast food breakfast mcdonald', 'sandwich', 161, 310, 17, 30, 13, 3, 2, 770, 250, 300, 2.5, 1, 120, 1],
  ['Sausage McMuffin with Egg', 'McDonalds', 'fast food breakfast mcdonald', 'sandwich', 165, 480, 20, 30, 31, 3, 2, 830, 280, 300, 3, 1, 130, 1],
  ['Hotcakes', 'McDonalds', 'fast food breakfast mcdonald', 'order', 221, 580, 9, 101, 15, 45, 3, 560, 300, 150, 3, 0, 60, 0.3],
  ['McFlurry Oreo', 'McDonalds', 'fast food dessert mcdonald', 'regular', 285, 510, 12, 80, 16, 60, 1, 280, 550, 400, 1, 0, 150, 1],
  // Chick-fil-A
  ['Chicken Sandwich', 'Chick-fil-A', 'fast food sandwich chicken chickfila', 'sandwich', 183, 440, 29, 41, 17, 6, 2, 1400, 350, 80, 2.5, 2, 20, 0.1],
  ['Spicy Chicken Sandwich', 'Chick-fil-A', 'fast food sandwich chicken chickfila', 'sandwich', 185, 450, 29, 42, 19, 6, 2, 1640, 350, 80, 2.5, 2, 20, 0.1],
  ['Nuggets, 8 pc', 'Chick-fil-A', 'fast food chicken chickfila', 'order', 127, 250, 27, 11, 11, 1, 1, 1210, 400, 20, 1, 1, 10, 0.1],
  ['Waffle Fries, medium', 'Chick-fil-A', 'fast food fries chickfila', 'order', 125, 420, 5, 45, 24, 1, 5, 240, 700, 30, 1, 10, 0, 0],
  ['Chicken Biscuit', 'Chick-fil-A', 'fast food breakfast chickfila', 'sandwich', 153, 460, 19, 45, 23, 5, 2, 1440, 300, 100, 3, 1, 20, 0.2],
  ['Mac and Cheese', 'Chick-fil-A', 'fast food side chickfila', 'medium', 227, 450, 19, 30, 28, 6, 1, 1200, 300, 600, 1, 0, 250, 0.4],
  ['Chick-fil-A Sauce', 'Chick-fil-A', 'fast food sauce chickfila', 'packet', 28, 140, 0, 6, 13, 6, 0, 180, 20, 5, 0, 0, 10, 0],
  // Texas chains
  ['Whataburger', 'Whataburger', 'fast food burger texas', 'burger', 301, 590, 27, 57, 26, 11, 3, 1130, 500, 200, 5, 3, 80, 0.2],
  ['Honey Butter Chicken Biscuit', 'Whataburger', 'fast food breakfast texas', 'sandwich', 173, 610, 17, 55, 35, 14, 2, 1250, 300, 100, 3, 1, 40, 0.2],
  ['Whataburger fries, medium', 'Whataburger', 'fast food fries texas', 'order', 133, 420, 5, 52, 21, 1, 5, 260, 700, 20, 1, 8, 0, 0],
  ['Box Combo, 3 tenders', 'Raising Canes', 'fast food chicken tenders', 'combo', 500, 1200, 47, 116, 60, 8, 6, 2100, 900, 150, 5, 5, 60, 0.3],
  ['Chicken tender', 'Raising Canes', 'fast food chicken tenders', 'tender', 50, 130, 12, 8, 6, 0, 0.5, 300, 180, 10, 0.6, 0, 5, 0.1],
  ['Cane Sauce', 'Raising Canes', 'fast food sauce', 'serving', 43, 190, 0, 4, 19, 3, 0, 300, 20, 5, 0, 0, 15, 0],
  // Chipotle and Mexican chains
  ['Chicken burrito bowl', 'Chipotle', 'fast food bowl mexican', 'bowl', 510, 625, 45, 60, 22, 4, 9, 1500, 900, 250, 4, 15, 150, 0.2],
  ['Steak burrito bowl', 'Chipotle', 'fast food bowl mexican', 'bowl', 510, 640, 38, 62, 25, 4, 9, 1450, 850, 250, 4.5, 15, 150, 0.2],
  ['Chicken burrito', 'Chipotle', 'fast food wrap mexican', 'burrito', 610, 975, 53, 106, 37, 6, 12, 2200, 1000, 400, 6, 15, 200, 0.3],
  ['Chips and guacamole', 'Chipotle', 'fast food side mexican', 'order', 200, 770, 9, 73, 51, 2, 13, 590, 800, 100, 2, 15, 30, 0],
  ['Crunchy Taco', 'Taco Bell', 'fast food mexican', 'taco', 78, 170, 8, 13, 10, 1, 3, 310, 150, 100, 1, 1, 40, 0.1],
  ['Crunchwrap Supreme', 'Taco Bell', 'fast food mexican', 'crunchwrap', 254, 530, 16, 71, 21, 6, 6, 1200, 400, 200, 3, 3, 80, 0.2],
  ['Chicken quesadilla', 'Taco Bell', 'fast food mexican cheese', 'quesadilla', 199, 510, 26, 40, 27, 4, 4, 1250, 350, 500, 2.5, 2, 150, 0.3],
  // Burger and chicken chains
  ['Whopper', 'Burger King', 'fast food burger', 'burger', 270, 670, 28, 51, 40, 11, 2, 980, 500, 150, 4.5, 6, 80, 0.2],
  ['Double-Double', 'In-N-Out', 'fast food burger', 'burger', 330, 670, 37, 39, 41, 10, 3, 1440, 550, 300, 4, 6, 120, 0.2],
  ['Daves Single', 'Wendys', 'fast food burger', 'burger', 218, 590, 29, 39, 34, 8, 2, 1160, 450, 200, 4, 3, 90, 0.2],
  ['Baconator', 'Wendys', 'fast food burger', 'burger', 330, 960, 60, 40, 62, 9, 2, 1760, 800, 350, 6, 3, 150, 0.4],
  ['Spicy chicken sandwich', 'Popeyes', 'fast food sandwich chicken', 'sandwich', 231, 700, 28, 50, 42, 8, 2, 1440, 400, 100, 3, 2, 30, 0.2],
  ['Chicken tenders, 3 pc', 'Popeyes', 'fast food chicken', 'order', 130, 340, 25, 20, 18, 0, 1, 950, 350, 30, 1.5, 0, 10, 0.1],
  ['Classic Chicken Sandwich', 'Jack in the Box', 'fast food sandwich chicken', 'sandwich', 160, 400, 15, 38, 21, 4, 2, 800, 250, 80, 2.5, 1, 20, 0.1],
  // Pizza and subs
  ['Cheese pizza slice', 'generic', 'fast food pizza', 'slice', 107, 285, 12, 36, 10, 4, 2, 640, 200, 250, 2.5, 1, 100, 0.1],
  ['Pepperoni pizza slice', 'generic', 'fast food pizza', 'slice', 111, 313, 13, 36, 13, 4, 2, 760, 220, 250, 2.5, 1, 100, 0.2],
  ['Pepperoni pizza slice, large', 'Dominos', 'fast food pizza', 'slice', 129, 350, 15, 40, 15, 4, 2, 820, 250, 280, 2.8, 1, 110, 0.2],
  ['Personal pan pizza', 'Pizza Hut', 'fast food pizza', 'pizza', 250, 640, 27, 70, 28, 8, 4, 1400, 450, 500, 5, 3, 200, 0.3],
  ['Turkey sub, 6 inch', 'Subway', 'fast food sandwich', 'sandwich', 219, 280, 18, 46, 3.5, 7, 5, 760, 350, 80, 3, 12, 60, 0.1],
  ['Italian BMT, 6 inch', 'Subway', 'fast food sandwich', 'sandwich', 236, 410, 20, 47, 16, 8, 5, 1260, 400, 100, 3.5, 12, 60, 0.2],
  ['Meatball Marinara, 6 inch', 'Subway', 'fast food sandwich', 'sandwich', 287, 480, 21, 60, 18, 12, 7, 970, 500, 150, 4.5, 8, 100, 0.2],
  ['Turkey sub', 'Jersey Mikes', 'fast food sandwich', 'regular', 280, 590, 30, 60, 24, 10, 3, 1500, 450, 300, 4, 10, 100, 0.2],
  // Asian chains
  ['Orange Chicken', 'Panda Express', 'fast food chinese', 'serving', 156, 490, 25, 51, 23, 19, 2, 820, 300, 40, 1.5, 3, 20, 0.1],
  ['Beijing Beef', 'Panda Express', 'fast food chinese', 'serving', 168, 480, 14, 46, 27, 22, 2, 660, 350, 50, 2, 10, 60, 0.1],
  ['Chow Mein', 'Panda Express', 'fast food chinese noodles', 'serving', 260, 510, 13, 80, 20, 9, 6, 860, 400, 60, 4, 15, 100, 0],
  ['Fried Rice', 'Panda Express', 'fast food chinese rice', 'serving', 285, 520, 11, 85, 16, 3, 4, 850, 250, 40, 3, 5, 40, 0.1],
  // Breakfast and coffee chains
  ['Bacon Egg and Cheese', 'Dunkin', 'fast food breakfast sandwich', 'sandwich', 165, 470, 22, 38, 25, 4, 1, 1130, 250, 300, 2.5, 1, 100, 0.8],
  ['Glazed donut', 'Dunkin', 'fast food dessert pastry', 'donut', 60, 260, 4, 31, 14, 12, 1, 330, 60, 20, 1.5, 0, 10, 0],
  ['Bacon Gouda sandwich', 'Starbucks', 'fast food breakfast sandwich', 'sandwich', 130, 370, 18, 32, 19, 3, 1, 830, 200, 250, 2, 0, 90, 0.6],
  ['Cake pop', 'Starbucks', 'fast food dessert', 'pop', 43, 160, 2, 22, 8, 18, 0, 105, 40, 20, 0.4, 0, 20, 0],
  // Shared sides
  ['Onion rings', 'generic', 'fast food side fried', 'order', 100, 410, 5, 45, 23, 5, 3, 600, 200, 80, 1, 2, 0, 0],
  ['Mozzarella sticks', 'generic', 'fast food side fried cheese', 'order', 120, 380, 17, 32, 20, 3, 2, 900, 150, 500, 1.5, 0, 150, 0.2],
  ['Chicken wings, 6 pc', 'generic', 'fast food chicken wings', 'order', 200, 580, 50, 5, 40, 1, 0, 1600, 450, 60, 2.5, 2, 90, 0.4],
  ['Milkshake, vanilla', 'generic', 'fast food dessert shake', 'medium', 400, 530, 12, 86, 15, 75, 0, 350, 700, 450, 0.5, 2, 200, 2],
];
