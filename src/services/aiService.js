export const aiService = {
    /**
     * Sends a message to the MealMate Cloud AI (Grok).
     * Now uses a secure Cloudflare Function proxy to hide the API KEY.
     */
    chat: async (message, history = []) => {
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: history,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to connect to the Cloud AI brain');
            }

            const data = await response.json();
            return { 
                reply: data.reply || 'Error: Empty reply'
            };
        } catch (err) {
            console.error('Cloud AI Error:', err);
            throw err;
        }
    }
};
