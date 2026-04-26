// netlify/functions/ai-chat.js
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing Cloudflare credentials in Netlify Environment Variables.' })
        };
    }

    try {
        const { message, history, language, dialect } = JSON.parse(event.body);

        let systemPrompt = 'You are MealMate AI, a helpful and slightly fun cooking assistant. You help users with recipes, ingredient substitutions, and meal planning. Keep your answers concise and helpful.';
        if (language && language !== 'en') systemPrompt += ` You MUST speak in the ${language} language.`;
        if (dialect) systemPrompt += ` You MUST use the ${dialect} dialect/accent.`;

        const safeHistory = Array.isArray(history) ? history : [];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...safeHistory.map(m => ({
                role: (m && m.role === 'ai') ? 'assistant' : 'user',
                content: (m && m.text) || ''
            })),
            { role: 'user', content: message }
        ];

        // Call the Cloudflare REST API directly
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                stream: true,
                max_tokens: 512,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Cloudflare API Error:', errBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Cloudflare API returned ${response.status}` })
            };
        }

        // Standard Netlify Functions don't easily stream responses in the traditional edge way,
        // but since early 2024 Netlify supports response streaming if you use the web streams API
        // or just return the body for standard functions if using Netlify Edge Functions.
        // For maximum compatibility, we will collect the chunks and send them back, or use the event stream.
        // Wait! Netlify Edge Functions support streaming naturally. Standard functions do not support SSE easily unless using AWS lambda stream API.
        // To keep it simple and perfectly working, we'll return the full text instead of streaming, 
        // OR we can make it a Netlify Edge Function by exporting a default function and adding config.

        // Actually, let's just make it a standard function returning a static JSON response to guarantee it works flawlessly without edge config.
        const staticResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                stream: false, // Turn off streaming for the Netlify Standard Function
                max_tokens: 512,
                temperature: 0.7
            })
        });

        const data = await staticResponse.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: data.result.response })
        };

    } catch (error) {
        console.error('AI Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
