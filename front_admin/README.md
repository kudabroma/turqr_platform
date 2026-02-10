# TurQR Admin Frontend

A modern admin panel for TurQR - Restaurant QR Menu Management Platform.

## Features

- **Session-Based Authentication**: Cookie-based session auth with Django backend
- **Restaurant Admin Panel**: Manage categories and dishes for your restaurant
- **Superuser Dashboard**: Platform administration (placeholder for future features)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (React Query) for data fetching
- Tailwind CSS for styling
- Shadcn/ui components

## Development Setup

### Prerequisites

- Node.js 18+ or Bun
- Django backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Running the Development Server

```bash
# Start the dev server
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:8080`.

### Vite Proxy Configuration

The development server is configured to proxy API requests to the Django backend:

- `/api/*` → `http://localhost:8000/api/*`
- `/platform/*` → `http://localhost:8000/platform/*`

This is configured in `vite.config.ts`:

```typescript
proxy: {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true,
    secure: false,
  },
  "/platform": {
    target: "http://localhost:8000",
    changeOrigin: true,
    secure: false,
  },
}
```

## API Communication

### Session Authentication

All API requests use `credentials: "include"` to send session cookies. This is critical for Django's SessionAuthentication to work properly.

```typescript
// All requests include credentials
const response = await fetch("/api/endpoint/", {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### API Client

The `src/api/apiClient.ts` provides a wrapper for all API calls:

```typescript
import apiClient from "@/api/apiClient";

// GET request
const data = await apiClient<ResponseType>("/endpoint/");

// POST request
const result = await apiClient<ResponseType>("/endpoint/", {
  method: "POST",
  body: { key: "value" },
});
```

## API Endpoints Used

### Authentication

- `POST /api/auth/login/` - Login with username/password
- `POST /api/auth/logout/` - Logout current session

### Categories

- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create category
- `PATCH /api/categories/:id/` - Update category
- `DELETE /api/categories/:id/` - Delete category

### Dishes

- `GET /api/dishes/` - List all dishes
- `POST /api/dishes/` - Create dish
- `PATCH /api/dishes/:id/` - Update dish
- `DELETE /api/dishes/:id/` - Delete dish

## Project Structure

```
src/
├── api/              # API client and endpoint definitions
│   ├── apiClient.ts  # Fetch wrapper with credentials
│   └── endpoints.ts  # API endpoint functions
├── auth/             # Authentication context
│   └── AuthContext.tsx
├── components/       # Reusable components
│   ├── layout/       # Layout components
│   └── ui/           # shadcn/ui components
├── pages/            # Page components
│   ├── admin/        # Admin pages (dashboard, categories, dishes)
│   ├── login/        # Login page
│   └── super/        # Superuser dashboard
├── routes/           # Route protection
│   └── ProtectedRoute.tsx
└── App.tsx           # Main app with routing
```

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Redirects to `/admin` or `/login` | Public |
| `/login` | Login page | Public |
| `/admin` | Admin dashboard | Authenticated |
| `/admin/categories` | Categories CRUD | Authenticated |
| `/admin/dishes` | Dishes CRUD | Authenticated |
| `/super` | Superuser dashboard | Authenticated |

## Roles

### Business Admin (Restaurant Staff)

- `is_staff = true`
- `restaurant != null`
- Can manage categories and dishes for their restaurant

### Superuser (Platform Owner)

- `is_superuser = true`
- Access to superuser dashboard (coming soon features)

## Platform Assets

Place the TurQR logo at:

```
public/platform/Turlogo.png
```

## Building for Production

```bash
npm run build
# or
bun run build
```

The build output will be in the `dist/` directory.

## Notes

- This is a separate project from the tourist-facing frontend (`front_public`)
- All data is scoped to the logged-in user's restaurant (server-side)
- Session restore is handled by checking `/api/categories/` on app load
