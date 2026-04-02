import { useState, useEffect } from 'react';
import { recipesApi } from '../../services/recipesApi.js';

export default function CommunityRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        recipesApi.getCommunity()
            .then(data => {
                setRecipes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Community Recipes...</div>;

    return (
        <div>
            <h1 className="section-title">Community Recipes</h1>
            <p className="section-subtitle">Discover meals shared by other MealMate users globally!</p>
            
            {recipes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">🌍</div>
                    <p className="empty-state__text">No community recipes yet. Be the first to share one!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {recipes.map(r => (
                        <div key={r.id} className="card" style={{ padding: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                Shared by: {r.author_name || 'Anonymous'}
                            </div>
                            <h3 style={{ margin: '10px 0' }}>{r.name}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <span className="tag">⏱ {r.prepTime} min</span>
                                <span className="tag">🍽 {r.servings} servings</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
