const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);

        // A highly-generalized scraper that tries to guess Recipe Title and Ingredients
        const title = $('h1').first().text().trim() || $('title').text().replace(/Recipe.*/i, '').trim();
        
        let ingredients = [];
        // Look for common class names containing 'ingredient'
        $('[class*="ingredient"]').each((i, el) => {
            const txt = $(el).text().replace(/\s+/g, ' ').trim();
            if (txt && txt.length > 2 && txt.length < 100) {
                ingredients.push(txt);
            }
        });

        // Deduplicate and slice to reasonable length
        ingredients = [...new Set(ingredients)].slice(0, 20);

        let instructions = [];
        $('[class*="instruction"], [class*="direction"], [class*="step"]').each((i, el) => {
            const txt = $(el).text().replace(/\s+/g, ' ').trim();
            if (txt && txt.length > 10) {
                instructions.push(txt);
            }
        });

        res.json({
            title,
            ingredients: ingredients.length > 0 ? ingredients : ["Could not auto-detect ingredients."],
            instructions: instructions.length > 0 ? instructions.join('\n') : "Could not auto-detect instructions. Please view on original site."
        });

    } catch (error) {
        console.error('Scrape Error:', error);
        res.status(500).json({ error: 'Failed to scrape URL' });
    }
});

module.exports = router;
