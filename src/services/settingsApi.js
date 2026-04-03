import { supabase } from './supabaseClient.js';
import { storageService } from './storageService.js';

export const settingsApi = {
    /**
     * Fetch settings from Supabase and sync to local storage
     */
    syncFromServer: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // PGRST116 = row not found (user has no settings yet) - that's OK
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                storageService.setSettingsLocalOnly(data);
            }
            return data;
        } catch (err) {
            console.error('Failed to sync settings from server', err);
        }
    },

    /**
     * Push settings to Supabase (upsert - creates or updates)
     */
    pushToServer: async (settings) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    budget: settings.budget,
                    currency: settings.currency,
                    recipe_servings_json: settings.recipe_servings_json || settings.recipeServings || {},
                }, { onConflict: 'user_id' });

            if (error) throw error;
        } catch (err) {
            console.error('Failed to push settings to server', err);
        }
    }
};
