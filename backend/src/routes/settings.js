const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Since we have a simple auth system, we assume user_id 1 like the rest of the backend
const USER_ID = 1;

// GET /api/settings - Get user settings
router.get('/', (req, res) => {
    try {
        let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(USER_ID);
        if (!settings) {
            // Initialize default settings if not exists
            db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(USER_ID);
            settings = { user_id: USER_ID, budget: 40, currency: '€', recipe_servings_json: '{}' };
        }
        res.json({
            ...settings,
            recipeServings: JSON.parse(settings.recipe_servings_json || '{}')
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error', message: err.message });
    }
});

// PUT /api/settings - Update user settings
router.put('/', (req, res) => {
    const { budget, currency, recipeServings } = req.body;
    try {
        const current = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(USER_ID);
        if (!current) {
            db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(USER_ID);
        }

        const updateStmt = db.prepare(`
            UPDATE user_settings 
            SET budget = COALESCE(?, budget), 
                currency = COALESCE(?, currency), 
                recipe_servings_json = COALESCE(?, recipe_servings_json)
            WHERE user_id = ?
        `);
        
        updateStmt.run(
            budget, 
            currency, 
            recipeServings ? JSON.stringify(recipeServings) : null, 
            USER_ID
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', message: err.message });
    }
});

module.exports = router;
