# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Elphida is an e-learning platform with a React frontend (Create React App) and a separate Express/MongoDB backend. The app provides video lectures organized by semester/subject, note-taking with PDF export, a task calendar, real-time study rooms (WebRTC video + Firestore chat), and an AI chat assistant powered by Google Gemini.

## Commands

### Frontend (root directory)
- **Dev server:** `npm start` (runs on port 3000)
- **Build:** `npm run build`
- **Tests:** `npm test` (Jest + React Testing Library, interactive watch mode)
- **Run a single test:** `npm test -- --testPathPattern=<filename>`

### Backend (`backend/` directory)
- **Start server:** `npm start` (runs on port 5000)
- No test suite configured for the backend yet.

### Dependencies
- Frontend: `npm install` from root
- Backend: `npm install` from `backend/`

Both must be running simultaneously for auth (login/signup) to work.

## Architecture

### Monorepo Layout
- `/` — React frontend (CRA), all frontend deps in root `package.json`
- `/backend` — Express API server, separate `package.json` with its own `node_modules`
- `/elphida-3d` — Placeholder directory for 3D assets (currently empty `src/` only)

### Frontend Routing (`src/App.js`)
Uses react-router-dom v7. Routes:
- `/` — Public landing page (`Home`)
- `/login`, `/signup` — Auth pages, redirect to `/dashboard` if already logged in
- `/dashboard` — Protected, 3-column layout: `SemestersSidebar | VideoSection + NotesSection | CalendarAndTasks + StudyRooms`
- `/profile` — Protected, user profile with streak and notes
- `ElphiChatWidget` is rendered globally on all routes

Auth state is managed via `useState` in `App`, checked against `localStorage("elphiUser")`. Protected routes use `<Navigate>` for redirects.

### Dashboard 3-Column Grid (`src/styles/global.css`)
The `.app-container` uses `grid-template-columns: 260px 1fr 340px` for left sidebar, main content, and right sidebar. All panels scroll independently with `height: calc(100vh - 80px)`.

### Data Flow & Storage
- **User auth:** Login/Signup components POST to `http://localhost:5000/login` and `/signup`. User object stored in `localStorage("elphiUser")`.
- **Video content:** Loaded at runtime from `/public/videos.json` (keyed by subject name → array of `{title, youtubeId}`).
- **Notes:** Per-video notes stored in localStorage with key `notes-{subject}-{title}`.
- **Tasks:** Per-date task lists stored in localStorage with key `tasks-{date.toDateString()}`.
- **Streak:** Calculated in `Profile.js` on mount, stored in `localStorage("elphiStreak")` and `localStorage("lastVisit")`.

### External Services
- **MongoDB Atlas:** User auth persistence (connection in `backend/server.js`)
- **Firebase Realtime Database:** Configured in `src/firebaseConfig.js`, exports `database`
- **Firebase Firestore (compat SDK):** Used in `StudyRooms.jsx` for WebRTC signaling and room chat — initializes its own Firebase app instance via `firebase/compat`
- **Google Gemini API:** Called directly from `ElphiChatWidget.jsx` (model: `gemini-2.0-flash`)
- **YouTube Embed:** Videos rendered as iframes in `VideoSection.jsx`

### Styling Approach
- Global CSS variables defined in `src/styles/global.css` (dark theme by default: `--bg-primary`, `--accent-blue`, etc.)
- `ThemeContext` (`src/context/ThemeContext.js`) provides `darkMode` and `toggleTheme` — used by `Home.js`
- Login/Signup pages have their own independent dark mode toggle via `localStorage('theme')` and `document.body.classList`, separate from `ThemeContext`
- Component-specific CSS files colocated in `src/components/` (e.g., `Login.css`, `Signup.css`, `Home.css`)
- Bootstrap (5.x) and Bootstrap Icons used in Login, Signup, and Profile components
- Most dashboard components use inline styles with CSS variable references

### Key Patterns
- Components use a mix of `.js` and `.jsx` extensions — no enforced convention
- No centralized state management (no Redux/Zustand); state lives in component-local `useState` or `localStorage`
- `SemestersSidebar` manages `setActiveSubject` but the prop is not currently wired through `DashboardLayout` to `VideoSection` (the sidebar and video section are independently rendered)
- `Dashboard.jsx` and `LoginPage.jsx` in `src/` appear to be older/unused versions — the active components are in `src/components/`
- GSAP with ScrollTrigger is used for Home page section animations
- jsPDF is used in `VideoSection.jsx` to export notes as PDF
