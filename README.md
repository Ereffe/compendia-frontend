# Compendia — frontend

Compendia is a platform for publishing and discussing educational and scientific articles. Scientific
articles carry DOI references and an interactive citation graph. This repository is the web client: a
Next.js 16 (App Router) app that talks to the Spring Boot backend
([compedia-backend](../compedia-backend)) over GraphQL, with REST for authentication, image uploads and
PDF import.

The interface is bilingual: Polish (default) and English.

## Features

- **Articles:** Markdown editor with images, math (KaTeX) and a contents list; three difficulty levels;
  create, edit and delete your own articles; drafts autosave in the browser.
- **Scientific articles:** a list of DOI references with previews, "fill in from DOI", a citation graph
  (Cytoscape, built from Crossref, up to four levels deep) and "cite this article" in APA and BibTeX.
- **PDF import:** upload a PDF and the backend turns it into an article, with live job progress.
- **Discovery:** newest, top and most-voted lists, a difficulty filter, full-text search and a paginated
  archive.
- **Discussion:** threaded comments with replies, editing, deleting and up/down votes; article votes.
- **People:** public profiles with each user's articles, user search, and an account page (name, e-mail
  and password changes by confirmation link).
- **Quality of life:** light and dark themes, skeleton loading states, phone-first layout, accessible
  labels throughout.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19 with the React Compiler |
| Language | TypeScript, Zod for validation at trust boundaries |
| Data | Apollo Client 4 with GraphQL Codegen (typed documents generated from the backend schema) |
| Auth | next-auth (credentials provider, JWT cookie, automatic token refresh in `proxy.ts`) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), lucide icons, sonner toasts |
| Content | react-markdown, remark-gfm, remark-math, rehype-katex, @uiw/react-md-editor |
| i18n | next-intl (locale from the `NEXT_LOCALE` cookie) |
| Tests | Vitest, Testing Library, jsdom; Playwright-based QA scripts |

Backend access tokens never reach the browser: server components read with the token, and every
authenticated write goes through a Server Action.

## Getting started

### Requirements

- Node.js 24 (npm 11). Older npm versions reject the lockfile
- A running Compendia backend, by default at `http://localhost:8080`.

### Run locally

```bash
npm install
cp sample.env .env.local     # then set NEXTAUTH_SECRET
npm run dev                  # http://localhost:3000
```

Open the app at `http://localhost:3000`, not `127.0.0.1`: the backend's CORS settings only allow that
origin, and browser-side requests (search, citation graph) fail from any other.

### Environment variables

| Variable | When | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | build time | Public backend URL, inlined into the client bundle |
| `NEXTAUTH_URL` | runtime | URL the app is served from, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | runtime | Random string of 32+ bytes (`openssl rand -base64 32`). Never commit it |
| `BACKEND_INTERNAL_URL` | runtime, optional | Backend URL for server-side requests, e.g. `http://backend:8080` in Docker |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build (standalone output) and server |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test -- --run` | Unit and component tests, single run (`npm test` watches) |
| `npm run codegen` | Regenerate typed GraphQL documents from the backend schema |

After changing a GraphQL operation in `services/graphql/` or pulling backend schema changes, run
`npm run codegen`. It reads `../compedia-backend/Compedia/src/main/resources/graphql/schema.graphqls`
(override with `GRAPHQL_SCHEMA`). The output in `services/graphql/generated/` is committed.

CI (GitHub Actions) runs lint, typecheck, tests and build on pushes and pull requests to `main` and
`develop`.

## Docker

```bash
NEXTAUTH_SECRET=... NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 docker compose up --build
```

The image uses Next's standalone output and runs as a non-root user. `NEXT_PUBLIC_BACKEND_URL` is a build
argument; secrets are passed only at runtime and are never copied into the image.

## Routes

| Route | Page |
|---|---|
| `/` | Landing page with sign-in and registration |
| `/articles` | Newest, top or most-voted articles, difficulty filter, search |
| `/all-articles/[page]` | Paginated archive |
| `/articles/create` | New article (regular, scientific with DOI references, or from a PDF) |
| `/articles/[id]` | Article, references, citation graph, citation, votes and comments |
| `/articles/[id]/edit` | Edit your own article |
| `/users`, `/users/[id]` | User search and public profiles |
| `/profile` | Your account settings |
| `/email-reset/[actionId]`, `/password-reset/[actionId]` | Confirmation links from e-mails |

Everything except the landing page, `/login` and the e-mail confirmation links requires signing in.

## Project structure

```
app/                  Routes (App Router), Server Actions in app/actions/, route handlers in app/api/
components/           Feature components; ui/ holds generated shadcn components
  <feature>/          View component + *Controller.ts (pure logic, handler factories) + tests
lib/                  Auth, validation schemas, helpers; lib/server/ is server-only (Apollo, session)
services/graphql/     GraphQL documents and mappers; generated/ is codegen output
messages/             Translations (pl.json is the typed source, en.json must have the same keys)
i18n/                 next-intl configuration
scripts/qa/           Visual and end-to-end QA scripts
proxy.ts              Session gate and access-token refresh
```

## Contributing

Work on `develop`; `main` is the release branch. Commits follow
[Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`). Every user-facing
string goes into both `messages/pl.json` and `messages/en.json`. Before opening a pull request, run lint,
typecheck, tests and build.
