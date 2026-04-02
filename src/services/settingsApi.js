import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export const settingsApi = {
    /**
     * Fetch settings from the backend and sync to local storage
     */
    syncFromServer: async () => {
        try {
            const data = await apiClient.get('/settings');
            if (data) {
                storageService.setSettingsLocalOnly(data);
            }
            return data;
        } catch (err) {
            console.error('Failed to sync settings from server', err);
        }
    },

    /**
     * Push settings to backend
     */
    pushToServer: async (settings) => {
        try {
            await apiClient.put('/settings', settings);
        } catch (err) {
            console.error('Failed to push settings to server', err);
        }
    }
};
