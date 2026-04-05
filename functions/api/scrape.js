/**
 * Cloudflare Pages Function: /api/scrape
 * Uses Jina AI to fetch markdown from a URL, then Workers AI to parse it into an organized recipe.
 */
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    if (!env.AI) {
        return new Response(JSON.stringify({
            error: 'AI binding not configured. Please ensure the AI binding is added in Cloudflare Pages settings.'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { url } = await request.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Fetch raw markdown of the webpage using Jina AI's reader
        const jinaResponse = await fetch('https://r.jina.ai/' + url, {
            headers: { 'Accept': 'text/plain' }
        });

        if (!jinaResponse.ok) {
            throw new Error(`Failed to fetch URL content (Status: ${jinaResponse.status})`);
        }

        const pageMarkdown = await jinaResponse.text();

        // 2. Strip navigation/boilerplate noise — keep up to 15000 chars
        const cleanedContent = pageMarkdown
            .replace(/\[.*?\]\(.*?\)/g, '')   // remove markdown links
            .replace(/#{1,6}\s*(menu|nav|navigation|footer|header|cookie|subscribe|newsletter)/gi, '')
            .trim()
            .substring(0, 15000);

        // 3. Pass markdown to Cloudflare Workers AI for structured JSON extraction
        const prompt = `You are an expert culinary AI assistant. Below is the scraped text of a recipe webpage.
The page may be in any language including Arabic, English, or others — extract faithfully in the original language.

Your ONLY job is to extract:
1. The recipe title
2. The exact list of ingredients (quantities + names as shown)
3. The step-by-step cooking instructions

Webpage Text:
---
${cleanedContent}
---

Return ONLY a strict JSON object with this exact structure:
{
    "title": "Recipe Title",
    "ingredients": ["1 cup milk", "2 eggs", "100g flour"],
    "instructions": "1. Do this.\\n2. Do that."
}

CRITICAL RULES:
- Extract ONLY from the webpage text above — do NOT invent or hallucinate ingredients.
- If the page is in Arabic, output the title, ingredients and instructions in Arabic.
- Do not output markdown formatting like \`\`\`json.
- Output ONLY the raw JSON object, nothing else.`;

        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: [
                {
                    role: 'system',
                    content: 'You are a precise data extractor. You always respond with valid JSON only, no code blocks, no explanation. Never invent ingredients — only use what is on the page.'
                },
                { role: 'user', content: prompt }
            ],
            stream: false,
            max_tokens: 3000,
            temperature: 0.1
        });

        const rawText = response.response || response.choices?.[0]?.message?.content || '';

        // Extract JSON from the response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI did not return valid JSON. Raw response: ' + rawText.substring(0, 200));
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.title || !parsed.ingredients || parsed.ingredients.length === 0) {
            throw new Error("Could not extract recipe from this page. The site may block scrapers.");
        }

        return new Response(JSON.stringify({
            title: parsed.title,
            ingredients: parsed.ingredients,
            instructions: parsed.instructions
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('AI Scraper Error:', err);
        return new Response(JSON.stringify({
            error: 'Failed to intelligently scrape URL',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
