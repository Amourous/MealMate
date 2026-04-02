require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { db } = require('./db');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:8080',
        'https://mealmate-835.pages.dev'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/', apiLimiter);

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
const recipesRouter = require('./routes/recipes');
const mealplansRouter = require('./routes/mealplans');
const pantryRouter = require('./routes/pantry');
const tagsRouter = require('./routes/tags');
const pricesRouter = require('./routes/prices');
const settingsRouter = require('./routes/settings');
const ingredientsRouter = require('./routes/ingredients');
const aiRouter = require('./routes/ai');
const scrapeRouter = require('./routes/scrape');
const { router: authRouter } = require('./routes/auth');

app.use('/api/recipes', recipesRouter);
app.use('/api/mealplans', mealplansRouter);
app.use('/api/pantry', pantryRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`MealMate Backend listening on port ${PORT}`);
});
