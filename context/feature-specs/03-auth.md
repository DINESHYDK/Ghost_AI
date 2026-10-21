Read `CLAUDE.md` before starting. Then read `context/ui-context.md` in full, `context/architecture-context.md` ("Auth and Collaboration Model" and "Invariants"), and `context/code-standards.md` ("API Routes" and "Next.js").

# Feature 03: Authentication (Clerk)

## Goal

Wire Clerk into the app: themed provider, branded sign-in and sign-up pages, a default-deny route gate, the `/` redirect, a minimal protected `/editor`, and the user menu in the editor navbar. Every Clerk surface uses Ghost AI's own design tokens, in both themes.

## Dependencies

- Feature 01 (design system) and feature 02 (editor chrome) must be complete first. This unit needs `components/editor/editor-navbar.tsx` and the shadcn components from 01. If they are missing, stop and ask.
- `@clerk/nextjs` 7.x (Core 3) is already installed and connected. Do not re-run `clerk init` and do not create a new Clerk application.
- Install `@clerk/ui`. It exports `./themes` (including `shadcn`) and `./themes/shadcn.css`. Confirm both after installing.

## Current state (do not redo)

- `app/layout.tsx` already wraps the app in `ClerkProvider` (inside `<body>`).
- `proxy.ts` exists at the project root but is a bare `clerkMiddleware()`, so **nothing is protected yet**.
- `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` exist as bare Clerk components with no styling.
- `.env.local` already holds the Clerk variables (gitignored): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`.
- `app/page.tsx` currently renders a hero with Sign in / Get started buttons. This unit replaces it with a pure redirect.
- There is no `/editor` route yet.

## Design: use our tokens, not Clerk's palette

The earlier plan used Clerk's `dark` theme as the base. Do not do that. It ships its own fixed dark palette, so it would ignore our tokens and break the light theme.

Instead use Clerk's **`shadcn` theme**:

- `import { shadcn } from "@clerk/ui/themes"` and pass `appearance={{ theme: shadcn }}` to `ClerkProvider`.
- Add one line to `app/globals.css`: `@import "@clerk/ui/themes/shadcn.css";`, placed with the other imports at the top. This is the only edit to `globals.css` in this unit. Do not change any token.
- Why this works: the shadcn theme reads shadcn's variables (`--background`, `--primary`, `--border`, `--ring`, `--radius`, and so on). Those already point at our tokens in `globals.css`, so Clerk follows our colors in dark and light automatically.
- Use `appearance.variables` only for gaps the theme does not cover (for example font family from `--font-inter`, border radius from our scale). Reference CSS variables, for example `var(--font-inter)`. Never write a hex value, an `rgb()` or a named color. Confirm in the Clerk docs that a given variable accepts a CSS variable before relying on it.
- The shadcn variable mapping in `ui-context.md` is the contract. If Clerk needs a color that has no mapped variable, stop and ask. Do not invent a token.
- Clerk components must show boxy radii (6px or less) and the lime focus ring. No purple, gradients or glow.

## Sign-in and sign-up pages

Shared layout component: `components/auth/auth-shell.tsx` (a server component). Both pages render their Clerk component inside it so the two pages cannot drift apart.

Large screens (two panels, side by side, full viewport height):

- Left panel, `bg-surface` with a 1px right border (`border-surface-border`):
  - A compact wordmark: the text "Ghost AI" in weight 600, no image and no icon tile.
  - A one-line tagline, for example: "Describe a system. Refine it together."
  - A short, text-only feature list (3 items, no icons, no cards, no bullets styled as tiles), for example: "AI-generated architecture from a prompt", "Real-time collaboration on a shared canvas", "Technical spec generated from your design".
  - Mono label pattern is allowed for a small eyebrow (`font-mono`, 12px, uppercase, widest tracking). Text colors come from `text-copy-*`.
- Right panel, `bg-page`: the Clerk form, centered vertically and horizontally.

Small screens: the form only. The left panel is hidden.

Rules: no gradients, no glow, no oversized hero text, no feature cards, no illustrations, no scrolling on a normal laptop viewport. The copy above is a suggestion and can be edited by the user.

Pages:

- Sign-in: Clerk `<SignIn />` at `app/sign-in/[[...sign-in]]/page.tsx`.
- Sign-up: Clerk `<SignUp />` at `app/sign-up/[[...sign-up]]/page.tsx`.
- Keep the catch-all route folders (they are needed for Clerk's multi-step flows). Do not set `path` or `routing` props that duplicate what the env vars already provide, unless the installed version requires them.

## Route protection (`proxy.ts`)

`proxy.ts` stays at the project root. Do not create `middleware.ts`. Keep the existing `config.matcher` unless the Clerk docs for the installed version say otherwise.

Required behavior: **default deny**. Every route is protected except the public auth routes.

- Public routes: the paths from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, including everything beneath them (Clerk's multi-step and OAuth callback paths live under those prefixes). Read the paths from the env vars. Do not hardcode `/sign-in` and `/sign-up` as new strings.
- Everything else, including `/`, `/editor` and any `/api` route, requires a signed-in user.
- `createRouteMatcher` is deprecated in `@clerk/nextjs` 7. Do not use it. Use a plain path check on the request pathname inside `clerkMiddleware`, and call `auth.protect()` for non-public requests. Confirm the current API in the Clerk docs for the installed version before writing it. Do not rely on remembered signatures.
- Defense in depth: the proxy is not the only gate. `/editor` must also verify auth on the server (`await auth.protect()` or the equivalent documented for the installed version), as `architecture-context.md` requires auth at every boundary. Any route handler or server action added later must do the same.
- Unauthenticated page requests redirect to sign-in. Unauthenticated `/api` requests must not return page content (a 401-type response, per Clerk's documented behavior for the installed version).

## `/` redirect

Replace `app/page.tsx` with a server component that checks auth and redirects:

- Signed in: redirect to `/editor`.
- Signed out: redirect to `/sign-in`.

No UI is rendered on `/`. Remove the old hero and the buttons. Because the sign-in and sign-up fallback redirect URLs are both `/`, a user who finishes signing in lands on `/` and is forwarded to `/editor`. Do not change those env values.

## `/editor` (minimal protected route)

The redirect needs somewhere to land, so this unit adds the smallest possible editor page. This is a deliberate scope addition to what 02 deferred.

- `app/editor/page.tsx`: a server component. It verifies auth on the server and renders the shell below.
- `components/editor/editor-shell.tsx`: a client component that owns `isSidebarOpen` state (default closed) and renders `EditorNavbar`, `ProjectSidebar`, and an empty `<main>` area on `bg-page` for the future canvas. No data, no placeholders beyond what 02 already renders.
- Nothing else goes on this page. No canvas, no project loading, no extra routes.

## User menu

Add Clerk's built-in `UserButton` to the **right section** of `EditorNavbar`.

- Keep Clerk's default menu, profile and sign-out flows intact. Do not build a custom menu or override Clerk internals.
- After sign-out the user should end up on `/sign-in`. Use the documented `afterSignOutUrl` prop (or the documented provider-level equivalent) if the installed version supports it. Do not add a new env var for it.
- The center section stays empty. This is the only change to `editor-navbar.tsx`.

## Hard rules

- Tokens only. No hex, no `rgb()`, no named colors, no raw palette classes (`zinc-*`, `gray-*`, `purple-*`) in any file we write, including Clerk `appearance` objects. No `dark:` variants for colors.
- Radii and weights follow the scale in `ui-context.md` (3 / 4 / 6px, weights 400 / 500 / 600).
- Use the existing env vars only. Do not rename or add Clerk variables. Do not edit `.env.local` unless the user asks.
- Never print, log or commit secret values (`CLERK_SECRET_KEY` and the publishable key). When you read `.env.local`, read only the `NEXT_PUBLIC_CLERK_*_URL` lines.
- `CLERK_SECRET_KEY` and anything server-only must never be imported into a client component.
- Do not modify `components/ui/*`, `components.json` or any token in `globals.css`.
- Add `"use client"` only where hooks or browser APIs are needed. Report which files got it.
- Do not run `clerk init`, `clerk link`, or any command that changes the Clerk application or its keys.
- Do not commit or push.

## Verify before writing

1. Read the installed `@clerk/nextjs` version and use the Clerk docs for that exact generation (Core 3). The old `SignedIn` and `SignedOut` components are gone: use `<Show>` if conditional rendering is needed.
2. After installing `@clerk/ui`, confirm that `@clerk/ui/themes` exports `shadcn` and that `@clerk/ui/themes/shadcn.css` resolves.
3. Confirm how `clerkMiddleware`, `auth.protect()`, `auth()` and `afterSignOutUrl` work in the installed version before using them.
4. Read `ui-context.md`'s shadcn mapping table so the Clerk theme resolves to the right tokens.

## Done when

All of these are true. Report the evidence for each:

1. `@clerk/ui` is installed, and `package.json` and the lockfile show only that dependency change.
2. `proxy.ts` is at the project root, `middleware.ts` does not exist, and the code does not use `createRouteMatcher`.
3. With no session (for example `curl -I` against the dev server): `/`, `/editor` and a nonexistent path redirect to `/sign-in`, while `/sign-in` and `/sign-up` return 200. An unauthenticated request to any `/api` path does not return page content.
4. `ClerkProvider` wraps the root layout with `appearance={{ theme: shadcn }}`, and the `@import "@clerk/ui/themes/shadcn.css"` line is in `globals.css` with no other change to that file.
5. A grep for hex values, `rgb(`, and raw palette classes in the new and changed files finds nothing.
6. The sign-in and sign-up pages render the two-panel layout on a wide viewport and form-only on a narrow one, in both themes (toggle the `dark` class on `<html>`). Clerk's inputs, buttons and links use token colors, boxy radii and the lime focus ring. Report what you actually saw, and say so plainly if you could not view it in a browser.
7. `app/page.tsx` renders nothing and only redirects. `/editor` exists, verifies auth on the server, and shows the navbar, the sidebar toggle and an empty main area.
8. `UserButton` appears in the navbar's right section.
9. `npx tsc --noEmit`, `npm run build` and `npm run lint` (errors in our own files) pass.
10. `context/progress-tracker.md` is updated to the real state, with anything the signed-in flow could not verify listed under open questions.

### What only the user can verify

Opus cannot sign in with a real account. After the above passes, the user manually checks, in a browser: sign up or sign in with Google and with email, landing on `/editor` after sign-in, the `UserButton` menu opening, profile settings opening, and sign-out returning to `/sign-in`. Opus should list these as a checklist for the user and not claim them as verified.

## Stop and ask if

- Feature 01 or 02 is incomplete, or `editor-navbar.tsx` has changed shape.
- `@clerk/ui` does not export the `shadcn` theme or the CSS file.
- The shadcn theme cannot produce a result that matches our tokens without hardcoding colors.
- Clerk needs a color or a variable that has no mapped token.
- The Clerk docs for the installed version contradict anything in this spec (route protection, `afterSignOutUrl`, `appearance` shape).
- Default-deny in `proxy.ts` cannot be done without `createRouteMatcher`, or it blocks the sign-in flow.
- You think an env var, a new route besides `/editor`, or a change to the `.env.local` values is needed.
- You are about to touch anything outside this spec.
