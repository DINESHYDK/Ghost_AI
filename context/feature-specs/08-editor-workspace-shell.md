Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Auth and Collaboration Model", "Invariants"), `context/ui-context.md` ("Layout Patterns", "Icons", "Canvas", "Anti-AI slop Rules") and `context/code-standards.md` ("Next.js", "File Organization").

# Feature 08: Editor Workspace Shell

## Goal

Build the `/editor/[projectId]` workspace page: a server-side access check, the workspace layout (navbar with the project name, left project sidebar with the current project highlighted, a canvas placeholder, a right AI sidebar placeholder), and an `AccessDenied` screen. No canvas logic, no Liveblocks, no AI chat, no sharing behavior.

## Decisions (already made, do not revisit)

- **The route parameter is `projectId`, not `roomId`.** The Liveblocks room ID is the project ID (spec 07), so there is one identifier. The folder is `app/editor/[projectId]/`.
- **Access means: the user owns the project, or the user has a collaborator row for one of their verified emails.** Project status (`DRAFT` or `ARCHIVED`) is not considered.
- **A missing project and a project the user cannot access look identical** (the same `AccessDenied` screen), so the page never reveals whether a project ID exists.

## Dependencies

Specs 02 through 07 are complete. Check each and stop and ask if any is missing. This unit reuses:

- `EditorNavbar`, `ProjectSidebar`, `EditorDialog`, the dialogs and the hooks from specs 02, 04 and 07.
- The server data helpers and the verified-email logic from spec 07.
- `lib/prisma.ts` and the `Project` and `ProjectCollaborator` models.

## Scope

In scope:

1. `app/editor/[projectId]/page.tsx`: a server component.
2. `lib/project-access.ts`: the identity and access helpers.
3. `components/editor/access-denied.tsx`.
4. A workspace shell client component and an AI sidebar placeholder (`components/editor/ai-sidebar.tsx`).
5. Extending `EditorNavbar` and `ProjectSidebar` (listed below).
6. Updating `context/architecture-context.md` and `context/progress-tracker.md`.

Out of scope (do not start these):

- The canvas, React Flow, Liveblocks, room tokens, snapshots, Vercel Blob.
- AI chat content, a composer, message handling, or any model call.
- The share dialog and any sharing or collaborator behavior (spec 09 wires the Share button).
- Setting the page `<title>` or other metadata from the project name.
- An `error.tsx` or `loading.tsx`, tests, new packages, schema or API changes, and changes to `proxy.ts`.

## Verify before writing

1. Read the Next.js 16 docs in `node_modules/next/dist/docs/` for dynamic route pages: how `params` is received (it may be a promise), the typed page props helper, and that a page reading the Clerk session is rendered per request and never shared between users.
2. Read the Clerk docs for the installed `@clerk/nextjs` for `auth.protect()` and for reading the current user's verified emails (as in spec 07).
3. Read the real code of specs 02, 04 and 07 that you will extend (navbar props, sidebar props, the hooks, the shell) and the spec 07 verified-email logic.
4. Confirm that the lucide icons `Lock`, `Share2`, `PanelRightOpen`, `PanelRightClose` and `Sparkles` exist (they did).

## Access helpers: `lib/project-access.ts`

Server-only (`import "server-only"`). It contains only data and identity logic: no UI, no redirects, so the same helpers can later gate API routes and the Liveblocks token route (architecture invariant: room tokens only after membership is verified).

- **Current identity:** returns the Clerk `userId` and the user's **verified** email addresses, lowercased. Use verified emails only, as in specs 05 and 07 (the original wording "primary email" is replaced: a primary address is not necessarily verified). There must be **one implementation** of this logic. If spec 07 put it inside the shared-projects helper, extract it here and have the spec 07 helper import it.
- **Project access:** given a project ID and an identity, returns the project's `id` and `name` and whether the user is the owner, or reports no access. Do it as **one database query** whose `where` combines "this ID" with "owned by this user, or has a collaborator row with one of these emails". Then the project name is never read for a user without access, and a missing project and an inaccessible one return the same result.
- Nothing from `ownerId`, emails or other users' data is returned to the page beyond what the layout needs. `ownerId` never reaches the client.

## Page: `app/editor/[projectId]/page.tsx`

A server component. In order:

1. `await auth.protect()`. Unauthenticated users go to sign-in (the proxy also does this; the page checks for itself).
2. Resolve the identity, then the access result for `params.projectId`.
3. No access (or no project): render `AccessDenied` and **stop**. Do not fetch the project lists, and do not put the project name or any project data in the page.
4. Access granted: fetch the owned and shared lists with the spec 07 helpers (the same `ProjectListItem[]` as the editor home) and render the workspace shell with the project name, the list, and the current project ID.

## `AccessDenied`: `components/editor/access-denied.tsx`

- Centered in the viewport (full height, `bg-page`).
- A `Lock` icon (`h-8 w-8`, `text-copy-muted`), a short message that is the same for missing and unauthorized projects (for example: "You don't have access to this project, or it doesn't exist."), and a link back to `/editor` (a `next/link` styled as a Button, using the Button's `asChild`, outline variant).
- No project data, no extra decoration.

## Workspace layout

A full-viewport layout (`h-dvh`, no page scroll): the navbar on top, and the remaining space filled by the canvas area.

- **Navbar** (extend `EditorNavbar` with optional props only; the `/editor` home passes none of them and must look and behave exactly as before):
  - Center slot: the project name as the page's `h1`, single line, truncated with an ellipsis so a long name cannot push the toolbar buttons off screen.
  - Right section, in this order: a `Share` button (`Share2` icon, with the "Share" label from `sm` and up and icon only below; outline variant), the AI sidebar toggle, then the existing `UserButton`.
  - The `Share` button has no behavior in this unit (no handler, no dialog). Spec 09 wires it. It is shown to every user with access; who may share is decided in spec 09.
  - AI toggle: ghost icon button with `PanelRightClose` when open and `PanelRightOpen` when closed, `aria-label` ("Close AI sidebar" / "Open AI sidebar"), `aria-expanded`, `aria-controls` pointing at the AI sidebar's `id`. Do **not** use a sparkle icon here (see the sparkle rule below).
- **Left sidebar:** the existing `ProjectSidebar`, same behavior as before (floating overlay, closed by default), with these extensions:
  - New optional `activeProjectId`. The matching row is highlighted with `bg-accent-dim text-brand` (per `ui-context.md`) and has `aria-current="page"`.
  - Project rows become links to `/editor/<id>` (`next/link`), so projects can be opened. Spec 07 deliberately left rows non-clickable. Rename and Delete buttons on owned rows stay separate buttons beside the link, never nested inside it (no interactive element inside another).
- **Canvas area:** fills the rest of the space (`min-h-0 flex-1`), `bg-page`, with one centered, muted message such as "The canvas will appear here." No dot grid (it belongs to the real canvas), no illustration.
- **Right AI sidebar** (`components/editor/ai-sidebar.tsx`): a floating overlay mirroring the left sidebar's pattern: `fixed`, right side, below the navbar, `bg-ai-surface`, 1px `border-surface-border`, `rounded-md`, `shadow-md`, width 24rem capped to the viewport width minus the gap, slide-in transition (respect `motion-reduce`), `inert` and not visible when closed, Escape closes it when focus is inside, closed by default. It does not push or resize the canvas. Content: a header with one `Sparkles` icon in `text-ai-accent`, the title `AI Architect`, a close button (`X`), and a body with a muted placeholder line such as "AI chat is coming soon." No composer and no messages.
- **Sparkle rule:** the `Sparkles` icon appears exactly once on screen, in the AI sidebar header. `ui-context.md` allows at most one.
- **Small screens (below `md`):** a scrim behind each open sidebar, as in spec 04 (reuse the `--scrim` token and the same pattern; tapping the scrim closes that sidebar). Opening one sidebar closes the other, because they would overlap. At `md` and above both may be open and there is no scrim.
- Only one component should own the wiring of the sidebar, dialogs and project actions for both `/editor` and `/editor/[projectId]`. Avoid duplicating the hook and dialog wiring from spec 07: refactor the shared part so the home shell and the workspace shell both use it. The workspace passes the current project ID as `activeProjectId` to the spec 07 actions hook, so deleting the open project returns to `/editor`.

## Hard rules

- Tokens only. No hex values, raw palette classes or `dark:` color variants. No new tokens.
- Radii and weights follow the scale in `ui-context.md`. Icons are stroke-based `lucide-react`.
- `lib/project-access.ts` and anything using Prisma stay server-only and are never imported by a client component.
- Add `"use client"` only where hooks or browser APIs are needed. Report which files got it.
- Do not modify `components/ui/*`, the API routes, the schema, migrations or `proxy.ts`. Do not install packages.
- Do not print or log credentials, tokens or email addresses.
- Scratch or test files used for verification are deleted before reporting done, and every database row they create is removed.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our files) pass.
2. The page is a server component in `app/editor/[projectId]/`. `lib/project-access.ts` exists outside the page and starts with `import "server-only"`. There is exactly one implementation of the verified-email logic.
3. Code review against this spec: access is one query (id AND owner-or-collaborator-by-verified-lowercase-email); `AccessDenied` is rendered for both missing and unauthorized projects with identical content; the project name and lists are fetched only after access is granted; `ownerId` and emails never reach a client component; the navbar extensions are optional and the `/editor` home is unchanged.
4. Access-helper check, run if it can be done without installing anything (`server-only` can throw outside Next unless the process runs with the `react-server` condition). Using a throwaway project and fake IDs and emails in the dev database, confirm that the owner has access; a collaborator email has access in any letter case; a different user does not; an unverified or unrelated email does not; a nonexistent ID returns the same no-access result. Remove every row and the script afterwards. If it cannot be run, say so and list these cases for the user.
5. Signed-out check with `curl`: `/editor/anything` redirects to sign-in.
6. A grep of the changed files finds no hex values, no raw palette classes, no `font-bold`, no `rounded-lg` or larger, and exactly one `Sparkles` usage.
7. `git status` shows no changes to the API routes, schema, migrations, `proxy.ts` or `components/ui/*`.
8. `context/architecture-context.md` records the access rule (owner or verified-email collaborator, one shared helper for pages, and later for API routes and the Liveblocks token route). `context/progress-tracker.md` is updated to the real state, including: the Share button is inert until spec 09; the AI sidebar and canvas are placeholders; the `AccessDenied` page returns a normal page response (no `403` status).

### What only the user can verify

These need a signed-in session, which Opus does not have. Opus gives the user this checklist and does not claim it as verified. Check in both themes, at roughly 390px and 1366px:

- Spec 07's create flow now ends on the workspace: creating a project opens `/editor/<id>` and the navbar shows its name. Deleting the open project from the sidebar returns to `/editor`.
- A project you own opens; the sidebar (opened with the left toggle) highlights it, and clicking another project opens that one.
- A made-up ID, such as `/editor/does-not-exist`, shows `AccessDenied`, and the link returns to `/editor`.
- A project owned by someone else shows the same `AccessDenied`. To test without a second account, add a project owned by a fake owner ID in the Neon console (or Prisma Studio) and open its ID. Then add a `ProjectCollaborator` row with your verified email in lowercase: the project must now open. Remove the test rows afterwards.
- The navbar shows the project name (truncated when long), a Share button that does nothing yet, the AI toggle and the user menu.
- The AI sidebar opens and closes from its toggle, Escape and its close button, shows a single sparkle and the placeholder text, and does not move the canvas.
- On the narrow width a scrim appears behind each open sidebar, tapping it closes that sidebar, and opening one closes the other. On the wide width there is no scrim and both can be open.
- No page scroll; the canvas placeholder fills the space.

## Stop and ask if

- Specs 02 to 07 are incomplete, or their code differs from what this spec assumes.
- The Clerk docs do not provide a way to read verified emails on the server, or `auth.protect()` behaves differently from the spec 07 assumptions.
- The Next 16 dynamic route or `params` behavior contradicts this spec.
- Access cannot be expressed as a single query with the generated Prisma types.
- You think a new package, schema change, API change, new token or new environment variable is needed.
- Anything here conflicts with `architecture-context.md`, `ui-context.md` or another spec.
- You are about to touch anything in the "Out of scope" list.
