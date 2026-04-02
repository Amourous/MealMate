const { db } = require('../src/db');

const seedData = () => {
    console.log('Seeding database...');

    // Ensure default user exists
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('Demo1234!', 10);
    db.prepare('INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(1, 'Demo User', 'demo@mealmate.com', hash);

    const insertIngredient = db.prepare('INSERT OR IGNORE INTO ingredients (name, default_unit) VALUES (?, ?)');
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const insertPrice = db.prepare('INSERT OR IGNORE INTO ingredient_prices (ingredient_id, price_per_unit, currency) VALUES (?, ?, ?)');

    const transaction = db.transaction(() => {
        // Tags
        const tags = ['Vegan', 'Vegetarian', 'Gluten-Free', 'High-Protein', 'Low-Carb', 'Breakfast', 'Lunch', 'Dinner', 'Italian', 'Mexican'];
        const tagMap = {};
        tags.forEach(name => {
            insertTag.run(name);
            const row = db.prepare('SELECT id FROM tags WHERE name = ?').get(name);
            tagMap[name] = row.id;
        });

        // Ingredients
        const ingredients = [
            { name: 'Oats', unit: 'g', price: 0.005 },
            { name: 'Milk', unit: 'ml', price: 0.002 },
            { name: 'Banana', unit: 'piece', price: 0.3 },
            { name: 'Peanut Butter', unit: 'g', price: 0.01 },
            { name: 'Bread', unit: 'slice', price: 0.1 },
            { name: 'Egg', unit: 'piece', price: 0.2 },
            { name: 'Cheese', unit: 'g', price: 0.015 },
            { name: 'Tomato', unit: 'piece', price: 0.5 },
            { name: 'Onion', unit: 'piece', price: 0.4 },
            { name: 'Garlic', unit: 'clove', price: 0.1 },
            { name: 'Pasta', unit: 'g', price: 0.003 },
            { name: 'Chicken Breast', unit: 'g', price: 0.012 },
            { name: 'Rice', unit: 'g', price: 0.002 },
            { name: 'Beans', unit: 'g', price: 0.004 },
            { name: 'Spinach', unit: 'g', price: 0.02 },
            { name: 'Olive Oil', unit: 'ml', price: 0.02 },
            { name: 'Salt', unit: 'g', price: 0.001 },
            { name: 'Black Pepper', unit: 'g', price: 0.05 },
            { name: 'Bell Pepper', unit: 'piece', price: 0.8 },
            { name: 'Avocado', unit: 'piece', price: 1.5 },
            { name: 'Cumin', unit: 'g', price: 0.1 },
            { name: 'Paprika', unit: 'g', price: 0.08 },
            { name: 'Ground Beef', unit: 'g', price: 0.015 },
            { name: 'Potato', unit: 'g', price: 0.002 },
            { name: 'Carrot', unit: 'piece', price: 0.2 },
            { name: 'Broccoli', unit: 'g', price: 0.008 },
            { name: 'Soy Sauce', unit: 'ml', price: 0.01 },
            { name: 'Ginger', unit: 'g', price: 0.05 },
            { name: 'Lemon', unit: 'piece', price: 0.5 },
            { name: 'Butter', unit: 'g', price: 0.015 },
            { name: 'Flour', unit: 'g', price: 0.002 },
            { name: 'Sugar', unit: 'g', price: 0.002 },
            { name: 'Yeast', unit: 'g', price: 0.1 },
            { name: 'Honey', unit: 'g', price: 0.02 },
            { name: 'Yogurt', unit: 'g', price: 0.005 },
            { name: 'Cucumber', unit: 'piece', price: 0.6 },
            { name: 'Lettuce', unit: 'head', price: 1.2 },
            { name: 'Bacon', unit: 'slice', price: 0.5 },
            { name: 'Salmon', unit: 'g', price: 0.03 },
            { name: 'Shrimp', unit: 'piece', price: 0.4 },
            { name: 'Oregano', unit: 'g', price: 0.1 },
            { name: 'Basil', unit: 'leaf', price: 0.05 },
            { name: 'Mozzarella', unit: 'g', price: 0.02 },
            { name: 'Parmesan', unit: 'g', price: 0.03 },
            { name: 'Tofu', unit: 'g', price: 0.008 },
            { name: 'Mushrooms', unit: 'g', price: 0.01 },
            { name: 'Cream', unit: 'ml', price: 0.01 },
            { name: 'Beef Steak', unit: 'g', price: 0.04 },
            { name: 'Tortilla', unit: 'piece', price: 0.3 },
            { name: 'Chili Powder', unit: 'g', price: 0.08 },
            { name: 'Cilantro', unit: 'g', price: 0.15 },
            { name: 'Lime', unit: 'piece', price: 0.4 },
            { name: 'Corn', unit: 'g', price: 0.005 },
            { name: 'Oyster Sauce', unit: 'ml', price: 0.02 },
            { name: 'Sesame Oil', unit: 'ml', price: 0.03 },
            { name: 'Quinoa', unit: 'g', price: 0.01 },
            { name: 'Lentils', unit: 'g', price: 0.003 },
            { name: 'Chickpeas', unit: 'g', price: 0.004 },
            { name: 'Coconut Milk', unit: 'ml', price: 0.01 },
            { name: 'Curry Powder', unit: 'g', price: 0.1 }
        ];

        const ingredientMap = {};
        ingredients.forEach(ing => {
            insertIngredient.run(ing.name, ing.unit);
            const row = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ing.name);
            ingredientMap[ing.name] = row.id;
            insertPrice.run(row.id, ing.price, 'USD');
        });

        // Recipes
        const recipes = [
            {
                title: 'Simple Oatmeal',
                instructions: '1. In a small saucepan, bring the milk to a gentle simmer over medium heat.\n2. Stir in the rolled oats and reduce the heat to low.\n3. Cook for 5-7 minutes, stirring occasionally, until the oats are creamy and have absorbed most of the liquid.\n4. Remove the saucepan from the heat and let it sit for a minute to thicken further.\n5. Transfer the cooked oatmeal to a serving bowl.\n6. Top generously with freshly sliced banana and a drizzle or dollop of peanut butter.\n7. Serve warm and enjoy your nutritious breakfast!',
                servings: 1,
                tags: ['Breakfast', 'Vegan', 'Healthy'],
                ingredients: [
                    { name: 'Oats', quantity: 50, unit: 'g' },
                    { name: 'Milk', quantity: 200, unit: 'ml' },
                    { name: 'Banana', quantity: 1, unit: 'piece' },
                    { name: 'Peanut Butter', quantity: 15, unit: 'g' }
                ]
            },
            {
                title: 'Classic Tomato Pasta',
                instructions: '1. Bring a large pot of generously salted water to a rolling boil.\n2. Add the pasta and cook according to the package instructions until al dente.\n3. Meanwhile, heat the olive oil in a large skillet over medium heat.\n4. Add the finely diced onion and sauté for 3-4 minutes until translucent and aromatic.\n5. Stir in the minced garlic and cook for an additional 30 seconds until fragrant, being careful not to burn it.\n6. Add the chopped fresh tomatoes to the skillet, along with a pinch of salt and pepper.\n7. Lower the heat and let the sauce simmer gently for 10-15 minutes until it thickens into a rich rustic sauce.\n8. Drain the pasta, reserving a small splash of pasta water, and toss the pasta directly into the skillet with the tomato sauce.\n9. Tear fresh basil leaves over the top and gently mix everything together.\n10. Serve hot, optionally garnished with extra olive oil and a sprinkle of parmesan cheese.',
                servings: 2,
                tags: ['Lunch', 'Dinner', 'Italian', 'Vegetarian'],
                ingredients: [
                    { name: 'Pasta', quantity: 200, unit: 'g' },
                    { name: 'Tomato', quantity: 3, unit: 'piece' },
                    { name: 'Garlic', quantity: 2, unit: 'clove' },
                    { name: 'Onion', quantity: 1, unit: 'piece' },
                    { name: 'Olive Oil', quantity: 20, unit: 'ml' },
                    { name: 'Basil', quantity: 5, unit: 'leaf' }
                ]
            },
            {
                title: 'Chicken Stir-Fry',
                instructions: '1. Prepare your ingredients by cutting the chicken breast into bite-sized bite cubes, slicing the carrots into thin matchsticks, and cutting the broccoli into small florets.\n2. Heat the sesame oil in a large wok or deep skillet over medium-high heat until shimmering.\n3. Add the chicken pieces to the wok and stir-fry for 4-5 minutes until browned on all sides and cooked through.\n4. Remove the chicken from the wok and set aside on a plate.\n5. In the same wok, add a little extra oil if needed, then toss in the broccoli, carrots, and freshly minced ginger.\n6. Stir-fry the vegetables for 3-5 minutes until tender yet still crisp.\n7. Return the chicken to the wok.\n8. Pour the soy sauce over the mixture and toss continuously for 1-2 minutes until everything is evenly coated and heated through.\n9. Serve immediately over steamed rice or noodles.',
                servings: 2,
                tags: ['Dinner', 'High-Protein'],
                ingredients: [
                    { name: 'Chicken Breast', quantity: 300, unit: 'g' },
                    { name: 'Broccoli', quantity: 150, unit: 'g' },
                    { name: 'Carrot', quantity: 1, unit: 'piece' },
                    { name: 'Soy Sauce', quantity: 30, unit: 'ml' },
                    { name: 'Ginger', quantity: 10, unit: 'g' },
                    { name: 'Sesame Oil', quantity: 5, unit: 'ml' }
                ]
            },
            {
                title: 'Beef Tacos',
                instructions: '1. Heat a large skillet over medium-high heat.\n2. Add the ground beef, breaking it apart with a wooden spoon as it cooks.\n3. Continue cooking for 6-8 minutes until the beef is fully browned with no pink remaining, then carefully drain any excess fat.\n4. Stir the chili powder, cumin, and a splash of water into the beef.\n5. Simmer on low heat for 3-5 minutes, allowing the taco spices to deeply flavor the meat.\n6. While the meat simmers, warm the tortillas in a dry skillet or microwave until soft and pliable.\n7. Halve the avocado, remove the pit, and slice the flesh thinly.\n8. Cut the lime into wedges.\n9. Build your tacos by spooning a generous portion of the spiced beef into the center of each warm tortilla.\n10. Garnish with avocado slices and a fresh squeeze of lime juice before serving.',
                servings: 3,
                tags: ['Dinner', 'Mexican'],
                ingredients: [
                    { name: 'Ground Beef', quantity: 400, unit: 'g' },
                    { name: 'Tortilla', quantity: 6, unit: 'piece' },
                    { name: 'Avocado', quantity: 1, unit: 'piece' },
                    { name: 'Lime', quantity: 1, unit: 'piece' },
                    { name: 'Chili Powder', quantity: 5, unit: 'g' },
                    { name: 'Cumin', quantity: 5, unit: 'g' }
                ]
            },
            {
                title: 'Lentil Soup',
                instructions: '1. Begin by thoroughly rinsing the lentils under cold running water in a fine mesh sieve until the water runs clear. Set aside.\n2. Finely dice the onions and carrots, and mince the garlic cloves.\n3. In a large heavy-bottomed soup pot or Dutch oven, heat a tablespoon of olive oil or water over medium heat.\n4. Add the diced onions and carrots, sautéing for 5-7 minutes until they are softened and the onions are translucent.\n5. Stir in the minced garlic and cook for 1 more minute until aromatic.\n6. Add the rinsed lentils to the pot, then pour in the vegetable broth.\n7. Bring the soup to a rolling boil, then immediately reduce the heat to low.\n8. Cover the pot and let the soup simmer very gently for 25-30 minutes, or until the lentils are completely tender and starting to break down.\n9. Stir the soup well. If you prefer a creamier texture, you can lightly blend a portion of the soup.\n10. Season generously with salt and pepper to taste before ladling into warm bowls.',
                servings: 4,
                tags: ['Lunch', 'Vegan', 'Healthy'],
                ingredients: [
                    { name: 'Lentils', quantity: 250, unit: 'g' },
                    { name: 'Onion', quantity: 1, unit: 'piece' },
                    { name: 'Carrot', quantity: 2, unit: 'piece' },
                    { name: 'Garlic', quantity: 3, unit: 'clove' },
                    { name: 'Vegetable Broth', quantity: 1000, unit: 'ml' }
                ]
            },
            {
                title: 'Greek Salad',
                instructions: 'Chop cucumber, tomato, and onion. Mix with olives, feta, and olive oil.',
                servings: 2,
                tags: ['Lunch', 'Vegetarian', 'Gluten-Free'],
                ingredients: [
                    { name: 'Cucumber', quantity: 1, unit: 'piece' },
                    { name: 'Tomato', quantity: 2, unit: 'piece' },
                    { name: 'Onion', quantity: 0.5, unit: 'piece' },
                    { name: 'Olive Oil', quantity: 15, unit: 'ml' },
                    { name: 'Lemon', quantity: 0.5, unit: 'piece' }
                ]
            },
            {
                title: 'Veggie Omelette',
                instructions: 'Whisk eggs. Sauté spinach and mushrooms. Pour eggs and top with cheese.',
                servings: 1,
                tags: ['Breakfast', 'Vegetarian', 'High-Protein'],
                ingredients: [
                    { name: 'Egg', quantity: 3, unit: 'piece' },
                    { name: 'Spinach', quantity: 50, unit: 'g' },
                    { name: 'Mushrooms', quantity: 50, unit: 'g' },
                    { name: 'Cheese', quantity: 30, unit: 'g' },
                    { name: 'Butter', quantity: 10, unit: 'g' }
                ]
            },
            {
                title: 'Beef & Broccoli',
                instructions: 'Thinly slice beef. Sauté with broccoli, soy sauce, and garlic.',
                servings: 2,
                tags: ['Dinner', 'High-Protein', 'Low-Carb'],
                ingredients: [
                    { name: 'Beef Steak', quantity: 300, unit: 'g' },
                    { name: 'Broccoli', quantity: 200, unit: 'g' },
                    { name: 'Soy Sauce', quantity: 20, unit: 'ml' },
                    { name: 'Garlic', quantity: 2, unit: 'clove' },
                    { name: 'Sesame Oil', quantity: 5, unit: 'ml' }
                ]
            },
            {
                title: 'Shrimp Scampi',
                instructions: 'Sauté shrimp in butter and garlic. Toss with pasta and lemon juice.',
                servings: 2,
                tags: ['Dinner', 'Italian'],
                ingredients: [
                    { name: 'Shrimp', quantity: 10, unit: 'piece' },
                    { name: 'Pasta', quantity: 150, unit: 'g' },
                    { name: 'Butter', quantity: 30, unit: 'g' },
                    { name: 'Garlic', quantity: 3, unit: 'clove' },
                    { name: 'Lemon', quantity: 1, unit: 'piece' }
                ]
            },
            {
                title: 'Quinoa Bowl',
                instructions: 'Cook quinoa. Top with black beans, corn, avocado, and cilantro.',
                servings: 2,
                tags: ['Lunch', 'Vegan', 'Gluten-Free'],
                ingredients: [
                    { name: 'Quinoa', quantity: 150, unit: 'g' },
                    { name: 'Beans', quantity: 100, unit: 'g' },
                    { name: 'Corn', quantity: 50, unit: 'g' },
                    { name: 'Avocado', quantity: 1, unit: 'piece' },
                    { name: 'Cilantro', quantity: 10, unit: 'g' }
                ]
            },
            {
                title: 'Salmon with Asparagus',
                instructions: 'Bake salmon and asparagus with lemon and olive oil at 200°C for 15 mins.',
                servings: 2,
                tags: ['Dinner', 'Healthy', 'Gluten-Free'],
                ingredients: [
                    { name: 'Salmon', quantity: 300, unit: 'g' },
                    { name: 'Olive Oil', quantity: 20, unit: 'ml' },
                    { name: 'Lemon', quantity: 1, unit: 'piece' },
                    { name: 'Salt', quantity: 2, unit: 'g' }
                ]
            },
            {
                title: 'Classic Burger',
                instructions: 'Grill beef patty. Serve in bun with lettuce, tomato, and cheese.',
                servings: 1,
                tags: ['Dinner'],
                ingredients: [
                    { name: 'Ground Beef', quantity: 200, unit: 'g' },
                    { name: 'Bread', quantity: 1, unit: 'piece' },
                    { name: 'Cheese', quantity: 1, unit: 'slice' },
                    { name: 'Tomato', quantity: 1, unit: 'slice' },
                    { name: 'Lettuce', quantity: 2, unit: 'leaf' }
                ]
            },
            {
                title: 'Berry Smoothie',
                instructions: 'Blend yogurt, milk, and honey with frozen berries.',
                servings: 1,
                tags: ['Breakfast', 'Healthy'],
                ingredients: [
                    { name: 'Yogurt', quantity: 200, unit: 'g' },
                    { name: 'Milk', quantity: 100, unit: 'ml' },
                    { name: 'Honey', quantity: 15, unit: 'g' }
                ]
            },
            {
                title: 'Potato Salad',
                instructions: 'Boil potatoes. Mix with onions, mayonnaise, and herbs.',
                servings: 4,
                tags: ['Lunch', 'Vegetarian'],
                ingredients: [
                    { name: 'Potato', quantity: 800, unit: 'g' },
                    { name: 'Onion', quantity: 1, unit: 'piece' }
                ]
            },
            {
                title: 'Tofu Curry',
                instructions: 'Sauté tofu with onions and garlic. Add coconut milk and curry powder.',
                servings: 2,
                tags: ['Dinner', 'Vegan', 'Gluten-Free'],
                ingredients: [
                    { name: 'Tofu', quantity: 400, unit: 'g' },
                    { name: 'Coconut Milk', quantity: 400, unit: 'ml' },
                    { name: 'Curry Powder', quantity: 15, unit: 'g' },
                    { name: 'Onion', quantity: 1, unit: 'piece' }
                ]
            }
        ];

        // Check if recipes already exist
        const existingRecipesCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
        if (existingRecipesCount >= recipes.length) {
            console.log(`[SEED] Found ${existingRecipesCount} recipes already in database. Skipping recipe source-of-truth seed.`);
        } else {
            console.log(`[SEED] Syncing ${recipes.length} recipes...`);

            ['Vegetable Broth'].forEach(name => {
                if (!ingredientMap[name]) {
                    insertIngredient.run(name, 'ml');
                    const row = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(name);
                    ingredientMap[name] = row.id;
                    insertPrice.run(row.id, 0.001, 'USD');
                }
            });

            recipes.forEach(r => {
                db.prepare('INSERT OR IGNORE INTO recipes (user_id, title, instructions, default_servings) VALUES (?, ?, ?, ?)')
                    .run(1, r.title, r.instructions, r.servings || 1);

                const recRow = db.prepare('SELECT id FROM recipes WHERE user_id = ? AND title = ?').get(1, r.title);
                const recipeId = recRow.id;

                r.tags.forEach(tagName => {
                    if (tagMap[tagName]) {
                        db.prepare('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)').run(recipeId, tagMap[tagName]);
                    }
                });

                r.ingredients.forEach(ing => {
                    const ingredientId = ingredientMap[ing.name];
                    if (ingredientId) {
                        db.prepare('INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)').run(recipeId, ingredientId, ing.quantity, ing.unit);
                    }
                });
            });
        }

        // Meal Plan
        const weekStart = '2026-03-02';
        const existingMealPlan = db.prepare('SELECT id FROM meal_plans WHERE week_start_date = ?').get(weekStart);

        if (existingMealPlan) {
            console.log(`[SEED] Meal plan for ${weekStart} already exists. Skipping.`);
        } else {
            console.log(`[SEED] Creating meal plan for ${weekStart}...`);
            const resultMealPlan = db.prepare('INSERT INTO meal_plans (user_id, week_start_date, weekly_budget) VALUES (?, ?, ?)')
                .run(1, weekStart, 50.0);
            const mealPlanId = resultMealPlan.lastInsertRowid;

            const insertMealItem = db.prepare('INSERT OR IGNORE INTO meal_plan_items (meal_plan_id, day_of_week, meal_type, recipe_id, servings) VALUES (?, ?, ?, ?, ?)');
            const recipeIDs = db.prepare('SELECT id FROM recipes LIMIT 5').all().map(r => r.id);

            for (let day = 0; day < 7; day++) {
                insertMealItem.run(mealPlanId, day, 'Lunch', recipeIDs[day % recipeIDs.length], 2);
                insertMealItem.run(mealPlanId, day, 'Dinner', recipeIDs[(day + 1) % recipeIDs.length], 2);
            }
        }

        // Pantry
        console.log('[SEED] Syncing pantry items...');
        const insertPantry = db.prepare('INSERT OR IGNORE INTO pantry_items (user_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)');
        const commonIngs = ['Oats', 'Milk', 'Pasta', 'Rice', 'Olive Oil', 'Salt', 'Onion', 'Garlic', 'Sugar', 'Flour'];
        commonIngs.forEach(name => {
            insertPantry.run(1, ingredientMap[name], 500, 'g');
        });

    });

    transaction();
    console.log('Seeding process finished.');
};

seedData();
process.exit(0);
