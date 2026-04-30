require('dotenv').config();
(async () => {
    const res = await fetch('https://r.jina.ai/https://www.recipetineats.com/chicken-stroganoff/');
    const pageMarkdown = await res.text();
    const prompt = `
        You are an expert culinary AI. Below is the full scraped text of a webpage. 
        Please extract the recipe title, a strict list of ingredients, and the step-by-step instructions.
        Format the instructions as a numbered string (e.g. "1. Do this.\\n2. Do that.").
        Format the ingredients as an array of strings.

        Webpage Text:
        ---
        ${pageMarkdown.substring(0, 6000)} 
        ---

        Return ONLY a strict JSON object matching this structure:
        {
            "title": "string",
            "ingredients": ["string", "string"],
            "instructions": "string"
        }
        `;

    const aiRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
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
        })
    });
    let resultText = data.result.response;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        resultText = jsonMatch[0];
    }
    console.log("Full Cloudflare API Response extracted JSON:");
    console.log(resultText);
})();
