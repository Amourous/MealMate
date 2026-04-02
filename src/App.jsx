import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import RecipeLibrary from './components/RecipeLibrary/RecipeLibrary.jsx';
import MealPlanner from './components/MealPlanner/MealPlanner.jsx';
import GroceryList from './components/GroceryList/GroceryList.jsx';
import PantryManager from './components/PantryManager/PantryManager.jsx';
import NotFound from './components/NotFound/NotFound.jsx';
import Login from './components/Authentication/Login.jsx';
import Signup from './components/Authentication/Signup.jsx';
import { AuthProvider, useAuth } from './components/Authentication/AuthContext.jsx';
import CommunityRecipes from './components/CommunityRecipes/CommunityRecipes.jsx';
import CreateRecipeForm from './components/CreateRecipeForm/CreateRecipeForm.jsx';
import { settingsApi } from './services/settingsApi.js';
import { useEffect } from 'react';

function Navbar() {
    const { user, logout } = useAuth();
    return (
        <nav className="navbar">
            <span className="navbar__logo">
                <span className="navbar__logo-icon">🥗</span> MealMate
            </span>
            <ul className="navbar__links">
                {user ? (
                    <>
                        <li><NavLink to="/">Recipes</NavLink></li>
                        <li><NavLink to="/community">Community</NavLink></li>
                        <li><NavLink to="/create-recipe">Create Recipe</NavLink></li>
                        <li><NavLink to="/planner">Planner</NavLink></li>
                        <li><NavLink to="/grocery">Grocery List</NavLink></li>
                        <li><NavLink to="/pantry">Pantry</NavLink></li>
                        <li><button onClick={logout} className="nav-logout-btn">Logout</button></li>
                    </>
                ) : (
                    <>
                        <li><NavLink to="/">Recipes</NavLink></li>
                        <li><NavLink to="/community">Community</NavLink></li>
                        <li><NavLink to="/login">Login</NavLink></li>
                        <li><NavLink to="/signup">Signup</NavLink></li>
                    </>
                )}
            </ul>
        </nav>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
}

function DemoBanner() {
    const { user } = useAuth();
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
            ⚠️ Running in Offline Demo Mode (Backend Unreachable)
        </div>
    );
}

export default function App() {
    useEffect(() => {
        // Sync settings down from cloud on startup
        settingsApi.syncFromServer();
    }, []);

    return (
        <AuthProvider>
            <BrowserRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <div className="app-layout">
                    <DemoBanner />
                    <Navbar />
                    <main className="main-content">
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
                    </main>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}
