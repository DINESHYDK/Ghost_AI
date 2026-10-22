# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes. `proxy.ts` is default-deny: only the sign-in and sign-up paths (from the `NEXT_PUBLIC_CLERK_SIGN_*_URL` env vars) are public. Signed-out page requests redirect to sign-in; signed-out `/api` requests receive `401 {"error":"Unauthorized"}`.
- The proxy is not the only gate: every page, route handler and server function verifies auth on the server itself.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to Vercel Blob at `specs/{projectId}/{specId}.md`; the database stores the blob URL and links it to the project.

## Canvas Node Schema

- A node's color is stored as a name from a fixed enum of 8: `neutral`, `blue`, `purple`, `orange`, `red`, `pink`, `green`, `teal`. Never a hex value.
- The name is resolved to the dark or light color pair at render time (`NODE_COLORS` in `types/canvas.ts`; values in `ui-context.md`).
- An unknown or missing name falls back to `neutral`.
- AI design generation must output colors from this enum only. Validate its output against the enum before writing to the room.
- Starter templates use the same enum.
- Why: nodes follow the theme with no data migration, the palette can be retuned without touching saved canvases, and collaborators on different themes see correct colors.

## API Status and Error Policy

One policy for every route under `app/api`. Handlers never hand-write error responses: they use the shared helpers in `lib/api/http.ts`.

**Response shapes**

- Success: a JSON object with a named key, never a bare array: `{ "project": {...} }`, `{ "projects": [...] }`, `{ "collaborator": {...} }`, `{ "collaborators": [...] }`, and `{ "id": "..." }` for deletes. No `204`, so clients can always parse JSON.
- Error: `{ "error": "<short message>" }`. Messages are short and fixed (`Unauthorized`, `Forbidden`, `Project not found`, `Collaborator not found`, `Internal server error`, and the validation messages). They never include stack traces, Prisma or SQL text, tokens, or email addresses.

**Status codes**

| Code  | Meaning                                                              | Examples                                                       |
| ----- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `200` | Read, update or delete succeeded                                     | list, rename, delete                                           |
| `201` | A resource was created                                               | create project, invite collaborator                            |
| `400` | The request itself is invalid                                        | not JSON, not an object, failed validation, inviting yourself  |
| `401` | No signed-in session                                                 | same body from the proxy and from every handler                |
| `403` | Signed in, the resource exists, but the caller may not do this       | non-owner rename/delete, collaborator inviting or removing     |
| `404` | The resource does not exist                                          | unknown project ID, unknown collaborator row                   |
| `409` | Valid request that conflicts with current state                     | already a collaborator, collaborator limit reached             |
| `415` | A JSON endpoint received another content type                        | `POST` or `PATCH` without `application/json`                   |
| `500` | Unexpected failure                                                   | generic body; details only in server logs, without secrets     |

Next.js answers `405` itself for methods a route does not define.

**Order of checks in a handler:** `401` (session) → `415` / `400` (content type, parse, validate; no database work yet) → `404` / `403` (look up the resource, then authorize) → `409` (state conflicts) → success. Ownership is also enforced in the write itself (owner ID in the `where`), not only checked beforehand.

**Who gets which answer.** On project and collaborator API routes a missing resource is `404` and a resource the caller may not touch is `403`, including for a signed-in stranger. The trade-off: `403` confirms that an ID exists. That is accepted because project IDs are random cuids that cannot be guessed, and a caller who already has the ID (for example from a shared link) learns nothing new. When the shared access helper reports "no access" (it deliberately does not distinguish missing from forbidden), the route makes a second, ID-only existence query to choose between `404` and `403`.

**Two deliberate exceptions, which do not distinguish missing from forbidden:**

1. **Pages** (`/editor/[projectId]`): the same `AccessDenied` screen, so a page never reveals whether a project exists. It is a normal page response, not a `403`.
2. **`POST /api/liveblocks-auth`:** `403` for both, because the Liveblocks client treats that status as a final refusal.

**Client side:** the UI maps statuses to user-facing messages in one place (the project actions hook), using the fixed messages from spec 07. It never displays raw server text.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
6. Node colors are stored as enum names, never hex values.
7. API routes follow the status and error policy above, using the shared helpers in `lib/api/http.ts`.
