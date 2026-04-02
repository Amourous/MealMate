const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/', async (req, res) => {
    try {
        const { recipeName, ingredients, servings } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI disabled. Missing GEMINI_API_KEY' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        You are a strict nutritionist AI. Calculate the estimated total nutritional macros for ONE serving of this recipe.
        Recipe Name: ${recipeName}
        Total Ingredients in Recipe:
        ${JSON.stringify(ingredients, null, 2)}
        Total Servings: ${servings}

        You MUST ONLY return a valid JSON object exactly matching this format, with numerical values representing grams/kcal. DO NOT return markdown formatting like \`\`\`json.
        {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
        `;
        
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Strip markdown backticks if AI hallucinates them despite instructions
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/```json|```/g, '').trim();
        }

        const macros = JSON.parse(responseText);

        res.json(macros);
    } catch (error) {
        console.error('Nutrition API Error:', error);
        res.status(500).json({ error: 'Failed to calculate macros.', details: error.message });
    }
});

module.exports = router;
