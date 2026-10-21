# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature work (spec-driven, `context/feature-specs/`)

## Current Goal

- Features 01–03 done (03's signed-in flows await the user's manual check). Next: feature 04 (project dialogs), started when the user says go.

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

## In Progress

- None.

## Next Up

- Feature specs in order: 04 project dialogs, 05 Prisma, 06 project APIs, 07 wire editor home, 08 editor workspace shell (each started on the user's go).
- Later specs (from the plan): Prisma + Postgres, projects, canvas, templates, AI generation, spec generation.
- Later, after the core flow works: Dark / Light theme toggle persisted in a cookie.

## Open Questions

- **Accent CTA (from feature 01, decide in a later unit):** the lime accent button (`bg-brand text-on-accent`, one main call to action per screen) is not a shadcn variant, and `button.tsx` stays unedited. Build it as a `className` override at the call site, or as an app-level wrapper component?
- **Light floating panels:** `--bg-elevated` (`#f5f4f2`) is close to `--bg-base` (`#ececec`). Contrast vs base: elevated ≈1.08:1, white ≈1.18:1, border `#d9d9d9` ≈1.2:1. Feature 01 finding: in light, the Dialog edge is visible but faint, because shadcn draws Card and Dialog edges as a 1px `ring-foreground/10` instead of the `--border` token; Card (white on `bg-page`) separates clearly. Feature 02 finding: the light sidebar's fill is close to the page, but its 1px `--border` border plus `shadow-md` separate it clearly; no switch to `--bg-surface` needed so far. Dark separates on fill alone.
- **Dialog backdrop strength:** `EditorDialog` closes the surface, border, radius and shadow gaps. The remaining gap is the backdrop: the generated `DialogContent` renders its own overlay (`bg-black/10` + 4px blur), so its dim cannot be changed from the shell without editing `components/ui/dialog.tsx` or bypassing `DialogContent`. It is dimmed, but lightly. Decide whether that is acceptable.
- **Sidebar focus return:** when the sidebar closes via Escape, focus sits inside the now-inert sidebar and falls back to `<body>`. `EditorShell` (feature 03) now owns the state, but spec 03 allowed no extras; returning focus to the navbar toggle needs a spec.
- **Feature 03, user-only checks (not verified by Claude, needs a real account):** sign up / sign in with Google and with email; landing on `/editor` after sign-in; the `/editor` page itself (navbar, toggle, empty main) and `UserButton` rendering; `UserButton` menu and profile settings opening; sign-out returning to `/sign-in`.
- **Clerk UI comes from Clerk's CDN, not the installed `@clerk/ui`:** `ClerkProvider` is not given the local `ui` export, so the CDN build ignored the theme's `cssLayerName` and its styles were unlayered (they beat Tailwind; light inputs rendered solid `--input` gray). Fixed by also setting `appearance.cssLayerName` from the theme. Bundling the local UI (`ui` prop) would pin the version to the installed theme; decide in a later unit if wanted.
- **Clerk card title shows "GHOST_AI":** that is the application name in the Clerk Dashboard (dashboard setting, not code). The orange "Development mode" label is Clerk's dev-instance badge and disappears in production.

- **Blob access control (must be settled in the storage feature's spec):** Vercel Blob needs a token (`BLOB_READ_WRITE_TOKEN`) and a decision on who can read stored files. Canvases and specs are private user data, and only the owner or a collaborator may access them (`architecture-context.md`). The spec must define how the app stops someone who obtains a blob URL from reading another user's design. Check Vercel's current docs for Blob access options when writing that spec; do not rely on remembered defaults.

## Architecture Decisions

- `context/ui-context.md` is the single source of truth for design tokens.
- Node colors are stored as one of 8 enum names, resolved to a theme pair at render time. AI output is constrained to the enum; unknown names fall back to `neutral` (see `architecture-context.md`).
- Inter weights are 400 / 500 / 600 only.
- shadcn variables are mapped to our tokens in `globals.css`; shadcn `--accent` is a hover surface, never lime. `--ring` is lime (deliberate deviation from the reference site).
- Theme: Dark / Light only, dark default, choice persisted in a cookie.
- shadcn/ui uses the Radix base with the `radix-nova` style.
- Auth gate: `proxy.ts` is default-deny (only the sign-in/sign-up env paths and their subpaths are public). Signed-out page requests redirect to sign-in; signed-out `/api` requests get `401 {"error":"Unauthorized"}` (explicit, instead of Clerk's default 404 for non-document requests). Every page, route handler and server function also checks auth itself (`auth.protect()` / `auth()`).
- Clerk styling: `@clerk/ui` `shadcn` theme reads the shadcn variables, so Clerk follows our tokens in both themes; `appearance.variables` only sets fonts and a radius base of half `--radius` (Clerk's largest radius is 2× the base, so it caps at 6px).
- Canvas snapshots and generated specs live in Vercel Blob (`canvas/{projectId}.json`, `specs/{projectId}/{specId}.md`); Prisma stores only the blob URL. All "filesystem" wording removed from the context files.

## Session Notes

- Clerk auth config has Google OAuth and email enabled (dev instance, app "Freelancing Projects").
- `next dev` appends a generated "nextjs-agent-rules" block to `CLAUDE.md` (read Next 16 docs in `node_modules/next/dist/docs/` before writing Next-specific code). It is re-added on every `next dev` run.
