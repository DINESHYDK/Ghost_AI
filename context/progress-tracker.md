# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature work (spec-driven, `context/feature-specs/`)

## Current Goal

- Features 01–04 done and verified; the out-of-sequence design alignment unit is done (its signed-in checks await the user). Feature 05 (Prisma) is set up with its migration still pending; it resumes when the user says go.

## Completed

- Next.js 16 app scaffolded and boilerplate stripped.
- Clerk installed via `clerk init`: `ClerkProvider` in `app/layout.tsx`, `proxy.ts`, sign-in / sign-up routes, keys in `.env.local`.
- Design system finalized as a spec in `context/ui-context.md` (dark + light tokens, Inter + JetBrains Mono, 3/4/6px radii, lime brand, sky blue AI, canvas pairs for both themes, anti-"AI slop" rules).
- Design tokens implemented in `app/globals.css` (Tailwind v4): light on `:root`, dark on `.dark`, `@theme inline` utility mapping, 3/4/6/60px radii, shadow scale reset to tokens, class-based `dark` variant, base border color and body styles. Production build passes.
- `app/layout.tsx`: Inter (400/500/600) and JetBrains Mono (400/500) via `next/font`, `dark` class on `<html>`, real metadata.
- shadcn/ui initialized (Radix, `radix-nova`): `components.json`, `components/ui/button.tsx`, `lib/utils.ts`. shadcn variables aliased to our tokens; radius scale pinned to 3/4/6px. Build and lint pass; both themes checked in the browser.
- **Feature 01 — Design system and UI primitives:** added Card, Dialog, Input, Tabs, Textarea, ScrollArea via the shadcn CLI (all import from `radix-ui`; no new dependencies). All seven primitives verified in dark and light: token colors only (no oklch / shadcn default palette), 1px token edges, lime focus ring on keyboard focus (buttons, inputs, tabs), every radius ≤ 6px, Dialog closes on Escape. Generated files are byte-identical to the registry (unedited). `tsc`, build and lint pass.
- **Token fix (found in feature 01):** `--color-base` made Tailwind compile `text-base` to `color: var(--bg-base)`, so shadcn's Card title, Dialog title, Input and Textarea text were invisible. Renamed the mapping to `--color-page` (utility `bg-page`); no token values changed. Rule added to `ui-context.md`: never name a color token after a Tailwind size key.
- **Feature 02 — Editor chrome:** `components/editor/editor-navbar.tsx` (sticky `h-12` header, `bg-nav` + blur, 1px bottom border, left/center/right slots, ghost icon toggle swapping `PanelLeftOpen`/`PanelLeftClose` with `aria-expanded`/`aria-controls`), `components/editor/project-sidebar.tsx` (fixed floating `<aside>`, `w-80`, 8px gap from navbar/left/bottom, `bg-elevated` + 1px border + `shadow-md`, 200ms `translate` slide, `inert` + `invisible` when closed, Escape and close button call `onClose`, Tabs "My Projects"/"Shared" with bare-icon empty states in a `ScrollArea`, full-width `New Project` footer button), `components/editor/editor-dialog.tsx` (controlled shell over the shadcn Dialog; `bg-surface`, 1px border, `rounded-md`, `shadow-lg` via `className`; title at weight 600 per `ui-context.md`; footer only when passed; `aria-describedby={undefined}` when there is no description). No file needed `"use client"` (all controlled, no hooks); they must be rendered from a client parent. Navbar and sidebar share `z-40` (one value below the Dialog's `z-50`). Verified in both themes with a scratch page (since deleted): zero layout shift, focus never enters the closed sidebar, tabs switch, dialog closes on Escape and overlay click, no Radix warning without a description. `tsc`, build and lint pass.
- **Feature 03 — Authentication (Clerk):** installed `@clerk/ui` 1.41.0 (lockfile also bumps the transitive `@clerk/shared` 4.40.0 → 4.41.0, which `@clerk/ui` requires). `ClerkProvider` uses `appearance={{ theme: shadcn, cssLayerName: shadcn.cssLayerName, variables: { fontFamily, fontFamilyMono, borderRadius: calc(var(--radius) / 2) } }}` and `afterSignOutUrl` from `NEXT_PUBLIC_CLERK_SIGN_IN_URL`; `globals.css` gained only `@import "@clerk/ui/themes/shadcn.css"`. `proxy.ts` is default-deny with a plain prefix check on the sign-in/sign-up env paths (no `createRouteMatcher`): pages go through `auth.protect()` (redirect to sign-in), `/api` returns `401 {"error":"Unauthorized"}`. `/` is a pure server redirect (`auth.protect()` then `/editor`); `app/editor/page.tsx` verifies auth server-side and renders `components/editor/editor-shell.tsx` (client, owns `isSidebarOpen`); `UserButton` in the navbar's right section. `components/auth/auth-shell.tsx` gives sign-in/sign-up a two-panel layout (form only below `lg`). Verified signed-out in headless Chrome and curl: `/`, `/editor`, unknown paths → `/sign-in?redirect_url=…`; `/sign-in`, `/sign-up` → 200; `/api/*` → 401 JSON. Clerk forms in both themes and widths: token colors, Inter, weights ≤ 600, every radius ≤ 6px, lime focus ring on inputs and buttons, no page scroll at 1366×768 or 390×844. `tsc`, build and lint pass.
- **Design alignment unit (out of sequence, no spec file):** `components/ui/*` may now be edited to align with `ui-context.md` (policy in `ai-workflow-rules.md`, edits listed in `ui-context.md`). Added the `accent` Button variant (`bg-brand text-on-accent hover:bg-brand/80`, the only change to `button.tsx`) and used it on the `/editor` home `New Project` only. Clerk alignment: audited sign-in/sign-up signed out in both themes at 1366px and 390px; mismatches were Clerk's own card/divider/input edge colors (neutral alpha instead of tokens), drop shadows on the card and buttons, 3px button/input radii, and 62% social-button text. Fixed with `appearance.elements` token classes in `lib/clerk-appearance.ts` (mirroring our `Button`/`Input`) plus `authCardAppearance` (no shadow) on the two auth pages, and bundled Clerk's UI from the installed `@clerk/ui` (`ClerkProvider ui={ui}`) because the CDN served a floating `@clerk/ui@1` (1.41.1) ahead of our installed theme (1.41.0). Now: card border `--border-default`, no card/button shadows, divider `--border-default`, social button 1px `--border-strong` + `--text-primary`, inputs 4px with `--border-strong` and the lime focus ring, buttons 6px, error border/ring/text `--state-error`. `tsc`, build and lint pass.
- **User-verified (signed in):** feature 03 (Google and email sign-in/up, landing on `/editor`, `UserButton` menu and profile, sign-out to `/sign-in`) and feature 04 (full checklist, both themes, ~390px and ~1366px) — all passed.
- **Feature 04 — Editor home, project dialogs, sidebar actions (mock data):** `types/project.ts` (`ProjectListItem`), `lib/mock-projects.ts` (temporary: 6 initial items, local id helper, and `simulateRequest()` — the single ~400 ms placeholder for the future API call), `hooks/use-project-dialogs.ts` (client hook: which dialog, target, name, touched, loading; `validateProjectName` + `PROJECT_NAME_MAX_LENGTH` are the one place for name rules; receives `onCreate/onRename/onDelete`, owns no list, calls no API; ignores dismissal while loading), `components/editor/project-dialogs.tsx` (Create / Rename on a real `<form>` with the footer button linked by `form`, native `<label>`, inline "Name is required" after touch; Delete with no input and the destructive variant), `components/editor/editor-home.tsx` (centered heading/description/New Project, no card). `EditorShell` owns the in-memory list and the handlers; `ProjectSidebar` lists owned/shared projects (owned rows: always-visible Rename/Delete ghost icon buttons; shared rows: no actions), footer button opens Create, and renders a `bg-scrim` below `md`. New token `--scrim` (+ `bg-scrim`). Verified on a temporary public scratch page mounting `EditorShell` (deleted): validation and disabled states, Enter submits, loading labels with controls disabled and Escape blocked, dismiss resets the form, overlay closes, Rename prefilled with text selected, Delete focus starts on Cancel, focus trapped in dialogs, sidebar stays open behind dialogs, long names truncate, shared rows have no buttons, scrim only below `md` and closes the sidebar, reload restores the six items, no console warnings. Found and fixed: Radix ScrollArea's `display: table` wrapper stopped truncation and pushed row actions out of view. `tsc`, build and lint pass.

## In Progress

- **Feature 05 — Prisma (set up, migration pending):** dependencies installed (Prisma 7.10.1 aligned), `prisma.config.ts`, multi-file schema (`prisma/schema.prisma`, `prisma/models/project.prisma`), `lib/prisma.ts`, `postinstall`, `.gitignore` done; `prisma validate`, `tsc`, lint and build pass. Neon `dev` branch created from `production` in project `silent-bonus-54591382` ("Ghost_AI"; branch `br-lucky-voice-b4jaenv4`, created without printing credentials). The user reports `DATABASE_URL` in `.env.local` now holds the `dev` branch's direct string (not yet re-checked). Remaining: the boolean URL checks, the `init_projects` migration, the cascade/unique smoke test and the rest of 05's done-when list.

## Next Up

- Unfinished specs in order: 05 Prisma (migration step), 06 project APIs, 07 wire editor home, 08 editor workspace shell, 09 share dialog, 10 Liveblocks setup (each started on the user's go).
- Later specs (from the plan): canvas, templates, AI generation, spec generation.
- Later, after the core flow works: Dark / Light theme toggle persisted in a cookie.

## Open Questions

- **Before production (free tiers only):** the "Secured by Clerk" badge stays (we stay on Clerk Hobby; removing it needs a paid plan, which is ruled out). A production Clerk instance on our own domain with `pk_live_`/`sk_live_` keys and our own Google OAuth credentials is still needed before launch (Clerk's shared dev credentials are not used in production). The "Development mode" label belongs to the development instance. Liveblocks free-tier limits have not been checked yet.
- **Clerk card title shows "GHOST_AI":** that is the application name in the Clerk Dashboard (dashboard setting, not code). The orange "Development mode" label is Clerk's dev-instance badge and disappears in production.

- **Blob access control (must be settled in the storage feature's spec):** Vercel Blob needs a token (`BLOB_READ_WRITE_TOKEN`) and a decision on who can read stored files. Canvases and specs are private user data, and only the owner or a collaborator may access them (`architecture-context.md`). The spec must define how the app stops someone who obtains a blob URL from reading another user's design. Check Vercel's current docs for Blob access options when writing that spec; do not rely on remembered defaults.

## Micro-improvements (later)

Accepted for now (user decision); not to be fixed until a unit asks for them.

- **Light-theme panel contrast:** `--bg-elevated` (`#f5f4f2`) is close to `--bg-base` (`#ececec`) (about 1.08:1); floating panels rely on their 1px border (plus `shadow-md`) to separate.
- **Sidebar focus return:** closing the sidebar with Escape leaves focus on `<body>` instead of returning it to the navbar toggle.
- **Faint Card/Dialog edge:** shadcn draws Card and Dialog edges as a 1px `ring-foreground/10` instead of the `--border` token (faint in light).
- **shadcn Input radius:** the generated `Input` and `Textarea` use `rounded-lg` (pinned to 6px), while `ui-context.md` says inputs are 4px; Clerk inputs now follow `ui-context.md` (4px), so the two differ by 2px.
- **Clerk control sizes:** Clerk text is 13px (its `fontSize` default) versus our 14px `text-sm`, and the Clerk social button and inputs are 34px tall (the 1px border adds height) versus our 32px controls.
- **Accent focus ring:** on the lime `accent` button the lime focus ring is lime on lime, so it reads less clearly than on other buttons.
- **Clerk CDN entry file:** with the bundled UI, `clerk-js` (still loaded from Clerk's CDN by the SDK) also fetches `@clerk/ui@1/dist/ui.browser.js`, though no CDN component chunks load and rendering comes from the bundle.

## Architecture Decisions

- `context/ui-context.md` is the single source of truth for design tokens.
- Node colors are stored as one of 8 enum names, resolved to a theme pair at render time. AI output is constrained to the enum; unknown names fall back to `neutral` (see `architecture-context.md`).
- Inter weights are 400 / 500 / 600 only.
- shadcn variables are mapped to our tokens in `globals.css`; shadcn `--accent` is a hover surface, never lime. `--ring` is lime (deliberate deviation from the reference site).
- Theme: Dark / Light only, dark default, choice persisted in a cookie.
- shadcn/ui uses the Radix base with the `radix-nova` style.
- Auth gate: `proxy.ts` is default-deny (only the sign-in/sign-up env paths and their subpaths are public). Signed-out page requests redirect to sign-in; signed-out `/api` requests get `401 {"error":"Unauthorized"}` (explicit, instead of Clerk's default 404 for non-document requests). Every page, route handler and server function also checks auth itself (`auth.protect()` / `auth()`).
- Clerk styling: `@clerk/ui` `shadcn` theme reads the shadcn variables, so Clerk follows our tokens in both themes; `appearance.variables` only sets fonts and a radius base of half `--radius` (Clerk's largest radius is 2x the base, so it caps at 6px); `appearance.elements` uses token classes mirroring our `Button`/`Input` (`lib/clerk-appearance.ts`). Clerk's UI is bundled from the installed `@clerk/ui` (`ClerkProvider ui={ui}`) so its version follows the lockfile, not the CDN.
- Design alignment decisions (user, out-of-sequence unit):
  1. Generated `components/ui/*` files may be edited to match `ui-context.md` (replaces "Protected Foundation Components"; minimal, token/className only, no behavior or a11y changes, every edit listed in `ui-context.md`; a spec's own "do not modify `components/ui/*`" still binds that spec).
  2. The generated Dialog backdrop (`bg-black/10` + 4px blur) is accepted as is.
  3. Clerk's UI must match our design style (done; see Clerk styling above).
  4. Light-theme panel contrast, sidebar focus return, the faint Card/Dialog edge ring and similar polish are micro-improvements for later (see that section).
  5. Free tiers only (Clerk Hobby, Neon, Liveblocks, Vercel free); nothing that needs a paid plan.
- Accent CTA resolved: a lime `accent` variant in `components/ui/button.tsx`, used for the single main call to action per screen (currently the `/editor` home `New Project`).
- Canvas snapshots and generated specs live in Vercel Blob (`canvas/{projectId}.json`, `specs/{projectId}/{specId}.md`); Prisma stores only the blob URL. All "filesystem" wording removed from the context files.

## Session Notes

- Clerk auth config has Google OAuth and email enabled (dev instance, app "Freelancing Projects").
- `next dev` appends a generated "nextjs-agent-rules" block to `CLAUDE.md` (read Next 16 docs in `node_modules/next/dist/docs/` before writing Next-specific code). It is re-added on every `next dev` run.
