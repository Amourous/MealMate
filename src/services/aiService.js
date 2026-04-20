export const aiService = {
    /**
     * Sends a message to MealMate AI (powered by Cloudflare Workers AI).
     * Uses a Cloudflare Pages Function as a secure proxy to the AI binding.
     */
    chat: async (message, history = [], settings = {}, onChunk) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: history,
                    language: settings.language || 'en',
                    dialect: settings.dialect || ''
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to connect to the Cloud AI brain');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.response) {
                                fullReply += data.response;
                                if (onChunk) onChunk(fullReply);
                            }
                        } catch (e) {
                            // ignore parse errors for partial chunks
                        }
                    }
                }
            }

            return { reply: fullReply || 'Error: Empty reply' };
        } catch (err) {
            console.error('Cloud AI Error:', err);
            throw err;
        }
    }
};
