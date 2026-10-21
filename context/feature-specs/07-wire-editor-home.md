Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Auth and Collaboration Model", "Invariants"), `context/code-standards.md` ("Next.js", "API Routes", "File Organization") and `context/ui-context.md` ("Layout Patterns").

# Feature 07: Wire the Editor Home to Real Project Data

## Goal

Replace the mock data from spec 04 with the real projects from the database, and connect the Create, Rename and Delete dialogs to the real project API from spec 06. The UI built in spec 04 stays the same, with real data and real failure handling.

## Dependencies

All three must be complete. Check each, and stop and ask if any is missing:

- Spec 04: `hooks/use-project-dialogs.ts`, `components/editor/project-dialogs.tsx`, `editor-home.tsx`, the sidebar actions, `types/project.ts` (`ProjectListItem`), `lib/mock-projects.ts`.
- Spec 05: `lib/prisma.ts`, the generated client, the applied migration.
- Spec 06: the four project API routes and their `lib/` data helpers.

## Decision (already made, do not revisit)

**The Liveblocks room ID is the project ID.** A project's ID is the database-generated cuid. It is used for the database row, the workspace URL (`/editor/<projectId>`) and, in later specs, the Liveblocks room. Nothing derives an ID from the project name: there is no slug, no name-based suffix, and the client never supplies an ID. Record this rule in `architecture-context.md` (Invariants or Auth and Collaboration Model, whichever fits).

## Scope

In scope:

1. `app/editor/page.tsx` (spec 03's file): fetch the owned and shared projects on the server and pass them to `EditorShell`.
2. A read-only server helper in `lib/` that lists the projects shared with the current user (see "Shared projects").
3. `hooks/use-project-actions.ts` (new): the API calls, navigation and refresh.
4. Changes to the spec 04 files: `use-project-dialogs.ts`, `project-dialogs.tsx`, `editor-shell.tsx`, `project-sidebar.tsx`.
5. Deleting `lib/mock-projects.ts`.
6. Updating `context/architecture-context.md` (the decision above) and `context/progress-tracker.md`.

Out of scope (do not start these):

- The workspace route `/editor/[projectId]` and anything inside it (spec 08). Opening a project from the sidebar is not added here either: sidebar rows stay non-clickable.
- Adding collaborators, the share dialog, invite flows (a later spec). Shared projects can only appear if collaborator rows already exist.
- Changes to the API routes, the Prisma schema, migrations or `proxy.ts`.
- Liveblocks, the canvas, Vercel Blob.
- Optimistic updates, toasts, pagination, an `error.tsx` or `loading.tsx` for the editor page, polling or real-time list updates.
- New packages.
- Any visual change beyond showing an error message in the dialogs.

## Verify before writing

1. Read the Next.js 16 docs in `node_modules/next/dist/docs/`: server components that fetch data, `useRouter` and `router.refresh()` in the App Router, and that a page which reads the Clerk session is rendered per request and never shared between users.
2. Read the Clerk docs for the installed `@clerk/nextjs`: what `auth.protect()` returns in a server component (the user ID), and how to read the current user's **email addresses and their verification status** on the server (for example `currentUser()`).
3. Read the real exports of the spec 06 helpers in `lib/` (names, argument types, returned shape) and of the spec 04 hook and dialogs. Use what exists. Do not rewrite them.
4. Read `app/api/projects/*` to confirm the status codes and bodies that the client must handle.

## Data fetching (server)

- `app/editor/page.tsx` stays a **server component**. It gets the user ID from `await auth.protect()`, then calls the `lib/` helpers **directly** (never an HTTP call to its own API). Fetch the owned and shared lists in parallel.
- No client-side fetching for the initial load: no `useEffect`, no SWR, no fetch on mount.
- Pass `EditorShell` a single `projects: ProjectListItem[]` (`{ id, name, isOwner }` only). Owned projects have `isOwner: true`, shared ones `false`. Do not send any other field (no `ownerId`, no `canvasJsonPath`, no timestamps) to the client.
- Order: owned newest first, then shared newest first (each list in the order the helpers return).
- `EditorShell` renders directly from its `projects` prop. Do **not** copy the prop into `useState`, or the list goes stale after `router.refresh()`.

## Shared projects

Spec 06 only lists owned projects, so this unit adds the read side for shared ones. Writing collaborators comes in a later spec.

- A new server-only helper in `lib/` (starts with `import "server-only"`) returns projects where a `ProjectCollaborator` row matches one of the current user's emails.
- Only **verified** Clerk email addresses count. Unverified addresses are ignored (`05-prisma.md` explains why: otherwise someone could claim an address they do not own).
- Compare lowercase to lowercase (collaborator emails are stored lowercase; lowercase the user's emails too).
- Exclude projects the user owns, so nothing appears twice.
- Newest first. Select only the fields needed (no `ownerId`, no `canvasJsonPath`).
- If the user has no verified email, or reading emails fails, the shared list is empty. It is not an error that breaks the page.

## Project actions: `hooks/use-project-actions.ts`

A `"use client"` hook that performs the mutations. It does **not** manage dialog or form state. That already lives in `use-project-dialogs.ts` (spec 04), which receives these operations as `onCreate`, `onRename` and `onDelete`. Do not duplicate dialog state.

- Input: an optional `activeProjectId` (the project currently open in a workspace, or none). On the editor home there is none. Spec 08 passes the real value.
- Output: `createProject(name)`, `renameProject(id, name)`, `deleteProject(id)`. Each resolves to success, or to a user-presentable error message. Expected failures (non-2xx responses, network errors) are returned, not thrown.
- Requests: same-origin relative URLs, `Content-Type: application/json` on `POST` and `PATCH` (spec 06 returns `415` otherwise), and a body that contains only `name`. Never send an owner ID, an ID, or a status. Encode the project ID in the URL path. Parse JSON responses defensively: a body that is not the expected shape counts as a failure. No `any`.
- Ignore a second call while one is already in flight.

Operations:

- **Create:** `POST /api/projects` with `{ name }`. On success, read the new project's `id` from the response and navigate to `/editor/<id>`. That route is built in spec 08, so until then the browser shows Next's 404. This is expected. See the note under "Done when".
- **Rename:** `PATCH /api/projects/<id>` with `{ name }`. On success, `router.refresh()`.
- **Delete:** `DELETE /api/projects/<id>`. On success: if the deleted ID equals `activeProjectId`, navigate to `/editor`, otherwise `router.refresh()`.

Error messages, mapped from the response (never show raw server text, stack traces or exception messages):

| Result                          | Message shown                                        | Extra                                  |
| ------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| `400`                           | `That name isn't valid. Use 1 to 60 characters.`     |                                        |
| `401`                           | `Your session has expired. Please sign in again.`    |                                        |
| `403`                           | `You don't have permission to do this.`              |                                        |
| `404` (rename or delete)        | `This project no longer exists.`                     | also call `router.refresh()`           |
| anything else, or network error | `Something went wrong. Please try again.`            |                                        |

## Wiring (changes to the spec 04 files)

- **`use-project-dialogs.ts`:** remove the simulated delay and its comment. The loading state now lasts for the real request. If the operation reports an error, keep the dialog open, store the message and re-enable the controls. If it succeeds, close the dialog. Typing in the name field or closing the dialog clears the error. Keep the rule that the dialog cannot be dismissed while loading.
- **`project-dialogs.tsx`:** show the error message when there is one: `text-error`, with `role="alert"`, directly under the input (Create and Rename) or in the dialog body (Delete). Nothing else visual changes. There is no ID or URL preview in the Create dialog (spec 04).
- **`editor-shell.tsx`:** receives `projects` as a prop, creates the actions hook, and passes its three operations into the dialogs hook. It still owns `isSidebarOpen`. The in-memory list and its handlers from spec 04 are removed.
- **`project-sidebar.tsx`:** unchanged in behavior. It now renders what the shell passes in (owned under `My Projects`, shared under `Shared`, existing empty states when a list is empty, actions on owned rows only).
- Delete `lib/mock-projects.ts` and make sure nothing imports it.

## Hard rules

- Server-only code stays server-only. The new shared-projects helper and anything using Prisma must never be imported into a client component.
- Tokens only. No hex values, raw palette classes or `dark:` color variants. No new tokens.
- Do not modify `components/ui/*`, the API routes, the schema or `proxy.ts`.
- Add `"use client"` only where hooks or browser APIs are needed. Report which files got it.
- Do not print or log credentials, tokens or email addresses.
- Scratch or test files used for verification are deleted before reporting done, and every database row they create is removed.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our files) pass.
2. `lib/mock-projects.ts` is deleted and nothing references it. A grep of the changed files finds no `useEffect` that fetches, no `useState` initialised from the `projects` prop, no `slug` or `slugify`, no hex values, no raw palette classes.
3. Code review against this spec: `page.tsx` is a server component that calls the helpers directly and in parallel; only `{ id, name, isOwner }` reaches the client; the shared helper uses only verified, lowercased emails and excludes owned projects; the hook sends only `name`, sets the JSON content type, encodes the ID, ignores double submits, and follows the navigate/refresh rules; every row of the error table is implemented; dialog state is not duplicated in the new hook.
4. Shared-helper check, run if it can be done without installing anything (`server-only` can throw outside Next unless the process runs with the `react-server` condition): using a throwaway test project and fake emails in the dev database, confirm that a collaborator email returns the project for that email in any letter case, does not return it for another email, and does not return it for its owner. Remove every row and the script afterwards. If it cannot be run, say so and list these cases for the user.
5. `git status` shows no changes to the API routes, schema, migrations, `proxy.ts` or `components/ui/*`.
6. `context/architecture-context.md` has the room-ID rule, and `context/progress-tracker.md` is updated to the real state, including: the editor page has no `error.tsx` or `loading.tsx`; create navigates to a route that spec 08 builds; shared projects can only appear once collaborators can be added.

**Note on navigation:** until spec 08 exists, "create navigates to the workspace" cannot be checked end to end. In this unit, verify by code review that the hook navigates to `/editor/<id>` with the ID returned by the API. The end-to-end check is repeated in spec 08's done-when.

### What only the user can verify

These need a signed-in session, which Opus does not have. Opus gives the user this checklist and does not claim it as verified. Check in both themes at a narrow and a wide width:

- The sidebar shows the user's real projects (create one first if the list is empty), newest first, and a reload keeps them (data now comes from the database).
- Create: the dialog shows no preview; submitting shows the loading state, then navigates to `/editor/<new id>` (a 404 page is expected until spec 08). Going back to `/editor` shows the new project.
- Rename: the dialog is prefilled; after saving, the sidebar shows the new name.
- Delete: after confirming, the project disappears from the sidebar.
- Error handling: delete a project in another browser tab, then rename or delete it in the first tab. The dialog shows `This project no longer exists.` and the list corrects itself.
- Shared tab: empty for a normal account. To see a shared item, add a `ProjectCollaborator` row in the Neon console (or Prisma Studio) for a project owned by a different owner ID, using the user's verified email in lowercase. It must appear under `Shared` with no Rename or Delete buttons. Remove the test rows afterwards.

## Stop and ask if

- Spec 04, 05 or 06 is incomplete, or its exports differ from what this spec assumes.
- The Clerk docs for the installed version do not offer a way to read verified email addresses on the server, or `auth.protect()` does not return the user ID.
- The API's status codes or bodies differ from spec 06.
- The Next 16 behavior for `router.refresh()` or per-request rendering contradicts this spec.
- You think a new package, a schema change, a new endpoint, a new environment variable or a new token is needed.
- Anything here conflicts with `architecture-context.md`, `ui-context.md` or another spec.
- You are about to touch anything in the "Out of scope" list.
