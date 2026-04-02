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
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const newRecipe = {
            title,
            instructions,
            default_servings: servings,
            is_public: isPublic,
            author_name: isPublic ? authorName : 'Unknown',
            ingredients: [], // Placeholder, could add UI for ingredients later
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
