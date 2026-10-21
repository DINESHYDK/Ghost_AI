# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature work (spec-driven, `context/feature-specs/`)

## Current Goal

- Feature 01 (design system) done. Next: feature 02 (editor), started when the user says go.

## Completed

- Next.js 16 app scaffolded and boilerplate stripped.
- Clerk installed via `clerk init`: `ClerkProvider` in `app/layout.tsx`, `proxy.ts`, sign-in / sign-up routes, keys in `.env.local`.
- Design system finalized as a spec in `context/ui-context.md` (dark + light tokens, Inter + JetBrains Mono, 3/4/6px radii, lime brand, sky blue AI, canvas pairs for both themes, anti-"AI slop" rules).
- Design tokens implemented in `app/globals.css` (Tailwind v4): light on `:root`, dark on `.dark`, `@theme inline` utility mapping, 3/4/6/60px radii, shadow scale reset to tokens, class-based `dark` variant, base border color and body styles. Production build passes.
- `app/layout.tsx`: Inter (400/500/600) and JetBrains Mono (400/500) via `next/font`, `dark` class on `<html>`, real metadata.
- `app/page.tsx`: placeholder home restyled with tokens only.
- shadcn/ui initialized (Radix, `radix-nova`): `components.json`, `components/ui/button.tsx`, `lib/utils.ts`. shadcn variables aliased to our tokens; radius scale pinned to 3/4/6px. Build and lint pass; both themes checked in the browser.
- **Feature 01 — Design system and UI primitives:** added Card, Dialog, Input, Tabs, Textarea, ScrollArea via the shadcn CLI (all import from `radix-ui`; no new dependencies). All seven primitives verified in dark and light: token colors only (no oklch / shadcn default palette), 1px token edges, lime focus ring on keyboard focus (buttons, inputs, tabs), every radius ≤ 6px, Dialog closes on Escape. Generated files are byte-identical to the registry (unedited). `tsc`, build and lint pass.
- **Token fix (found in feature 01):** `--color-base` made Tailwind compile `text-base` to `color: var(--bg-base)`, so shadcn's Card title, Dialog title, Input and Textarea text were invisible. Renamed the mapping to `--color-page` (utility `bg-page`); no token values changed. Rule added to `ui-context.md`: never name a color token after a Tailwind size key.

## In Progress

- None.

## Next Up

- Feature specs in order: 02 editor, 03 auth, 04 project dialogs (each started on the user's go).
- Later specs (from the plan): Prisma + Postgres, projects, canvas, templates, AI generation, spec generation.
- Later, after the core flow works: Dark / Light theme toggle persisted in a cookie.

## Open Questions

- **Accent CTA (from feature 01, decide in a later unit):** the lime accent button (`bg-brand text-on-accent`, one main call to action per screen) is not a shadcn variant, and `button.tsx` stays unedited. Build it as a `className` override at the call site, or as an app-level wrapper component?
- **Light floating panels:** `--bg-elevated` (`#f5f4f2`) is close to `--bg-base` (`#ececec`). Contrast vs base: elevated ≈1.08:1, white ≈1.18:1, border `#d9d9d9` ≈1.2:1. Feature 01 finding: in light, the Dialog edge is visible but faint, because shadcn draws Card and Dialog edges as a 1px `ring-foreground/10` instead of the `--border` token; Card (white on `bg-page`) separates clearly. Sidebar separation is checked in feature 02.
- **Generated Dialog vs `ui-context.md` modal spec (for feature 02's dialog shell):** the shadcn Dialog uses `bg-popover` (`--bg-elevated`) instead of `bg-surface`, has no `shadow-lg`, and its overlay is `bg-black/10` with a 4px blur (a light dim). Feature 02 says to close these gaps with `className` on the shell.

- **Blob access control (must be settled in the storage feature's spec):** Vercel Blob needs a token (`BLOB_READ_WRITE_TOKEN`) and a decision on who can read stored files. Canvases and specs are private user data, and only the owner or a collaborator may access them (`architecture-context.md`). The spec must define how the app stops someone who obtains a blob URL from reading another user's design. Check Vercel's current docs for Blob access options when writing that spec; do not rely on remembered defaults.

## Architecture Decisions

- `context/ui-context.md` is the single source of truth for design tokens.
- Node colors are stored as one of 8 enum names, resolved to a theme pair at render time. AI output is constrained to the enum; unknown names fall back to `neutral` (see `architecture-context.md`).
- Inter weights are 400 / 500 / 600 only.
- shadcn variables are mapped to our tokens in `globals.css`; shadcn `--accent` is a hover surface, never lime. `--ring` is lime (deliberate deviation from the reference site).
- Theme: Dark / Light only, dark default, choice persisted in a cookie.
- shadcn/ui uses the Radix base with the `radix-nova` style.
- Canvas snapshots and generated specs live in Vercel Blob (`canvas/{projectId}.json`, `specs/{projectId}/{specId}.md`); Prisma stores only the blob URL. All "filesystem" wording removed from the context files.

## Session Notes

- Clerk auth config has Google OAuth and email enabled (dev instance, app "Freelancing Projects").
