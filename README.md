# Compendia Frontend

Compendia is a Next.js app for reading, creating, and discussing educational articles. It connects to the Compendia backend through GraphQL and uses server-rendered pages with client-side interactions for authentication, article search, article creation, and nested comment threads.

## Tech Stack

- Next.js 16 with the App Router
- React 19 + TypeScript
- Tailwind CSS 4
- next-auth for session management (backend tokens stay server-side)
- Apollo Client: server components for reads, Server Actions for writes

## Requirements

- Node.js 20 or newer
- npm
- A running Compendia backend (e.g. `http://localhost:8080`)

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` (ask the maintainer for the secret values):

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080   # inlined into the client at build time
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random 32+ byte string>
# BACKEND_INTERNAL_URL=http://backend:8080      # optional: server-side backend URL (Docker)
```

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
- `npm run typecheck` - run the TypeScript compiler
- `npm run test` - run Vitest (`npm test -- --run` for a single run)

## Docker

```bash
NEXTAUTH_SECRET=... NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 docker compose up --build
```

The image uses Next's standalone output and runs as a non-root user. `NEXT_PUBLIC_BACKEND_URL` is a
build arg. Secrets are passed only at runtime, never copied into the image.

## Main Routes

- `/` - landing page with sign-in / sign-up card
- `/login` - dedicated authentication page
- `/articles` - newest articles, article search modal, and article cards
- `/articles/create` - article submission form
- `/articles/[id]` - single article view with nested comments and replies
- `/all-articles/[page]` - paginated article archive

## Features

- Authentication with next-auth credentials flow
- Article browsing and full-text search (backend `articles(search:)`)
- Markdown article creation form
- Nested comment threads with inline replies
- Comment voting with optimistic client-side updates
- Server-side protected pages that redirect unauthenticated users

## Project Structure

- `app/` - App Router pages, layouts, and API routes
- `components/` - reusable UI and feature components
- `components/articles/` - article-specific UI and controllers
- `app/actions/` - Server Actions (authenticated mutations)
- `lib/server/` - server-only Apollo client and session helpers
- `services/graphql/` - GraphQL documents, types and mappers
- `hooks/` - shared client hooks and stores
- `lib/` - auth and utility helpers
- `types/` - shared TypeScript types
