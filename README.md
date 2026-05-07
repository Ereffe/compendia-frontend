# Compendia Frontend

Compendia is a Next.js app for reading, creating, and discussing educational articles. It connects to the Compendia backend through GraphQL and uses server-rendered pages with client-side interactions for authentication, article search, article creation, and nested comment threads.

## Tech Stack

- Next.js 16 with the App Router
- React 19 + TypeScript
- Tailwind CSS 4
- next-auth for session management
- GraphQL-based data fetching against the Compendia backend
- Zustand for client-side vote state

## Requirements

- Node.js 20 or newer
- npm
- A running Compendia backend, available by default at `http://localhost:8080`

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file with the values used by the app (to get variables, contact developer in dm)

The frontend reads `NEXT_PUBLIC_BACKEND_URL` directly from `.env.local`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production server
- `npm run lint` - run ESLint
- `npm run test` - run Vitest

## Main Routes

- `/` - landing page with sign-in / sign-up card
- `/login` - dedicated authentication page
- `/articles` - newest articles, article search modal, and article cards
- `/articles/create` - article submission form
- `/articles/[id]` - single article view with nested comments and replies
- `/all-articles/[page]` - paginated article archive

## Features

- Authentication with next-auth credentials flow
- Article browsing and search across title, category, and author
- Markdown article creation form
- Nested comment threads with inline replies
- Comment voting with optimistic client-side updates
- Server-side protected pages that redirect unauthenticated users

## Project Structure

- `app/` - App Router pages, layouts, and API routes
- `components/` - reusable UI and feature components
- `components/articles/` - article-specific UI and controllers
- `services/graphql/` - GraphQL requests and mappers
- `hooks/` - shared client hooks and stores
- `lib/` - auth and utility helpers
- `types/` - shared TypeScript types
