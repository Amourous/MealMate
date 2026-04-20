/**
 * Cloudflare Pages Function: AI Chat via Workers AI
 * This runs on the server-side in Cloudflare using the native AI binding.
 */
export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // 1. Check if AI binding is available
    if (!env.AI) {
        return new Response(JSON.stringify({ 
            error: 'AI Binding not found. Please ensure "AI" binding is added in your Cloudflare Pages settings.' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { message, history, language, dialect } = await request.json();

        let systemPrompt = 'You are MealMate AI, a helpful and slightly fun cooking assistant. You help users with recipes, ingredient substitutions, and meal planning. Keep your answers concise and helpful.';
        if (language && language !== 'en') systemPrompt += ` You MUST speak in the ${language} language.`;
        if (dialect) systemPrompt += ` You MUST use the ${dialect} dialect/accent.`;

        // 2. Prepare messages for Workers AI
        const safeHistory = Array.isArray(history) ? history : [];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...safeHistory.map(m => ({
                role: (m && m.role === 'ai') ? 'assistant' : 'user',
                content: (m && m.text) || ''
            })),
            { role: 'user', content: message }
        ];

        // 3. Run the AI Model (using Llama 3 8B instead of 3.1 to avoid 3046 timeout errors)
        const stream = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: messages,
            stream: true,
            max_tokens: 512,
            temperature: 0.7
        });

        // 4. Return the event stream
        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
        });

    } catch (err) {
        console.error('AI Error:', err);
        return new Response(JSON.stringify({ error: 'AI processing failed: ' + err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
