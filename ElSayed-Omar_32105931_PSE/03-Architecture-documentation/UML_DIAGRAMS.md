# MealMate â€” UML Diagrams

Visual representation of the MealMate system using standard UML notation, rendered with Mermaid.js.

---

## 1. Use Case Diagram

![Use Case Diagram](./assets/diagrams/use_case.png)

> ðŸ’¡ The **User** is the single actor who drives all interactions. **Â«includeÂ»** arrows show mandatory sub-flows (e.g. a Meal Plan always generates a Grocery List), while **Â«extendÂ»** arrows show optional behaviour (e.g. Browse Recipes can be extended with Diet Tag filtering). All core features require the user to be authenticated via **Create Account / Login**.

---

## 2. Component Diagram

![Component Diagram](./assets/diagrams/component_diagram.png)

> ðŸ’¡ MealMate follows a classic **Client-Server** pattern. The **React + Vite** frontend runs entirely in the browser, managing state through an `AuthContext` that persists the JWT in `localStorage`. Every protected API call attaches the token as a `Bearer` header. The **Node.js / Express** backend exposes four REST route groups (`/auth`, `/recipes`, `/mealplans`, `/pantry`), all backed by a single **SQLite** file.

---

## 3. Sequence Diagram

![Sequence Diagram](./assets/diagrams/sequence_diagram.png)

> ðŸ’¡ The flow is split into two phases. In the **Authentication Phase** the frontend POSTs credentials, the server verifies the password hash with `bcrypt`, and returns a signed JWT that is stored in `localStorage`. In the **Application Execution Phase** the stored token is attached to subsequent requests; the server validates the signature with `jwt.verify()` before writing to the database, ensuring only authenticated users can modify meal plan data.

---

## 4. Class Diagram

![Class Diagram](./assets/diagrams/class_diagram.png)

> ðŸ’¡ Every **User** owns zero-or-more **MealPlan** and **PantryItem** records. A `MealPlan` is composed of `MealPlanItem` rows (one per meal slot), each referencing a **Recipe**. Recipes are built from `RecipeIngredient` join records that map to shared **Ingredient** entities â€” keeping ingredient names canonical, and can be categorized using `RecipeTag` and `Tag` entities. Each `Ingredient` has zero-or-more **IngredientPrice** entries used for budget calculation. `PantryItem` links a user's stock to the same `Ingredient` catalogue.

