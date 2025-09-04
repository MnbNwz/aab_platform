# AAS Platform Client

A modern React TypeScript frontend for the AAS (Assistance and Services) platform with role-based access control (RBAC).

## 🏗️ Architecture

This application follows a functional React approach with:

- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for routing
- **Tailwind CSS** for styling (matching AAS brand colors)
- **Vite** for build tooling
- **Cookie-based authentication** (HTTP-only cookies)

## 🎨 Design System

The application uses AAS Quebec's brand colors:

- **Primary Blue**: `#1e3a5f` (Deep blue from AAS website)
- **Accent Orange**: `#e85a4f` (Orange from CTA buttons)
- **Neutral Colors**: Gray scale for backgrounds and text

## 🔐 Authentication Flow

The app uses secure HTTP-only cookie authentication:

1. **Login**: POST `/api/auth/signin` with credentials
2. **Session**: Automatic cookie handling with `credentials: 'include'`
3. **Auto-refresh**: Transparent token refresh
4. **Logout**: POST `/api/auth/logout`

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=AAS Platform
VITE_APP_VERSION=1.0.0
```
