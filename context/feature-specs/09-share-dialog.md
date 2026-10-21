Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Auth and Collaboration Model", "Invariants"), `context/code-standards.md` ("API Routes", "Next.js", "File Organization") and `context/ui-context.md` ("Component Library", "Layout Patterns", "Anti-AI slop Rules").

# Feature 09: Share Dialog (collaborators)

## Goal

Make the workspace `Share` button open a share dialog. The project owner can invite collaborators by email, see them, remove them and copy the project link. A collaborator can see the list only. Collaborators are stored by email in the existing `ProjectCollaborator` table. Clerk is used only to enrich emails with a display name and avatar. There is no local user table.

## Dependencies

Specs 02 through 08 are complete. Check each and stop and ask if any is missing. This unit reuses:

- `EditorDialog` (spec 02) and the workspace shell, navbar and `Share` button (spec 08).
- `lib/project-access.ts` (spec 08): the verified-email identity helper and the access helper that tells owner from collaborator from no access.
- The project API conventions (spec 06): the `{ "error": "..." }` shape, the JSON content-type rule, the `401` body, thin handlers, server-only `lib/` code.
- The `ProjectCollaborator` model (spec 05): unique `(projectId, email)`, emails stored lowercase.

## Decisions (already made, do not revisit)

- **Inviting stores a row and nothing else.** No email is sent (the project has no email service). The invited person gets access once they sign in with a **verified** email that matches. The owner shares the link themselves (hence the copy-link button). The dialog text says this.
- **People can be invited whether or not they have an account.** If no Clerk user matches the email, the list shows the email only.
- **Both owner and collaborators can open the dialog and copy the link.** Only the owner sees the invite form and the remove buttons.
- **No access gets `404`, not `403`,** on the new collaborator routes (so a stranger cannot learn that a project exists). A collaborator trying an owner-only action gets `403`.
- Removing a collaborator has no confirmation step, because inviting them again undoes it.
- A project can have at most **20** collaborators.

## Scope

In scope:

1. API routes: `app/api/projects/[projectId]/collaborators/route.ts` (`GET`, `POST`) and `app/api/projects/[projectId]/collaborators/[collaboratorId]/route.ts` (`DELETE`).
2. Server-only code in `lib/` for the collaborator data operations and the Clerk enrichment (internal file layout is up to the implementer).
3. `components/editor/share-dialog.tsx`, a client hook (for example `hooks/use-collaborators.ts`) for the dialog's list, invite and remove state, and the shadcn `avatar` component added with the shadcn CLI.
4. Wiring: the navbar `Share` button, the workspace shell, and the workspace page passing `projectId` and `isOwner`.
5. Updating `context/architecture-context.md` and `context/progress-tracker.md`.

Out of scope (do not start these):

- Sending emails, notifications, invitation links or tokens, pending versus accepted states.
- Roles beyond owner and collaborator (no view-only or edit levels), leaving a project yourself, transferring ownership, showing the owner as a row in the list.
- Public or anyone-with-the-link access. Opening the link still requires being the owner or a listed collaborator.
- Liveblocks, canvas, real-time removal of a collaborator who has the project open (they lose access on their next page load).
- A local user table, Clerk webhooks, rate limiting, audit logs, bulk invites, editing a collaborator's email.
- Changes to the Prisma schema, migrations, `proxy.ts`, spec 06's routes, or `components/ui/*` other than adding `avatar`.
- New packages other than what the shadcn `avatar` CLI install adds (it uses `radix-ui`, already installed).

## Verify before writing

1. Read the Next.js 16 docs in `node_modules/next/dist/docs/` for route handlers with two dynamic segments, and for client components that fetch on open.
2. Read the Clerk docs for the installed `@clerk/nextjs`: how to get the Clerk backend client on the server, how to look users up by email address, and which user fields exist (first and last name, username, image URL, and each email address with its verification status).
3. Read the real code of `lib/project-access.ts`, `EditorDialog`, the workspace shell and the navbar from specs 02, 08 and 06.
4. Confirm that the shadcn registry offers `avatar` for this project's style, and read what it generates before using it.

## Authorization

Every collaborator route:

1. Reads the Clerk session itself and returns `401` with `{"error":"Unauthorized"}` if there is none (same body as spec 06 and the proxy).
2. Uses the spec 08 access helper to learn the caller's relationship to the project: owner, collaborator, or none.
3. None (including a project that does not exist): `404` with `{"error":"Project not found"}`.
4. `GET` allows owner and collaborator. `POST` and `DELETE` allow the owner only; a collaborator gets `403` with `{"error":"Forbidden"}`.

The client-side `isOwner` flag only decides what the UI shows. The server always decides.

## Routes

### `GET /api/projects/[projectId]/collaborators`

- `200` with `{ "collaborators": [ ... ] }`, oldest first. An empty list is `[]`.
- Each item: `id` (the collaborator row ID), `email`, `createdAt`, `displayName` (or `null`), `imageUrl` (or `null`).
- Enrichment from Clerk, one batched lookup for the whole list (never one call per collaborator):
  - Only a Clerk user whose **verified** email address equals the collaborator email counts as a match. An unverified address on someone's Clerk account must never produce a name or avatar for that email.
  - Return only the display name and the image URL. Never return Clerk user IDs or other email addresses.
  - If Clerk fails or finds nothing, the item still returns with `displayName: null` and `imageUrl: null`. A Clerk failure never fails the request.

### `POST /api/projects/[projectId]/collaborators`

- Body: JSON `{ "email": string }`, content type JSON (otherwise `415`). A body that is not valid JSON or not an object is `400`.
- Validate: trim, lowercase, at most 254 characters, no whitespace, exactly one `@`, a non-empty local part, a domain with at least one dot. Anything else is `400` with `{"error":"Enter a valid email address."}`.
- Reject the owner's own email: if the email is one of the caller's verified emails, `400` with `{"error":"That's your own email."}`.
- Already a collaborator: `409` with `{"error":"This person already has access."}`.
- Already 20 collaborators: `409` with `{"error":"Collaborator limit reached."}`.
- Success: `201` with `{ "collaborator": { id, email, createdAt, displayName, imageUrl } }`.
- Never read the project ID, the owner, or any other field from the body. The project comes from the URL and is authorized as above.

### `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]`

- Owner only. The delete is scoped to **both** the collaborator ID and the project ID from the URL, so an owner cannot remove a collaborator of someone else's project by guessing a row ID.
- A collaborator row that does not exist in this project: `404` with `{"error":"Collaborator not found"}`.
- `200` with `{ "id": "<collaboratorId>" }`.

### Request handling rules (all routes)

- Validate input before any database or Clerk call. Error bodies are `{ "error": "<short message>" }`.
- An unexpected failure is `500` with `{"error":"Internal server error"}`. Log it on the server without secrets, tokens or email addresses, and never send internals to the client.
- Responses for the signed-in user must never be cached or shared between users (confirm the Next 16 behavior).

## Share dialog (UI)

Built on `EditorDialog`. The workspace `Share` button opens it. The navbar now needs the open state through the workspace shell.

- Title `Share project`. Description for the owner: `Invite people by email. They can open this project when they sign in with that email.` Description for a collaborator: `People with access to this project.`
- **Invite form (owner only):** a real `<form>` with a labelled email input (`Email address`) and an `Invite` button, disabled while the field is empty or while a request is running. While inviting, the button shows `Inviting…`. Errors from the server (the messages above) show inline under the input in `text-error` with `role="alert"`. On success the input clears and the list refreshes.
- **List:** each row shows an avatar (the shadcn Avatar, with the image when there is one and the person's initial otherwise), the display name when there is one with the email in muted text beneath (or the email alone), and, for the owner only, a ghost icon `Remove` button with an `aria-label` that includes the email. Collaborators see no remove buttons at all (not disabled ones). A long list scrolls inside the dialog (`ScrollArea`).
- **States:** `Loading…` while the list loads. If the list fails to load: a message and a `Retry` button. Empty: `No collaborators yet.` Removing shows a per-row loading state and disables only that row's button. A failed remove shows an inline error in the dialog.
- **Fetching:** the list loads when the dialog opens (client-side, because the dialog opens on demand), and reloads after each successful invite or remove. Ignore any response that arrives after the dialog was closed or reopened.
- **Copy link:** a `Copy link` button in the footer, next to `Done`. It copies `<current origin>/editor/<projectId>` using the browser clipboard API, then the button label changes to `Copied!` for about 2 seconds and returns to `Copy link` (clear the timer when the dialog closes). If copying fails, show `Couldn't copy` the same way. The label change is announced to assistive technology (`aria-live="polite"`). Do not add an environment variable for the base URL.
- Closing the dialog resets the form and errors. Dismissing is blocked only while an invite request is running.

## Wiring

- The workspace page (spec 08) already knows whether the user is the owner, because the access helper tells it. Pass `projectId` and `isOwner` to the workspace shell. Do not pass `ownerId` or any email.
- `EditorNavbar`: the `Share` button gets an `onClick` through a new optional prop. It stays visible to everyone with access, as in spec 08. The `/editor` home navbar stays unchanged.

## Hard rules

- Tokens only. No hex values, raw palette classes or `dark:` color variants, and no new tokens. Radii and weights follow `ui-context.md`.
- Server-only code (the collaborator helpers, the Clerk calls) starts with `import "server-only"` and is never imported by a client component. The Clerk secret key never reaches the client bundle.
- The Clerk lookup only ever runs on the server and only ever returns the display name and image URL.
- No `any`. Interfaces for the request and response contracts.
- Do not modify `components/ui/*` other than adding `avatar` with the shadcn CLI. Do not change the schema, migrations, `proxy.ts` or spec 06's routes. Do not add environment variables.
- Do not print or log credentials, tokens or email addresses.
- Scratch or test files used for verification are deleted before reporting done, and every database row they create is removed.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our files) pass.
2. With no session, `curl` against the three routes (all methods) returns `401` with `{"error":"Unauthorized"}`.
3. Code review against this spec: handlers authenticate, authorize through the spec 08 helper, validate, call the shared function and map the result; owner-only routes reject collaborators with `403` and strangers with `404`; the delete is scoped to collaborator ID and project ID; emails are trimmed and lowercased before storage; the 20-collaborator cap and the duplicate and self-invite checks are enforced on the server; Clerk enrichment accepts only a verified email match, is batched, and its failure cannot fail the request; no response contains Clerk user IDs or other users' emails beyond the collaborator emails themselves.
4. Data-layer check, run if it can be done without installing anything (`server-only` can throw outside Next unless the process runs with the `react-server` condition): against the dev database with a throwaway project, confirm that invite adds a lowercase row; the same email in another letter case is refused as a duplicate; the 21st collaborator is refused; removing with a collaborator ID that belongs to a different project deletes nothing; removing with the correct pair deletes the row. Also check the Clerk enrichment returns `null` for an email that matches no user. Remove every row and the script afterwards. If it cannot be run, say so and list these cases for the user.
5. A grep of the changed files finds no hex values, raw palette classes, `font-bold`, `rounded-lg` or larger, no `fetch` to Clerk from client code, and no `dark:` color variants.
6. `git status` shows no changes to the schema, migrations, `proxy.ts`, spec 06's routes, or `components/ui/*` except the new `avatar` file.
7. `context/architecture-context.md` records: collaborators are invited by email with no email sent; access requires a verified matching email; Clerk enrichment uses verified matches only; the 20-collaborator cap. `context/progress-tracker.md` is updated to the real state, including these notes: removed collaborators keep any open page until their next navigation; owner is not shown in the list; email matching is exact, so `name+tag@gmail.com` and `name@gmail.com` are different addresses; inviting reveals a registered person's display name and avatar to the inviter (a privacy consideration to review later); the Share button's earlier "inert" note is removed.

### What only the user can verify

This needs a signed-in session, which Opus does not have. Opus gives the user this checklist and does not claim it as verified. Check in both themes, at roughly 390px and 1366px:

- As owner: `Share` opens the dialog with the invite form. Inviting a made-up address (for example `someone@example.com`) adds a row showing the email only. Inviting the same address again shows `This person already has access.` Inviting your own email shows `That's your own email.` An invalid address shows the validation message. Removing a row removes it.
- If you have a second real Clerk account whose email you can use, invite it: its display name and avatar should appear. Make sure an unverified address on an account does not show a name.
- `Copy link` shows `Copied!` for about two seconds, and pasting the link in another tab opens the workspace.
- As collaborator (use the trick from spec 08: a project owned by a fake owner ID with a `ProjectCollaborator` row for your verified email, lowercase): `Share` opens the dialog with the list only, no invite form and no remove buttons. From the browser console, `POST` and `DELETE` on that project return `403`. For a project you have no access to, all three return `404`. Remove the test rows afterwards.
- Dialog behavior: Escape closes it, focus is trapped, the long list scrolls inside the dialog, and it works at the narrow width.

## Stop and ask if

- Specs 02 to 08 are incomplete, or their code differs from what this spec assumes.
- The Clerk docs for the installed version do not offer a server-side lookup of users by email address, or do not expose each email's verification status.
- Access cannot be decided with the spec 08 helper without changing it.
- The shadcn `avatar` cannot be added without editing existing `components/ui/*` files.
- You think a new package, a schema change, a new environment variable, a new token or an email service is needed.
- Anything here conflicts with `architecture-context.md`, `ui-context.md` or another spec.
- You are about to touch anything in the "Out of scope" list.
