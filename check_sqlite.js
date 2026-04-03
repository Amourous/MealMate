const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mealmate.db');
const db = new Database(dbPath);

try {
    const row = db.prepare('SELECT count(*) as count FROM recipes').get();
    console.log(`✅ SUCCESS: Found ${row.count} recipes in SQLite.`);
} catch (err) {
    console.error(`❌ ERROR: Could not read SQLite: ${err.message}`);
}
db.close();
