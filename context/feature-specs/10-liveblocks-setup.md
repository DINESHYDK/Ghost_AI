Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Stack", "Auth and Collaboration Model", "Canvas Node Schema", "Invariants"), `context/code-standards.md` ("API Routes", "File Organization") and `context/ui-context.md` ("Canvas").

# Feature 10: Liveblocks Setup (types, server client, auth route)

## Goal

Prepare the real-time collaboration infrastructure and nothing more: the shared TypeScript types for Presence and user metadata, a cached server-side Liveblocks client, a deterministic cursor-color helper, and the auth route that issues a Liveblocks session token **only to people who may open the project**. No provider, no canvas, no cursors on screen.

## Dependencies

- Specs 02 through 09 are complete. Check each and stop and ask if any is missing. This unit reuses `lib/project-access.ts` (spec 08: the verified identity and the one-query access check), the `{ "error": "..." }` response shape and JSON content-type rule from spec 06, and the Clerk and Prisma setup.
- **The Liveblocks packages are not installed yet.** The old spec said they were. `package.json` has none of them. This unit installs only what it needs (see below).
- **A Liveblocks secret key is needed, and only the user can provide it** (see "Environment").

## Decisions (already made, do not revisit)

- **The Liveblocks room ID is the project ID** (spec 07). One identifier everywhere.
- **Owner and collaborators both get full read and write access** to the room. There is no read-only role.
- **A missing project and a project the user cannot access return the same `403`,** so the route never reveals whether a project exists.
- **Cursor colors are stored as names, not hex values.** This mirrors the rule that node colors are stored as names (architecture invariant 6), so a cursor can be resolved to the right shade for the current theme later. The names come from the canvas color names, minus `neutral` (not distinct on a canvas) and `purple` (kept out of shared presence UI): `blue`, `orange`, `red`, `pink`, `green`, `teal`.
- **The room is created private** (`defaultAccesses: []`). Access comes only from the token this route issues.

## Scope

In scope:

1. Install `@liveblocks/client` and `@liveblocks/node`, pinned to the same exact 3.x version (the registry showed 3.24.4 at the time of writing). Install `@liveblocks/react` too only if the Liveblocks docs say the config file needs it. Install no other packages.
2. `liveblocks.config.ts` at the project root: the global types.
3. `lib/liveblocks.ts`: the cached server-side client.
4. A cursor-color helper in `lib/`.
5. `app/api/liveblocks-auth/route.ts`: the auth route.
6. Updating `context/architecture-context.md` and `context/progress-tracker.md`.

Out of scope (do not start these):

- `LiveblocksProvider`, `RoomProvider`, any Liveblocks hook, any component.
- React Flow, `@xyflow/react`, `@liveblocks/react-flow`, `@liveblocks/react-ui`, the `Storage` type, canvas persistence, snapshots, Blob.
- Rendering cursors or presence on screen, the AI `isThinking` behavior, comments, notifications, webhooks.
- Deleting a Liveblocks room when a project is deleted, and disconnecting a removed collaborator from a live room. Record both in the tracker as later work (see "Done when").
- Rate limiting, any change to the schema, `proxy.ts`, existing routes or `components/ui/*`.

## Environment

- This unit needs exactly one new environment variable, `LIVEBLOCKS_SECRET_KEY`. It is the library's documented name. Do not add any other variable, and never give it a `NEXT_PUBLIC_` prefix.
- The user creates a Liveblocks account and project, uses the **development** secret key (not production), and puts it in `.env.local`. Opus does not create accounts or projects.
- If the variable is missing, **stop and ask**. Check it without printing the value or any slice of it: report only booleans, such as "present", "starts with `sk_`" and whether its naming marks it as a development key (confirm the naming in the Liveblocks docs). If the value is not a secret key (for example it starts with `pk_`), or it looks like a production key, stop and tell the user.
- Never print, log or commit the key.

## Verify before writing

Read the Liveblocks docs for the installed 3.x version. Do not write from memory. Confirm:

1. How the types are declared in `liveblocks.config.ts` (a global `Liveblocks` interface with `Presence` and `UserMeta`), and that `UserMeta` has `id` and `info`. Presence and user info must be JSON-serializable.
2. The `@liveblocks/node` API: the `Liveblocks` constructor and its `secret` option, `getOrCreateRoom` (the `defaultAccesses` option is required), `prepareSession(userId, { userInfo })`, `session.allow(roomId, permissions)` and `session.authorize()`. The docs show full access as the permission string `["*:write"]`. Use whatever the installed version documents.
3. How the Liveblocks client calls an auth endpoint (the request body carries the room ID) and **which HTTP statuses it treats as final versus retryable**, in particular `401` and `403`. The spec requires `403` for no access. If the docs say `403` makes the client retry in a loop, stop and ask.
4. Any size limit on `userInfo`.
5. Next.js 16 route handler behavior (request body parsing, no caching of this route), and the Clerk docs for reading the current user's name and image on the server.
6. That `liveblocks.config.ts` at the project root is picked up by the project's `tsconfig.json`.

## `liveblocks.config.ts`

Declares the global types and nothing else.

- **Presence:** `cursor`: either `{ x: number; y: number }` or `null` (null when the pointer is off the canvas); `isThinking`: `boolean`.
- **UserMeta:** `id: string` (the Clerk user ID) and `info` with: `name: string`, `avatar: string | null` (image URL), `color`: one of the six cursor color names above (use a shared type or constant so the helper and this config cannot drift).
- Do not declare `Storage` or `RoomEvent`. The canvas spec adds them.

## `lib/liveblocks.ts`

- Starts with `import "server-only"`.
- Exports the Liveblocks Node client as a **cached singleton**: created once and reused, cached on `globalThis` outside production so hot reloads do not create new clients (the same pattern as `lib/prisma.ts`).
- Create it **lazily, on first use**, and throw a clear error at that moment if the secret is missing. Do not construct it when the module is imported, so `next build` does not need the secret.
- The secret is only ever read from `process.env.LIVEBLOCKS_SECRET_KEY` on the server.

## Cursor color helper

- A pure function `userId -> color name` with no side effects and no imports from the server or the browser, so it works in both.
- Deterministic: the same ID always gives the same name, across sessions and machines. Use a simple stable string hash modulo the palette length.
- The palette is the six names above in a fixed order. Changing the order or contents would change everyone's color, so add a one-line comment saying so.

## Auth route: `POST /api/liveblocks-auth`

Only `POST` is defined. The Liveblocks client sends the room ID in the JSON body (`{ "room": "<id>" }`).

In order:

1. Require a JSON content type (otherwise `415`). A body that is not valid JSON, is not an object, or lacks a non-empty string `room` of at most 128 characters is `400` with `{"error":"Invalid request"}`.
2. Read the Clerk session with `await auth()`. No user: `401` with `{"error":"Unauthorized"}` (same body as the proxy and the other routes).
3. Verify access with the spec 08 helpers: the identity (verified emails, lowercased) and the single access query for project ID `room`. No access, or no such project: `403` with `{"error":"Forbidden"}`. The response must be identical for both cases. Do all of this **before** any Liveblocks call.
4. Ensure the room exists with `getOrCreateRoom(room, { defaultAccesses: [] })`. Do not store anything else in the room metadata.
5. Read the user's display name and image from Clerk. The name is the full name, falling back to the username, and finally to a generic label such as `Collaborator`. **Never use an email address as the name**, because presence info is visible to everyone in the room.
6. `prepareSession(userId, { userInfo: { name, avatar, color } })` where `color` comes from the helper. Allow **only** the requested room, with write access. No wildcard room patterns.
7. `authorize()` and return its body and status as the response, with `Cache-Control: no-store`.

Other rules for this route:

- The token is a credential. Never log it, and never include it in an error message.
- An unexpected failure (including a Liveblocks outage) is `500` with `{"error":"Internal server error"}`. Log on the server without secrets, tokens or email addresses.
- `userInfo` contains only `name`, `avatar` and `color`. No email, no Clerk IDs beyond the session user ID, no project data.

## Hard rules

- Server-only code (`lib/liveblocks.ts`, the route, anything using the secret) starts with `import "server-only"` where it is a module in `lib/`, and is never imported by a client component. The secret never reaches the client bundle.
- `liveblocks.config.ts` and the color helper contain no secrets and no server-only imports.
- No `any`. Interfaces for the request and response contracts.
- Do not modify the schema, `proxy.ts`, existing routes, `components/ui/*` or any UI file. Do not add environment variables other than `LIVEBLOCKS_SECRET_KEY`.
- Do not print or log credentials, tokens, or email addresses.
- Scratch or test files used for verification are deleted before reporting done, and every Liveblocks room or database row they create is removed.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. The installed Liveblocks packages are listed with their versions, all on the same 3.x version, and no other packages were added. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our files) pass.
2. A throwaway type check proves the global types work: a scratch file that uses the Liveblocks client types sees `Presence.cursor`, `Presence.isThinking` and `UserMeta.info.color` with the right types, and a wrong type is a compile error. Delete it afterwards.
3. The color helper returns the same name for the same ID on repeated calls, always returns one of the six names, and spreads a set of sample IDs across more than one name. Verify with a throwaway script if it can be run without installing anything, then delete it. If not, say so.
4. With no session, `curl -X POST` to the auth route returns `401` with `{"error":"Unauthorized"}`.
5. Code review against this spec: access is verified before any Liveblocks call; no access and no project give the same `403`; the room is created private; only the requested room is allowed, with no wildcard; `userInfo` has only `name`, `avatar` and `color` and never an email; the client is created lazily and cached; the secret is only read on the server; the token is never logged; the route sets `Cache-Control: no-store`.
6. `git status` shows no changes to the schema, `proxy.ts`, existing routes, UI files or `components/ui/*`, and no credentials.
7. `context/architecture-context.md` records: the room ID equals the project ID; room tokens are issued only through `/api/liveblocks-auth` after the spec 08 access check; owner and collaborators both get write access; cursor colors are stored as names. `context/progress-tracker.md` is updated to the real state, with these later-work notes: deleting a project does not yet delete its Liveblocks room (or its Blob snapshot); removing a collaborator does not disconnect them from a live room until their token expires; Liveblocks plan limits on the free tier have not been checked.

### What only the user can verify

This needs a signed-in session and a real Liveblocks key, which Opus does not have. Opus gives the user this checklist and does not claim it as verified:

- Put the Liveblocks development secret key in `.env.local` as `LIVEBLOCKS_SECRET_KEY` (never paste it into the chat).
- Signed in, on any editor page, open the browser console and run a `fetch` `POST` to `/api/liveblocks-auth` with a JSON body `{ "room": "<id of a project you own>" }` and a JSON content type. Expect `200` and a body containing a token. Check in the Liveblocks dashboard that a room with that ID now exists.
- Repeat with a made-up room ID: expect `403` `{"error":"Forbidden"}`. Repeat with a project you do not have access to (use the fake-owner trick from spec 08): the same `403` and the same body.
- Repeat while signed out (a private window): expect `401`.
- Use the spec 08 trick to make yourself a collaborator on a fake-owner project: the route returns `200`. Remove the test rows afterwards.

## Stop and ask if

- Specs 02 to 09 are incomplete, or `lib/project-access.ts` differs from what this spec assumes.
- `LIVEBLOCKS_SECRET_KEY` is missing, is not a secret key, or looks like a production key.
- The Liveblocks 3.x docs differ from this spec (the type declaration, the Node client API, the permission string, `getOrCreateRoom` options) or say `403` makes the client retry.
- The room cannot be created private with an access-token session in the installed version.
- You think a new package, a new environment variable, a schema change, a UI change or a change to an existing route is needed.
- Anything here conflicts with `architecture-context.md`, `ui-context.md` or another spec.
- You are about to touch anything in the "Out of scope" list.
