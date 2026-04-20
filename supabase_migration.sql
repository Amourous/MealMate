-- ============================================================
-- MealMate - Supabase Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- NOTE: Supabase handles users via auth.users (built-in).
-- We create a 'profiles' table that links to it.

-- ============================================================
-- 1. PROFILES (replaces your 'users' table)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    default_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ============================================================
-- 4. RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions JSONB,
    default_servings INTEGER DEFAULT 1 CHECK (default_servings > 0),
    is_public BOOLEAN DEFAULT FALSE,
    author_name TEXT DEFAULT 'Unknown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, title)
);

-- Auto-update updated_at on recipe changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. RECIPE INGREDIENTS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity REAL NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- ============================================================
-- 6. RECIPE TAGS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

-- ============================================================
-- 7. MEAL PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    weekly_budget REAL CHECK (weekly_budget >= 0),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. MEAL PLAN ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meal_plan_id BIGINT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    meal_type TEXT NOT NULL,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    servings INTEGER DEFAULT 1 CHECK (servings > 0)
);

-- ============================================================
-- 9. PANTRY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity REAL NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,
    expiry_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_pantry_items_updated_at
    BEFORE UPDATE ON pantry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. INGREDIENT PRICES
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_prices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ingredient_id BIGINT NOT NULL UNIQUE REFERENCES ingredients(id) ON DELETE CASCADE,
    price_per_unit REAL NOT NULL CHECK (price_per_unit >= 0),
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_ingredient_prices_updated_at
    BEFORE UPDATE ON ingredient_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    budget REAL DEFAULT 40,
    currency TEXT DEFAULT '€',
    recipe_servings_json JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS) - Protects your data!
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Recipes: users can CRUD their own, anyone can read public
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Settings: users can only see/edit their own
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Meal Plans: private to each user
CREATE POLICY "Users can manage own meal plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meal plan items" ON meal_plan_items FOR ALL
    USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- Pantry: private to each user
CREATE POLICY "Users can manage own pantry" ON pantry_items FOR ALL USING (auth.uid() = user_id);

-- Shared tables (ingredients, tags, prices): everyone can read, authenticated can write
CREATE POLICY "Anyone can view ingredients" ON ingredients FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can insert ingredients" ON ingredients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can insert tags" ON tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view prices" ON ingredient_prices FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view recipe_ingredients" ON recipe_ingredients FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can manage recipe_ingredients" ON recipe_ingredients FOR ALL
    USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can view recipe_tags" ON recipe_tags FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can manage recipe_tags" ON recipe_tags FOR ALL
    USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));
