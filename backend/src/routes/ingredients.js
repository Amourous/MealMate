const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/ingredients
router.get('/', (req, res) => {
    try {
        const ingredients = db.prepare('SELECT id, name, default_unit FROM ingredients ORDER BY name ASC').all();
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ error: 'Database error', message: err.message });
    }
});

module.exports = router;
