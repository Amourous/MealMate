const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI is disabled. Please add a GEMINI_API_KEY to your .env file.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = "You are the MealMate AI Assistant. You help users decide what to cook based on their ingredients, and you provide complete cooking recipes when asked. Keep your answers concise, well-formatted, and enthusiastic.";

        const response = await model.generateContent(systemPrompt + '\n\nUser: ' + message);

        res.json({ reply: response.response.text() });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'AI processing failed', details: error.message });
    }
});

module.exports = router;
