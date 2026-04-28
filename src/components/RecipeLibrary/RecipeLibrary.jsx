import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { recipesApi } from '../../services/recipesApi.js';
import { apiClient } from '../../services/apiClient.js';
import { storageService } from '../../services/storageService.js';
import { filterByTags, ALL_TAGS } from '../../engines/filterEngine.js';
import { searchRecipes } from '../../engines/searchEngine.js';
import { scaleIngredients } from '../../engines/scalingEngine.js';
import { formatCurrency } from '../../utils/currency.js';
import { displayMeasurement } from '../../utils/units.js';
import { useDialog } from '../DialogManager/DialogContext.jsx';
import styles from './RecipeLibrary.module.css';

export const TAG_LABELS = {
    vegetarian: '🌿 Vegetarian',
    vegan: '🌱 Vegan',
    'high-protein': '💪 High-Protein',
    'dairy-free': '🥛 Dairy-Free',
    'gluten-free': '🌾 Gluten-Free',
};

export function RecipeModal({ recipe, onClose, onSaveServings }) {
    const { t } = useTranslation();
    const { showConfirm, showAlert } = useDialog();
    const [servings, setServings] = useState(recipe.servings);
    const [isSaving, setIsSaving] = useState(false);
    const [macros, setMacros] = useState(null);
    const [loadingMacros, setLoadingMacros] = useState(false);
    const [macroError, setMacroError] = useState(null);
    const [localDietTags, setLocalDietTags] = useState(recipe.dietTags || []);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const currency = storageService.getSettings()?.currency || 'EUR';

    useEffect(() => {
        recipesApi.getCurrentUser().then(setCurrentUser);
    }, []);

    const isOwner = currentUser?.id === recipe.user_id;

    const scaled = useMemo(
        () => scaleIngredients(recipe.ingredients, recipe.servings, servings),
        [recipe, servings]
    );

    async function handleSave() {
        if (!onSaveServings) return;
        setIsSaving(true);
        await onSaveServings(recipe.id, servings);
        setIsSaving(false);
    }

    async function handleGetMacros() {
        if (loadingMacros) return;
        setMacroError(null);
        setMacros(null);
        setLoadingMacros(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            // Call the Cloudflare Pages Function directly — bypasses the old backend
            const res = await fetch('/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipeName: recipe.name,
                    ingredients: scaled,
                    servings: servings
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMacros(data);
            if (data && Array.isArray(data.dietTags)) {
                setLocalDietTags(data.dietTags);
            }
        } catch (error) {
            setMacroError('Could not calculate nutrition. Please try again.');
            console.error('Nutrition error:', error);
        } finally {
            setLoadingMacros(false);
        }
    }

    async function handleDuplicate() {
        setIsDuplicating(true);
        try {
            await recipesApi.duplicate(recipe.id);
            await showAlert({
                type: 'success',
                title: 'Recipe Saved!',
                message: 'This recipe was saved to your personal library.'
            });
            onClose('RELOAD');
        } catch (error) {
            // Check if error is unique constraint
            if (error.message && error.message.includes('unique constraint')) {
                await showAlert({
                    type: 'info',
                    title: 'Already Saved!',
                    message: "You've already saved a recipe with this exact name to your library."
                });
            } else {
                await showAlert({
                    type: 'error',
                    title: 'Save Failed',
                    message: 'Failed to save: ' + (error.message || 'Unknown error.')
                });
            }
        } finally {
            setIsDuplicating(false);
        }
    }

    async function handleDelete() {
        const confirmed = await showConfirm({
            type: 'warning',
            title: 'Delete Recipe?',
            message: `Are you sure you want to discard "${recipe.name}"? It will be permanently removed from your library.`,
            confirmText: 'Yes, Delete',
            cancelText: 'Keep it'
        });
        if (!confirmed) return;
        
        setIsDeleting(true);
        try {
            await recipesApi.delete(recipe.id);
            await showAlert({ type: 'success', title: 'Deleted', message: 'Recipe deleted successfully!' });
            onClose('RELOAD');
        } catch (error) {
            showAlert({ type: 'error', title: 'Delete Failed', message: 'Failed to delete recipe. ' + error.message });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

                <div className={styles.modalHeader}>
                    <div className={styles.modalCategory}>{recipe.category}</div>
                    <h2 className={styles.modalTitle}>{recipe.name}</h2>
                    <p className={styles.modalDesc}>{recipe.description}</p>
                    <div className={styles.modalMeta}>
                        <span>⏱ {recipe.prepTime} min</span>
                        <span>💶 {formatCurrency(recipe.estimatedCostPerServing, currency)} / serving</span>
                    </div>
                <div className={styles.tagRow}>
                        {localDietTags?.map((t) => {
                            const tagKey = t.toLowerCase();
                            const fallbackLabel = t.charAt(0).toUpperCase() + t.slice(1);
                            return <span key={t} className={`tag tag-${tagKey}`}>{TAG_LABELS[tagKey] || fallbackLabel}</span>;
                        })}
                    </div>
                </div>

                <div className={styles.servingSection}>
                    <div className={styles.servingControl}>
                        <label htmlFor="servings-input">{t('recipe_modal.servings', 'Servings')}</label>
                        <div className={styles.servingRow}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
                            <input
                                id="servings-input"
                                type="number"
                                min="1"
                                max="12"
                                value={servings}
                                onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ width: 60, textAlign: 'center' }}
                            />
                            <button className="btn btn-ghost btn-sm" onClick={() => setServings(Math.min(12, servings + 1))}>+</button>
                        </div>
                    </div>
                    {servings !== recipe.servings && onSaveServings && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? t('recipe_modal.saving', 'Saving...') : t('recipe_modal.save_default', '💾 Save as Default')}
                        </button>
                    )}
                    {isOwner && (
                        <button 
                            className="btn btn-primary btn-sm" 
                            style={{ marginLeft: '10px', backgroundColor: '#ef4444', color: 'white' }}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t('recipe_modal.deleting', 'Deleting...') : t('recipe_modal.delete', '🗑️ Delete Recipe')}
                        </button>
                    )}
                    {!isOwner && (
                        <button 
                            className="btn btn-primary btn-sm" 
                            style={{ marginLeft: '10px', backgroundColor: '#3b82f6', color: 'white' }}
                            onClick={handleDuplicate}
                            disabled={isDuplicating}
                        >
                            {isDuplicating ? t('recipe_modal.saving', 'Saving...') : t('recipe_modal.save_community', '⭐ Save to My Recipes')}
                        </button>
                    )}
                </div>

                <div className="divider" />

                <h3 className={styles.sectionLabel}>{t('recipe_modal.ingredients', 'Ingredients')}</h3>
                <ul className={styles.ingredientList}>
                    {scaled.map((ing, i) => {
                        const m = displayMeasurement(ing.qty, ing.unit, storageService.getSettings()?.measurementSystem || 'metric');
                        return (
                            <li key={i} className={styles.ingredientItem}>
                                <span className={styles.ingQty}>{m}</span>
                                <span>{ing.name}</span>
                            </li>
                        );
                    })}
                </ul>

                <div className="divider" />
                
                <h3 className={styles.sectionLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t('recipe_modal.nutrition', 'Nutrition & Macros')}
                    <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={handleGetMacros} 
                        disabled={loadingMacros}
                    >
                        {loadingMacros ? t('recipe_modal.analyzing', 'Analyzing...') : macros ? t('recipe_modal.recalculate', '🔄 Recalculate') : t('recipe_modal.calculate', '🔬 Calculate')}
                    </button>
                </h3>
                
                {macroError && (
                    <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
                        ⚠️ {macroError}
                    </p>
                )}

                {macros && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.2rem', color: '#4ade80' }}>{macros.calories}</strong> <small style={{ color: '#94a3b8' }}>kcal</small></div>
                        <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.2rem', color: '#60a5fa' }}>{macros.protein}g</strong> <small style={{ color: '#94a3b8' }}>{t('nutrition.protein', 'Protein')}</small></div>
                        <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.2rem', color: '#f59e0b' }}>{macros.carbs}g</strong> <small style={{ color: '#94a3b8' }}>{t('nutrition.carbs', 'Carbs')}</small></div>
                        <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.2rem', color: '#f87171' }}>{macros.fat}g</strong> <small style={{ color: '#94a3b8' }}>{t('nutrition.fat', 'Fat')}</small></div>
                        {macros.fiber > 0 && <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.2rem', color: '#a78bfa' }}>{macros.fiber}g</strong> <small style={{ color: '#94a3b8' }}>{t('nutrition.fiber', 'Fiber')}</small></div>}
                    </div>
                )}

                <h3 className={styles.sectionLabel}>{t('recipe_modal.instructions', 'Instructions')}</h3>
                <ol className={styles.instructions}>
                    {recipe.instructions.map((step, i) => (
                        <li key={i} className={styles.instructionStep}>{step.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

const FOOD_IMAGES = {
    breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=250&fit=crop',
    lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop',
    dinner: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=250&fit=crop',
    snack: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=250&fit=crop',
    dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=250&fit=crop',
    appetizer: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=250&fit=crop',
    beverage: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=250&fit=crop',
    salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop',
    soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=250&fit=crop',
    default: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=250&fit=crop'
};

function getRecipeImage(recipe) {
    const category = recipe.category?.toLowerCase() || '';
    if (FOOD_IMAGES[category]) return FOOD_IMAGES[category];
    const name = recipe.name?.toLowerCase() || '';
    if (name.includes('salad')) return FOOD_IMAGES.salad;
    if (name.includes('soup')) return FOOD_IMAGES.soup;
    if (name.includes('breakfast')) return FOOD_IMAGES.breakfast;
    if (name.includes('dessert') || name.includes('cake') || name.includes('cookie')) return FOOD_IMAGES.dessert;
    if (name.includes('drink') || name.includes('smoothie')) return FOOD_IMAGES.beverage;
    if (name.includes('appetizer') || name.includes('starter')) return FOOD_IMAGES.appetizer;
    return FOOD_IMAGES.default;
}

function RecipeCard({ recipe, onDetail, onAddToPlan }) {
    const { t } = useTranslation();
    const currency = storageService.getSettings()?.currency || 'EUR';
    const imageUrl = recipe.imageUrl || getRecipeImage(recipe);
    return (
        <div className={`card ${styles.recipeCard}`} onClick={() => onDetail(recipe)}>
            <div className={styles.cardImageWrap}>
                <img src={imageUrl} alt={recipe.name} className={styles.cardImage} loading="lazy" />
                <div className={styles.cardImageOverlay}></div>
            </div>
            <div className={styles.cardHeader}>
                <span className={styles.cardCategory}>{recipe.category}</span>
                <span className={styles.cardCost}>{formatCurrency(recipe.estimatedCostPerServing, currency)}/srv</span>
            </div>
            <h3 className={styles.cardTitle}>{recipe.name}</h3>
            <p className={styles.cardDesc}>{recipe.description}</p>
            <div className={styles.cardMeta}>
                <span>⏱ {recipe.prepTime} min</span>
                <span>🍽 {recipe.servings} {t('library.serving', 'serving')}{recipe.servings > 1 ? 's' : ''}</span>
            </div>
            <div className={styles.tagRow}>
                {recipe.dietTags.map((t_tag) => (
                    <span key={t_tag} className={`tag tag-${t_tag}`}>{TAG_LABELS[t_tag]}</span>
                ))}
            </div>
            <button
                className={`btn btn-primary btn-sm ${styles.addBtn}`}
                onClick={(e) => { e.stopPropagation(); onAddToPlan(recipe); }}
                aria-label={`Add ${recipe.name} to plan`}
            >
                + {t('library.add_to_plan', 'Add to Plan')}
            </button>
        </div>
    );
}

function AddToPlanModal({ recipe, onClose }) {
    const { t } = useTranslation();
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const MEALS = ['breakfast', 'lunch', 'dinner'];
    const [day, setDay] = useState('Monday');
    const [meal, setMeal] = useState('dinner');

    function handleAdd() {
        const plan = storageService.getPlan();
        if (!plan.plan[day]) plan.plan[day] = {};
        plan.plan[day][meal] = recipe.id;
        storageService.setPlan(plan);
        onClose(true);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                <h2 className={styles.modalTitle} style={{ fontSize: '1.2rem', marginBottom: 20 }}>
                    {t('library.add_recipe_to_plan', 'Add "{{recipe}}" to Plan').replace('{{recipe}}', recipe.name)}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label htmlFor="plan-day">{t('planner.day', 'Day')}</label>
                        <select id="plan-day" value={day} onChange={(e) => setDay(e.target.value)}>
                            {DAYS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="plan-meal">{t('planner.meal', 'Meal')}</label>
                        <select id="plan-meal" value={meal} onChange={(e) => setMeal(e.target.value)}>
                            {MEALS.map((m) => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        ✔ {t('library.add_to', 'Add to')} {day} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RecipeLibrary() {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [activeTags, setActiveTags] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [planTarget, setPlanTarget] = useState(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        recipesApi.getAll()
            .then(data => {
                // Overlay persistent serving preferences from localStorage
                const savedServings = storageService.getSettings().recipeServings || {};
                const augmented = data.map(r => ({
                    ...r,
                    servings: savedServings[r.id] || r.servings
                }));
                setRecipes(augmented);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch recipes:', err);
                setError('Failed to load recipes. Please try again later.');
                setLoading(false);
            });
    }, []);

    async function handleSaveServings(recipeId, newServings) {
        // Update local state
        setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, servings: newServings } : r
        ));

        // Update localStorage
        const settings = storageService.getSettings();
        const recipeServings = settings.recipeServings || {};
        recipeServings[recipeId] = newServings;
        storageService.setSettings({ ...settings, recipeServings });

        setToast('Serving preference saved! 💾');
        setTimeout(() => setToast(''), 3000);
    }

    const filtered = useMemo(() => {
        const searched = searchRecipes(recipes, query);
        return filterByTags(searched, activeTags);
    }, [recipes, query, activeTags]);

    function toggleTag(tag) {
        setActiveTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }

    function handlePlanClose(added) {
        setPlanTarget(null);
        if (added) {
            setToast('Recipe added to plan! 🎉');
            setTimeout(() => setToast(''), 3000);
        }
    }

    return (
        <div>
            {toast && <div className={styles.toast}>{toast}</div>}

            <h1 className="section-title">{t('library.title', 'Recipe Library')}</h1>
            <p className="section-subtitle">{t('library.subtitle', 'Browse recipes · filter by diet · add to your weekly plan')}</p>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>{t('library.loading', 'Loading recipes...')}</p>
                </div>
            )}

            {error && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger-color)' }}>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Search */}
                    <div className={styles.searchRow}>
                        <div className={styles.searchWrap}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="search"
                                placeholder="Search by name or ingredient…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label="Search recipes"
                                className={styles.searchInput}
                            />
                        </div>
                        {activeTags.length > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTags([])}>
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* Diet tag filters */}
                    <div className={styles.filtersBar} role="group" aria-label="Diet tag filters">
                        {ALL_TAGS.map((tag) => (
                            <button
                                key={tag}
                                className={`tag tag-${tag} ${styles.filterBtn} ${activeTags.includes(tag) ? styles.filterActive : ''}`}
                                onClick={() => toggleTag(tag)}
                                aria-pressed={activeTags.includes(tag)}
                            >
                                {TAG_LABELS[tag]}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <p className={styles.resultsCount}>
                        {filtered.length} {t('library.found', 'recipe(s) found')}
                    </p>

                    {/* Recipe grid */}
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">🍽</div>
                            <p className="empty-state__text">{t('library.empty', 'No recipes match your filters.')}</p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filtered.map((r) => (
                                <RecipeCard
                                    key={r.id}
                                    recipe={r}
                                    onDetail={setSelectedRecipe}
                                    onAddToPlan={setPlanTarget}
                                />
                            ))}
                        </div>
                    )}

                    {selectedRecipe && (
                        <RecipeModal
                            recipe={selectedRecipe}
                            onClose={(reason) => {
                                setSelectedRecipe(null);
                                if (reason === 'RELOAD') {
                                    setLoading(true);
                                    recipesApi.getAll().then(data => {
                                        const savedServings = storageService.getSettings().recipeServings || {};
                                        const augmented = data.map(r => ({
                                            ...r,
                                            servings: savedServings[r.id] || r.servings
                                        }));
                                        setRecipes(augmented);
                                        setLoading(false);
                                    }).catch(() => setLoading(false));
                                }
                            }}
                            onSaveServings={handleSaveServings}
                        />
                    )}
                    {planTarget && (
                        <AddToPlanModal recipe={planTarget} onClose={handlePlanClose} />
                    )}
                </>
            )}
        </div>
    );
}
