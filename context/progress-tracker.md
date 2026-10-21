# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation complete; feature work next

## Current Goal

- Start feature work at the auth shell (route protection, Clerk styling, navbar).

## Completed

- Next.js 16 app scaffolded and boilerplate stripped.
- Clerk installed via `clerk init`: `ClerkProvider` in `app/layout.tsx`, `proxy.ts`, sign-in / sign-up routes, keys in `.env.local`.
- Design system finalized as a spec in `context/ui-context.md` (dark + light tokens, Inter + JetBrains Mono, 3/4/6px radii, lime brand, sky blue AI, canvas pairs for both themes, anti-"AI slop" rules).
- Design tokens implemented in `app/globals.css` (Tailwind v4): light on `:root`, dark on `.dark`, `@theme inline` utility mapping, 3/4/6/60px radii, shadow scale reset to tokens, class-based `dark` variant, base border color and body styles. Production build passes.
- `app/layout.tsx`: Inter (400/500/600) and JetBrains Mono (400/500) via `next/font`, `dark` class on `<html>`, real metadata.
- `app/page.tsx`: placeholder home restyled with tokens only.
- shadcn/ui initialized (Radix, `radix-nova`): `components.json`, `components/ui/button.tsx`, `lib/utils.ts`. shadcn variables aliased to our tokens; radius scale pinned to 3/4/6px. Build and lint pass; both themes checked in the browser.

## In Progress

- None.

## Next Up

- Auth shell: protect routes in `proxy.ts`, style Clerk sign-in / sign-up / modals with tokens, navbar with `UserButton`.
- Then: Prisma + Postgres, projects, workspace shell, canvas, templates, AI generation, spec generation.
- Later, after the core flow works: Dark / Light theme toggle persisted in a cookie.

## Open Questions

- **Light floating panels:** `--bg-elevated` (`#f5f4f2`) is close to `--bg-base` (`#ececec`). No floating panels exist yet; decide during the workspace-shell step. Contrast vs base: elevated ≈1.08:1, white ≈1.18:1, border `#d9d9d9` ≈1.2:1.

## Architecture Decisions

- `context/ui-context.md` is the single source of truth for design tokens.
- Node colors are stored as one of 8 enum names, resolved to a theme pair at render time. AI output is constrained to the enum; unknown names fall back to `neutral` (see `architecture-context.md`).
- Inter weights are 400 / 500 / 600 only.
- shadcn variables are mapped to our tokens in `globals.css`; shadcn `--accent` is a hover surface, never lime. `--ring` is lime (deliberate deviation from the reference site).
- Theme: Dark / Light only, dark default, choice persisted in a cookie.
- shadcn/ui uses the Radix base with the `radix-nova` style.

## Session Notes

- Clerk auth config has Google OAuth and email enabled (dev instance, app "Freelancing Projects").
