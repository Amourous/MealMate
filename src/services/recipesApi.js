import { supabase } from './supabaseClient.js';

const RECIPE_SELECT = `
    *,
    recipe_ingredients(quantity, unit, ingredients(name)),
    recipe_tags(tags(name))
`;

/**
 * Maps Supabase recipe row (with joins) to frontend recipe shape
 */
function mapRecipe(r) {
    if (!r) return r;

    let instructions = r.instructions;
    if (typeof instructions === 'string') {
        try {
            instructions = JSON.parse(instructions);
        } catch (e) {
            instructions = instructions.split('\n').filter(Boolean);
        }
    }

    const ingredients = (r.recipe_ingredients || []).map(ri => ({
        name: ri.ingredients?.name || 'Unknown',
        quantity: ri.quantity,
        unit: ri.unit,
    }));

    const dietTags = (r.recipe_tags || [])
        .map(rt => rt.tags?.name)
        .filter(Boolean);

    return {
        ...r,
        name: r.title || r.name || 'Untitled Recipe',
        servings: r.default_servings || r.servings || 1,
        prepTime: r.prepTime || 20,
        description: r.description || 'A delicious meal.',
        category: r.category || 'Main Course',
        dietTags,
        ingredients,
        instructions: Array.isArray(instructions) ? instructions : [instructions].filter(Boolean),
        estimatedCostPerServing: parseFloat(r.estimated_cost_per_serving || r.estimatedCostPerServing || 5.0),
    };
}

export const recipesApi = {
    /**
     * Fetch all recipes belonging to the current user
     */
    getAll: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('recipes')
            .select(RECIPE_SELECT)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapRecipe);
    },

    /**
     * Fetch all public/community recipes
     */
    getCommunity: async () => {
        const { data, error } = await supabase
            .from('recipes')
            .select(RECIPE_SELECT)
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapRecipe);
    },

    /**
     * Fetch a single recipe by ID
     */
    getById: async (id) => {
        const { data, error } = await supabase
            .from('recipes')
            .select(RECIPE_SELECT)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return mapRecipe(data);
    },

    /**
     * Create a new recipe with ingredients and tags
     */
    create: async (recipe) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Insert the recipe
        const { data: newRecipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
                user_id: user.id,
                title: recipe.title || recipe.name,
                instructions: Array.isArray(recipe.instructions)
                    ? JSON.stringify(recipe.instructions)
                    : recipe.instructions,
                default_servings: recipe.servings || recipe.default_servings || 1,
                is_public: recipe.is_public || false,
                author_name: user.user_metadata?.name || user.email,
            })
            .select()
            .single();

        if (recipeError) throw new Error(recipeError.message);

        // 2. Upsert ingredients and link to recipe
        const ingredients = recipe.ingredients || [];
        for (const ing of ingredients) {
            const name = typeof ing === 'string' ? ing : (ing.name || 'Unknown');

            const { data: ingredient } = await supabase
                .from('ingredients')
                .upsert({ name }, { onConflict: 'name' })
                .select()
                .single();

            if (ingredient) {
                await supabase.from('recipe_ingredients').insert({
                    recipe_id: newRecipe.id,
                    ingredient_id: ingredient.id,
                    quantity: parseFloat(ing.quantity) || 1,
                    unit: ing.unit || 'pcs',
                });
            }
        }

        // 3. Upsert tags and link to recipe
        const tagNames = recipe.dietTags || recipe.tags || [];
        for (const tagEntry of tagNames) {
            const name = typeof tagEntry === 'string' ? tagEntry : tagEntry.name;
            if (!name) continue;

            const { data: tag } = await supabase
                .from('tags')
                .upsert({ name }, { onConflict: 'name' })
                .select()
                .single();

            if (tag) {
                await supabase.from('recipe_tags').insert({
                    recipe_id: newRecipe.id,
                    tag_id: tag.id,
                });
            }
        }

        return newRecipe;
    },

    /**
     * Delete a recipe by ID
     */
    delete: async (id) => {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { message: 'Deleted' };
    },
};
