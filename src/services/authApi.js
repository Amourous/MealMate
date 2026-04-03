import { supabase } from './supabaseClient.js';

export const authApi = {
    register: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });
        if (error) throw new Error(error.message);
        return { user: data.user, token: data.session?.access_token };
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        return { user: data.user, token: data.session?.access_token };
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    }
};
