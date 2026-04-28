import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    {
        ignores: [
            'dist',
            'node_modules',
            // Source-of-truth app lives at repo root; this is a duplicated submission snapshot
            'ElSayed-Omar_32105931_PSE',
            // Non-app artifacts
            'IEEE',
            'mealmate',
            // Backend is a separate app with its own tooling/config
            'backend',
        ],
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                AbortController: 'readonly',
                Promise: 'readonly',
                fetch: 'readonly',
                import: 'readonly',
                alert: 'readonly',
                Event: 'readonly',
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
            'no-unused-vars': 'off',
            'no-console': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    // Cloudflare Pages Functions (Fetch API runtime, ESM)
    {
        files: ['functions/**/*.js'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                Request: 'readonly',
                Response: 'readonly',
                fetch: 'readonly',
                Headers: 'readonly',
                URL: 'readonly',
            },
        },
    },
    // Netlify Functions (Node/CommonJS)
    {
        files: ['netlify/functions/**/*.js', '**/*.cjs', 'check_sqlite.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
            },
        },
    },
];
