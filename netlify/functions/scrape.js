// netlify/functions/scrape.js

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
        const { url } = JSON.parse(event.body);
        if (!url) {
            return { statusCode: 400, body: JSON.stringify({ error: 'URL is required' }) };
        }

        // 1. Fetch raw markdown of the webpage using Jina AI's reader
        // 1. Fetch raw markdown of the webpage using Jina AI's reader
        const jinaResponse = await fetch('https://r.jina.ai/' + url, {
            headers: { 'Accept': 'text/plain' },
            signal: AbortSignal.timeout(4000)
        });

        if (!jinaResponse.ok) {
             throw new Error(`Jina AI error: ${jinaResponse.status}`);
        }
        
        const pageMarkdown = await jinaResponse.text();

        // 2. Pass markdown to Cloudflare AI for structured JSON extraction
        const prompt = \`
        You are an expert culinary AI. Below is the full scraped text of a webpage. 
        Please extract the recipe title, a strict list of ingredients, and the step-by-step instructions.
        Format the instructions as a numbered string (e.g. "1. Do this.\\n2. Do that.").
        Format the ingredients as an array of objects. 
        
        CRITICAL INSTRUCTION FOR INGREDIENTS:
        You MUST separate the quantity, the unit, and the ingredient name.
        Do NOT put the quantity or unit inside the "name" field.
        Example: "2 cups of flour" -> {"name": "flour", "quantity": 2, "unit": "cup"}
        Example: "0.5 tsp salt" -> {"name": "salt", "quantity": 0.5, "unit": "tsp"}
        Example: "3 apples" -> {"name": "apples", "quantity": 3, "unit": "pcs"}
        If there is no unit, use "pcs" or "".

        Webpage Text:
        ---
        \${pageMarkdown.substring(0, 3000)} 
        ---

        Return ONLY a strict JSON object matching this structure:
        {
            "title": "string",
            "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
            "instructions": "string"
        }
        \`;

        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a strict JSON formatter. Do not output any markdown formatting like ```json or ```, just the raw JSON object.' },
                    { role: 'user', content: prompt }
                ],
                stream: false,
                max_tokens: 1024,
                temperature: 0.2
            }),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Cloudflare API Error:', errBody);
            throw new Error(`Cloudflare API returned ${response.status}`);
        }

        const data = await response.json();
        
        let resultText = data.result.response;
        
        // Clean up markdown code blocks or conversational text
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            resultText = jsonMatch[0];
        }

        let parsed;
        try {
            parsed = JSON.parse(resultText);
        } catch (parseError) {
            console.error('Failed to parse JSON from AI:', resultText);
            throw new Error('AI returned invalid JSON: ' + resultText);
        }

        if (!parsed.title || !parsed.ingredients || parsed.ingredients.length === 0) {
            throw new Error("Could not extract recipe from this page.");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: parsed.title,
                ingredients: parsed.ingredients,
                instructions: parsed.instructions
            })
        };

    } catch (error) {
        console.error('AI Scraper Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to intelligently scrape URL', details: error.message })
        };
    }
};
