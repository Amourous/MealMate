import { supabase } from './supabaseClient.js';

function mapPantryItem(item) {
    if (!item) return item;
    return {
        ...item,
        name: item.ingredients?.name || item.name || 'Unknown',
        qty: item.quantity !== undefined ? item.quantity : item.qty,
        quantity: item.quantity !== undefined ? item.quantity : item.qty,
    };
}

export const pantryApi = {
    /**
     * Fetch all pantry items for the current user
     */
    getAll: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('pantry_items')
            .select('*, ingredients(name)')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapPantryItem);
    },

    /**
     * Add an item to the pantry
     */
    create: async (item) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Upsert the ingredient first to get its ID
        const { data: ingredient, error: ingError } = await supabase
            .from('ingredients')
            .upsert({ name: item.name || 'Unknown' }, { onConflict: 'name' })
            .select()
            .single();

        if (ingError) throw new Error(ingError.message);

        const { data, error } = await supabase
            .from('pantry_items')
            .insert({
                user_id: user.id,
                ingredient_id: ingredient.id,
                quantity: parseFloat(item.quantity || item.qty) || 0,
                unit: item.unit || 'pcs',
                expiry_date: item.expiry_date || null,
            })
            .select('*, ingredients(name)')
            .single();

        if (error) throw new Error(error.message);
        return mapPantryItem(data);
    },

    /**
     * Update quantity/unit of an existing pantry item
     */
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('pantry_items')
            .update({
                quantity: updates.quantity ?? updates.qty,
                unit: updates.unit,
            })
            .eq('id', id)
            .select('*, ingredients(name)')
            .single();

        if (error) throw new Error(error.message);
        return mapPantryItem(data);
    },

    /**
     * Remove a pantry item by ID
     */
    delete: async (id) => {
        const { error } = await supabase
            .from('pantry_items')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { message: 'Deleted' };
    },
};
