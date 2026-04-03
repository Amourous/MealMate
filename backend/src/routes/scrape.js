const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // 1. Fetch raw markdown of the webpage using Jina AI's reader
        const { data: pageMarkdown } = await axios.get('https://r.jina.ai/' + url, {
            headers: { 'Accept': 'text/plain' }
        });

        // 2. Pass markdown to Ollama for structured JSON extraction
        const prompt = `
        You are an expert culinary AI. Below is the full scraped text of a webpage. 
        Please extract the recipe title, a strict list of ingredients, and the step-by-step instructions.
        Format the instructions as a numbered string (e.g. "1. Do this.\\n2. Do that.").
        Format the ingredients as an array of strings.

        Webpage Text:
        ---
        ${pageMarkdown.substring(0, 8000)} 
        ---

        Return ONLY a strict JSON object matching this structure:
        {
            "title": "string",
            "ingredients": ["string", "string"],
            "instructions": "string"
        }
        `;

        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: prompt,
                stream: false,
                format: 'json'
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const aiData = await response.json();
        const parsed = JSON.parse(aiData.response);

        // If it failed to extract anything meaningful (e.g. captcha page), throw error to trigger frontend demo mode
        if (!parsed.title || !parsed.ingredients || parsed.ingredients.length === 0) {
            throw new Error("Could not extract recipe from this page (bot protection).");
        }

        res.json({
            title: parsed.title,
            ingredients: parsed.ingredients,
            instructions: parsed.instructions
        });

    } catch (error) {
        console.error('AI Scraper Error:', error);
        res.status(500).json({ error: 'Failed to intelligently scrape URL', details: error.message });
    }
});

module.exports = router;
