# Project Folder Structure

## Root
- `backend/` → Node/Express API + Mongo models, controllers, routes.
- `frontend/` → React/Vite web app.

## Backend (`backend/src`)
- `config/` → Central runtime config (`cors.config.js`, `paths.config.js`).
- `controllers/` → Route handlers.
- `db/` → Database connection bootstrap.
- `middlewares/` → Auth, validation, request context, security middleware.
- `models/` → Mongoose schemas/models.
- `routes/` → API route files + route registry (`registerRoutes.js`).
- `services/` → Domain services (exams, fee calculations, and other workflows).
- `utils/` → Shared utility helpers.
- `validators/` → Request validators.
- `views/` → EJS templates.

## Frontend (`frontend/src`)
- `api/` → HTTP client/token utilities.
- `assets/` → Static app assets.
- `components/` → Shared/reusable UI pieces.
- `config/` → Central app config (sidebar/nav config).
- `context/` → React context providers.
- `features/` → Redux slices.
- `hooks/` → Custom hooks.
- `pages/` → Route-level pages grouped by role/module.
- `routes/` → Route guards and route helpers.
- `services/` → RTK query/API service modules.
- `store/` → Redux store setup.
- `utils/` → Utility helpers (`sidebar.js` now re-exports from `config`).
