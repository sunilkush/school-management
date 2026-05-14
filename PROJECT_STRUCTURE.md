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
- `services/` → Domain services (payroll, exams, fee calculations).
- `utils/` → Shared utility helpers.
- `validators/` → Request validators.
- `views/` → EJS templates.

## Frontend (`frontend/src`)
- `app/` → Application composition layer: root shell, router, provider wrappers, and Redux store bootstrap.
- `api/` → HTTP client/token utilities.
- `assets/` → Static app assets.
- `components/` → Shared/reusable UI pieces.
- `config/` → Central app config (sidebar/nav config).
- `context/` → React context providers.
- `features/` → Redux slices and feature-specific modules.
- `hooks/` → Custom hooks.
- `pages/` → Route-level pages using lowercase domain folders and `roles/<role-name>` portals.
- `routes/` → Route guards and route helpers.
- `services/` → RTK query/API service modules.
- `utils/` → Utility helpers (`sidebar.js` now re-exports from `config`).

### Frontend app layer (`frontend/src/app`)
- `App.jsx` → Root authenticated shell rendered by React Router.
- `main.jsx` → Vite/React bootstrap and global providers.
- `router.jsx` → Central route tree and lazy route imports.
- `providers/` → App-level provider adapters such as Ant Design theme wiring.
- `store/` → Redux store setup kept with app bootstrap concerns.

### Frontend pages (`frontend/src/pages`)
- `auth/` → Login, password recovery, and email verification pages.
- `common/` → Shared pages such as profile, messages, notifications, settings, and error screens.
- `attendance/`, `timetable/`, `support/`, `modules/` → Cross-role page domains.
- `roles/` → Role-specific portals (`super-admin`, `school-admin`, `teacher`, `student`, `parent`, `accountant`, etc.) with kebab-case feature folders.
