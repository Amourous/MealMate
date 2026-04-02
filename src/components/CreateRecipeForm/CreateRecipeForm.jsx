import { useState } from 'react';
import { recipesApi } from '../../services/recipesApi.js';
import { useNavigate } from 'react-router-dom';

export default function CreateRecipeForm() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [servings, setServings] = useState(2);
    const [isPublic, setIsPublic] = useState(false);
    const [authorName, setAuthorName] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [ingName, setIngName] = useState('');
    const [ingQty, setIngQty] = useState('');
    const [ingUnit, setIngUnit] = useState('pcs');
    const [loading, setLoading] = useState(false);

    function handleAddIngredient(e) {
        e.preventDefault();
        if (!ingName) return;
        setIngredients([...ingredients, { name: ingName, quantity: parseFloat(ingQty) || 1, unit: ingUnit }]);
        setIngName('');
        setIngQty('');
        setIngUnit('pcs');
    }

    function handleRemoveIngredient(index) {
        setIngredients(ingredients.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const newRecipe = {
            title,
            instructions,
            default_servings: servings,
            is_public: isPublic,
            author_name: isPublic ? authorName : 'Unknown',
            ingredients: ingredients,
            tags: []
        };

        try {
            await recipesApi.create(newRecipe);
            setLoading(false);
            if (isPublic) {
                navigate('/community');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save recipe');
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 className="section-title">Create a Recipe</h1>
            <p className="section-subtitle">Add your own recipe to MealMate</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Recipe Title</label>
                    <input 
                        type="text" 
                        required 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="form-input" 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Ingredients</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input type="text" placeholder="Ingredient name (e.g. Tomato)" value={ingName} onChange={e => setIngName(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <input type="number" placeholder="Qty" value={ingQty} onChange={e => setIngQty(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <select value={ingUnit} onChange={e => setIngUnit(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="pcs">pcs</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                            <option value="cup">cup</option>
                        </select>
                        <button onClick={handleAddIngredient} className="btn btn-secondary" type="button" style={{ padding: '8px 15px' }}>Add</button>
                    </div>
                    {ingredients.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {ingredients.map((ing, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                    <span>{ing.quantity} {ing.unit} {ing.name}</span>
                                    <button type="button" onClick={() => handleRemoveIngredient(i)} style={{ color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Instructions (One per line)</label>
                    <textarea 
                        required 
                        rows={5} 
                        value={instructions} 
                        onChange={(e) => setInstructions(e.target.value)} 
                        className="form-textarea"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Default Servings</label>
                    <input 
                        type="number" 
                        min="1" 
                        value={servings} 
                        onChange={(e) => setServings(parseInt(e.target.value) || 1)} 
                        style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <input 
                        type="checkbox" 
                        id="isPublic" 
                        checked={isPublic} 
                        onChange={(e) => setIsPublic(e.target.checked)} 
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="isPublic" style={{ fontWeight: 'bold' }}>Share with Community?</label>
                </div>

                {isPublic && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="How should others know you?"
                            value={authorName} 
                            onChange={(e) => setAuthorName(e.target.value)} 
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '1.1rem' }}>
                    {loading ? 'Saving...' : '💾 Save Recipe'}
                </button>
            </form>
        </div>
    );
}
