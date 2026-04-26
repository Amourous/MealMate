import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './components/Authentication/AuthContext.jsx';
import AIAssistantModal from './components/AIAssistantModal/AIAssistantModal.jsx';
import { settingsApi } from './services/settingsApi.js';
import SettingsModal from './components/SettingsModal/SettingsModal.jsx';
import Loader from './components/Loader/Loader.jsx';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground.jsx';

const RecipeLibrary = lazy(() => import('./components/RecipeLibrary/RecipeLibrary.jsx'));
const MealPlanner = lazy(() => import('./components/MealPlanner/MealPlanner.jsx'));
const GroceryList = lazy(() => import('./components/GroceryList/GroceryList.jsx'));
const PantryManager = lazy(() => import('./components/PantryManager/PantryManager.jsx'));
const NotFound = lazy(() => import('./components/NotFound/NotFound.jsx'));
const Login = lazy(() => import('./components/Authentication/Login.jsx'));
const Signup = lazy(() => import('./components/Authentication/Signup.jsx'));
const CommunityRecipes = lazy(() => import('./components/CommunityRecipes/CommunityRecipes.jsx'));
const CreateRecipeForm = lazy(() => import('./components/CreateRecipeForm/CreateRecipeForm.jsx'));
import { DialogProvider } from './components/DialogManager/DialogContext.jsx';

import { useTranslation } from 'react-i18next';

const THEMES = [
    { key: 'default', label: '🌑 Dark',  emoji: '🌑' },
    { key: 'cyber',   label: '⚡ Cyber', emoji: '⚡' },
    { key: 'zen',     label: '🌿 Zen',   emoji: '🌿' },
];

function Navbar({ onOpenSettings, theme, onCycleTheme }) {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const current = THEMES.find(th => th.key === theme) || THEMES[0];

    return (
        <nav className="navbar">
            <span className="navbar__logo">
                <span className="navbar__logo-icon">🥗</span> {t('app_title', 'MealMate')}
            </span>
            <ul className="navbar__links">
                {user ? (
                    <>
                        <li><NavLink to="/">{t('nav.recipes', 'Recipes')}</NavLink></li>
                        <li><NavLink to="/community">{t('recipes.community', 'Community')}</NavLink></li>
                        <li><NavLink to="/create-recipe">{t('recipes.create_new', 'Create Recipe')}</NavLink></li>
                        <li><NavLink to="/planner">{t('nav.meal_plan', 'Planner')}</NavLink></li>
                        <li><NavLink to="/grocery">{t('nav.grocery_list', 'Grocery List')}</NavLink></li>
                        <li><NavLink to="/pantry">{t('nav.pantry', 'Pantry')}</NavLink></li>
                        <li><button onClick={onOpenSettings} className="nav-btn">⚙️ {t('nav.settings', 'Settings')}</button></li>
                        <li><button onClick={logout} className="nav-logout-btn">{t('nav.logout', 'Logout')}</button></li>
                    </>
                ) : (
                    <>
                        <li><NavLink to="/">{t('nav.recipes', 'Recipes')}</NavLink></li>
                        <li><NavLink to="/community">{t('recipes.community', 'Community')}</NavLink></li>
                        <li><button onClick={onOpenSettings} className="nav-btn">⚙️ {t('nav.settings', 'Settings')}</button></li>
                        <li><NavLink to="/login">{t('nav.login', 'Login')}</NavLink></li>
                        <li><NavLink to="/signup">{t('auth.sign_up', 'Signup')}</NavLink></li>
                    </>
                )}
            </ul>
            <button
                className="theme-toggle-btn"
                onClick={onCycleTheme}
                title={`Theme: ${current.label}`}
            >
                {current.emoji}
            </button>
        </nav>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '1.2rem', color: 'var(--text-muted, #888)' }}>Loading...</div>;
    return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function DemoBanner() {
    const { user } = useAuth();
    const { t } = useTranslation();
    if (!user?.isDemo) return null;
    return (
        <div style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            textAlign: 'center',
            padding: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            zIndex: 1000
        }}>
            ⚠️ {t('auth.demo', 'Running in Offline Demo Mode (Backend Unreachable)')}
        </div>
    );
}

export default function App() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('mm-theme') || 'default');

    useEffect(() => {
        settingsApi.syncFromServer();
    }, []);

    useEffect(() => {
        if (theme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('mm-theme', theme);
    }, [theme]);

    const cycleTheme = () => {
        const keys = THEMES.map(t => t.key);
        const idx = keys.indexOf(theme);
        setTheme(keys[(idx + 1) % keys.length]);
    };

    return (
        <AuthProvider>
            <DialogProvider>
                <BrowserRouter
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                    }}
                >
                    <AnimatedBackground />
                    <div className="app-layout">
                        <DemoBanner />
                        <Navbar
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            theme={theme}
                            onCycleTheme={cycleTheme}
                        />
                        <main className="main-content">
                            <Suspense fallback={<Loader />}>
                                <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/" element={<RecipeLibrary />} />
                                    <Route path="/community" element={<CommunityRecipes />} />
                                    <Route path="/create-recipe" element={<ProtectedRoute><CreateRecipeForm /></ProtectedRoute>} />
                                    <Route path="/planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
                                    <Route path="/grocery" element={<ProtectedRoute><GroceryList /></ProtectedRoute>} />
                                    <Route path="/pantry" element={<ProtectedRoute><PantryManager /></ProtectedRoute>} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </main>
                        <AIAssistantModal />
                        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                    </div>
                </BrowserRouter>
            </DialogProvider>
        </AuthProvider>
    );
}
