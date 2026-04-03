const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = path.resolve(__dirname, 'backend', 'data', 'mealmate.db');
const db = new Database(dbPath);

async function migrate() {
    console.log('🚀 Starting Data Migration...');

    try {
        // 1. Get recipes from SQLite
        const recipes = db.prepare('SELECT * FROM recipes').all();
        console.log(`Found ${recipes.length} recipes in local DB.`);

        // 2. Get current user from Supabase (to assign user_id)
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        // Since we are using anon key, we can't use auth.admin. List might fail.
        // Instead, we'll try to find the user omar.elsayed94@hotmail.com if any
        // Or we'll just use the ID we saw earlier: da707b04-d72e-4380-9384-2584439ee33a
        const targetUserId = 'da707b04-d72e-4380-9384-2584439ee33a';

        for (const recipe of recipes) {
            console.log(`Migrating: ${recipe.title || recipe.name}`);
            
            // Smart Parse Instructions: Split by "1. ", "2. ", etc. (using Regex)
            let rawInstructions = recipe.instructions || '';
            let steps = [];

            if (typeof rawInstructions === 'string' && rawInstructions.startsWith('[')) {
                try { steps = JSON.parse(rawInstructions); } catch(e) { steps = [rawInstructions]; }
            } else if (typeof rawInstructions === 'string') {
                // regex matches "1. ", "2) ", etc.
                steps = rawInstructions.split(/\s*\d+[\.\)]\s*/).filter(Boolean);
                // Fallback if no numbers found
                if (steps.length <= 1) {
                    steps = rawInstructions.split('\n').filter(Boolean);
                }
            } else if (Array.isArray(rawInstructions)) {
                steps = rawInstructions;
            }

            console.log(`   📝 Parsed ${steps.length} steps.`);

            const { data: newRecipe, error: recipeError } = await supabase
                .from('recipes')
                .upsert({
                    user_id: targetUserId,
                    title: recipe.title || recipe.name,
                    instructions: JSON.stringify(steps),
                    default_servings: recipe.servings || recipe.default_servings || 1,
                    is_public: true, // Mark all as public for Community tab visibility
                    author_name: 'Omar'
                }, { onConflict: 'user_id, title' })
                .select()
                .single();

            if (recipeError) {
                console.error(`❌ Error migrating ${recipe.title}:`, recipeError.message, recipeError.details || '', recipeError.hint || '');
                continue;
            }

            // 3. Migrate ingredients (if needed)
            // SQLite has ingredients linked in recipe_ingredients
            const ingredients = db.prepare('SELECT i.name, ri.quantity, ri.unit FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id WHERE ri.recipe_id = ?').all(recipe.id);
            
            for (const ing of ingredients) {
                // Upsert ingredient
                const { data: cloudIng } = await supabase
                    .from('ingredients')
                    .upsert({ name: ing.name }, { onConflict: 'name' })
                    .select()
                    .single();

                if (cloudIng) {
                    await supabase.from('recipe_ingredients').upsert({
                        recipe_id: newRecipe.id,
                        ingredient_id: cloudIng.id,
                        quantity: ing.quantity,
                        unit: ing.unit
                    }, { onConflict: 'recipe_id, ingredient_id' });
                }
            }
        }

        console.log('✅ Migration Finished!');
    } catch (err) {
        console.error('❌ Migration Critical Error:', err);
    } finally {
        db.close();
    }
}

migrate();
