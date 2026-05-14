# Frontend app structure

The frontend bootstrapping code is grouped under `src/app` so the rest of the project can stay feature/page oriented.

```text
src/
  app/
    App.jsx                         # Root authenticated shell rendered by React Router
    main.jsx                        # React/Vite bootstrap and global providers
    router.jsx                      # Central route definitions and lazy page imports
    providers/ThemedAntWrapper.jsx  # Ant Design theme bridge
    store/store.js                  # Redux store configuration and persisted reducers
  api/                              # Shared HTTP and auth token utilities
  assets/                           # Static assets imported by components
  components/                       # Reusable UI/layout components
  config/                           # Sidebar and app configuration
  context/                          # React context providers
  features/                         # Redux slices and feature-specific modules
  hooks/                            # Shared custom hooks
  pages/                            # Route-level page components
    auth/                           # Login, recovery, and verification screens
    common/                         # Shared app pages used by multiple roles
    attendance/                     # Cross-role attendance pages
    timetable/                      # Cross-role timetable pages
    support/                        # Shared support pages
    modules/                        # Module overview/detail pages
    roles/                          # Role-specific page trees
      super-admin/                  # Super Admin pages grouped by domain
      school-admin/                 # School Admin pages grouped by domain
      teacher/                      # Teacher portal pages
      student/                      # Student portal pages
      parent/                       # Parent portal pages
      accountant/                   # Accountant portal pages
  routes/                           # Router guards and redirect helpers
  services/                         # RTK Query/base API services
  utils/                            # Cross-cutting helpers and static data
```

Guidelines:

- Put app composition concerns in `src/app` only: providers, router setup, app shell, and store.
- Put route screens in `src/pages`; shared pages go in `common`, role pages go in `roles/<role-name>`, and cross-role modules use their own lowercase domain folder.
- Put reusable visual components in `src/components` and feature-only components inside that feature folder.
- Keep API clients in `src/api` or `src/services`; avoid importing them directly from page folders.
