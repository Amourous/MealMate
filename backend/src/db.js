const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/mealmate.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });
db.pragma('foreign_keys = ON');

function migrate() {
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
        if (file.endsWith('.sql')) {
            console.log(`Applying migration: ${file}`);
            const schema = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            try {
                db.exec(schema);
            } catch (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Skipping alteration in ${file}: Column already exists.`);
                } else if (err.message.includes('already exists')) {
                    console.log(`Skipping creation in ${file}: Entity already exists.`);
                } else {
                    throw err;
                }
            }
        }
    }
    console.log('Migrations completed successfully.');
}

// Support CLI flag --migrate
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--migrate')) {
        migrate();
        process.exit(0);
    }
}

module.exports = {
    db,
    migrate
};
