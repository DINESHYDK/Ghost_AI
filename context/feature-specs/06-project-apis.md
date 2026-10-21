Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Auth and Collaboration Model", "Storage Model", "Invariants") and `context/code-standards.md` ("API Routes", "Data and Storage", "File Organization").

# Feature 06: Project APIs (backend only)

## Goal

Build the four project API routes: list, create, rename, delete. Backend only. Do not touch the UI and do not wire anything to the editor (that is a later spec).

## Dependencies

Feature 05 (Prisma) must be complete **and its migration applied** to the Neon `dev` database. This unit needs `lib/prisma.ts`, the generated client, and the `Project` model. If any of them is missing, stop and ask. Do not recreate them here.

## Scope

In scope:

1. `app/api/projects/route.ts`: `GET` (list) and `POST` (create).
2. `app/api/projects/[projectId]/route.ts`: `PATCH` (rename) and `DELETE`.
3. Server-only shared code in `lib/` for the project data operations and for input validation and response helpers. Handlers stay thin (per `code-standards.md`). The internal file layout is up to the implementer.
4. Updating `context/progress-tracker.md`.

Out of scope (do not start these):

- Any UI, hook, or editor change. No `fetch` calls from components.
- Listing shared (collaborator) projects, adding or removing collaborators, and any `ProjectCollaborator` logic. The sidebar's Shared tab stays on mock data until a later spec.
- A `GET /api/projects/[projectId]` endpoint, pagination, search, archive or restore endpoints, rate limiting.
- Anything involving Vercel Blob, Liveblocks or the canvas.
- New packages (no validation library). Hand-write the validation below.
- Changes to the schema, `proxy.ts`, auth config or `components/ui/*`.

## Verify before writing

1. Read the Next.js 16 docs in `node_modules/next/dist/docs/` for route handlers: the handler signature, how dynamic route params are received (they may be a promise in this version), and whether a `GET` handler that reads the Clerk session is cached or shared between users. If the docs say it can be cached, apply the documented setting so a response for one user can never be served to another.
2. Read the Clerk docs for the installed `@clerk/nextjs` version for reading the session in a route handler. Use `await auth()` and check `userId` yourself. Do not use `auth.protect()` in these handlers: for API requests it does not produce the explicit `401` this spec requires.
3. Read `lib/prisma.ts` and the generated types to see the real model and field names.
4. Confirm the Prisma error code for "record not found" on update and delete in the installed version.

## Routes and behavior

Authentication (every route):

- The handler itself checks the Clerk session, even though `proxy.ts` already blocks unauthenticated `/api` requests. A missing user returns `401` with body `{"error":"Unauthorized"}`, identical to the proxy's response.
- The owner is **always** the authenticated Clerk user ID. Never read `ownerId`, `id`, `status`, `canvasJsonPath`, `createdAt` or `updatedAt` from the request. Ignore any such fields if sent.

### `GET /api/projects`

- Returns only the projects whose `ownerId` equals the current user, newest first (`createdAt` descending, which matches the index).
- Includes both `DRAFT` and `ARCHIVED` projects. No pagination and no cap.
- `200` with `{ "projects": [ ... ] }`. An empty list is `{ "projects": [] }`.

### `POST /api/projects`

- Body: JSON with an optional `name`.
- If `name` is absent, `null`, or only whitespace, use `Untitled Project`.
- If `name` is present but not a string, or longer than 60 characters after trimming, return `400`.
- The name is stored trimmed. The ID comes from the schema's existing strategy (do not generate IDs in application code). Status uses the schema default.
- `201` with `{ "project": { ... } }`.

### `PATCH /api/projects/[projectId]`

- Body: JSON with a required `name`. It must be a string that is 1 to 60 characters after trimming. Anything else returns `400`.
- Rename only. No other field can be changed through this route.
- `200` with `{ "project": { ... } }`. Renaming to the same name is allowed and succeeds.

### `DELETE /api/projects/[projectId]`

- `200` with `{ "id": "<projectId>" }`.
- Deleting removes the project and, through the database cascade, its collaborator rows. No other cleanup happens in this unit.

### Ownership and errors for `PATCH` and `DELETE`

- Project does not exist: `404` with `{"error":"Project not found"}`.
- Project exists but belongs to someone else: `403` with `{"error":"Forbidden"}`.
- Enforce ownership **at write time**, not only before it: look the project up to decide `404` vs `403`, and then perform the update or delete with the owner ID in the `where` clause as well (id and owner). Then a project that changes owner or disappears between the check and the write cannot be modified by the wrong user. If the write finds nothing, map the Prisma "record not found" error to `404`.
- A `403` confirms that an ID exists. That is acceptable because IDs are unguessable. It is what the spec requires.

### Returned project shape

Return only: `id`, `name`, `description`, `status`, `createdAt`, `updatedAt`. Select these fields explicitly. Never return `ownerId` or `canvasJsonPath` (it is an internal storage reference).

### Request handling rules

- Validate and parse input before any database call (`code-standards.md`).
- For `POST` and `PATCH`, require a JSON content type. Otherwise return `415`. A body that is not valid JSON returns `400`. A body that is valid JSON but not an object returns `400`.
- Error responses always have the shape `{ "error": "<short message>" }`. Success responses always have one of the shapes above.
- An unexpected failure returns `500` with `{"error":"Internal server error"}`. Log the failure on the server without including secrets (no connection string, no tokens, no email addresses). Never send Prisma messages, stack traces or SQL to the client.
- Methods not defined on a route fall through to Next's default `405`.

## Hard rules

- Server-only: the data-access code in `lib/` must start with `import "server-only"`.
- No `any`. Use interfaces for request and response contracts (`code-standards.md`).
- No application logic inside the handlers beyond: authenticate, parse and validate, call the shared function, map the result to a response.
- Do not add or change Prisma schema fields, migrations or environment variables.
- Do not print, log or commit credentials.
- Do not modify `components/ui/*`, `proxy.ts`, existing specs or any UI file.
- Scratch or test files used for verification are deleted before reporting done, and every database row they create is removed.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. The four routes exist with exactly the methods above. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our files) pass.
2. With no session, `curl` against all four method-and-path combinations returns `401` with `{"error":"Unauthorized"}`, and the handlers also contain their own session check (confirmed by reading the code, since the proxy answers first).
3. Code review against this spec: owner ID comes only from the session, no request field can set `ownerId` or `status`, the update and delete use owner-scoped writes, the returned shape excludes `ownerId` and `canvasJsonPath`, error bodies never include internals.
4. Data-layer check, run if it can be done without installing anything (note: `server-only` can throw outside Next unless the process is run with the `react-server` condition): using the shared functions against the dev database, confirm that listing returns only the requested owner's projects; rename and delete as a different owner are refused (forbidden) and as the true owner succeed; a missing ID is not-found; and the cascade removes collaborator rows. Remove every row and the script afterwards. If it cannot be run, say so and list these cases for the user.
5. `git status` shows no changes to the schema, migrations, `proxy.ts` or UI files, and no credentials.
6. `context/progress-tracker.md` is updated to the real state, with these notes: the Shared list and collaborator logic are not built yet; deleting a project does not yet delete its Blob canvas snapshot (later storage spec must do this); the list has no pagination.

### What only the user can verify

The authenticated behavior needs a real signed-in session, which Opus does not have. After the above passes, Opus gives the user this checklist (browser console `fetch` calls on a signed-in `/editor` page, with the expected status for each) and does not claim it as verified:

- `GET /api/projects` returns `200` and the user's projects.
- `POST` with `{"name":"Test"}` returns `201`; with `{}` creates `Untitled Project`; with `{"name":123}` returns `400`; with a 61-character name returns `400`; with a non-JSON content type returns `415`.
- `PATCH` on an owned project returns `200` and the new name; with an empty name returns `400`.
- `DELETE` on an owned project returns `200`; repeating it returns `404`.
- `403` check: Opus creates one project owned by a fake owner ID (using a throwaway script, then tells the user its ID). `PATCH` and `DELETE` on that ID must return `403`. Afterwards Opus removes that row.

## Stop and ask if

- Feature 05 is not complete, the migration is not applied, or `lib/prisma.ts` is missing.
- The Next 16 route handler or dynamic params behavior differs from what this spec assumes.
- `auth()` in a route handler does not behave as described in the Clerk docs for the installed version.
- You think a new package, a schema change, an extra endpoint, a new environment variable or any UI change is needed.
- Anything here conflicts with `architecture-context.md`, `code-standards.md` or another spec.
- You are about to touch anything in the "Out of scope" list.
