Read `CLAUDE.md` before starting. Then read `context/ui-context.md` in full, especially "Layout Patterns", "Component Library", "Icons", "Border Radius" and "Anti-AI slop Rules". This unit follows them exactly.

# Feature 02: Editor Chrome (Navbar, Project Sidebar, Dialog Shell)

## Goal

Build the three reusable pieces of chrome that frame every editor screen: a top navbar, a floating left project sidebar, and a dialog shell for future dialogs. Components only. No route, no data, no behavior beyond opening, closing and tab switching.

## Dependency

Feature 01 (`01-design-sytem.md`) must be complete first. This unit needs `Button`, `Tabs`, `Dialog` and `ScrollArea` from `components/ui/`. Check that those files exist. If any is missing, stop and ask. Do not install shadcn components in this unit.

## Scope

In scope:

1. `components/editor/editor-navbar.tsx`
2. `components/editor/project-sidebar.tsx`
3. `components/editor/editor-dialog.tsx` (the dialog shell)
4. A temporary scratch page to verify them (deleted before done)
5. Updating `context/progress-tracker.md`

Out of scope (do not start these):

- An editor route, page or layout (for example `app/editor/*`). The state-owning parent is built in a later unit.
- Any real project data: no Prisma, Clerk, Liveblocks, API calls or fetching. The sidebar shows placeholders only.
- A working "New Project" action or any concrete dialog (new, rename, delete, invite).
- Anything in the navbar's center or right sections.
- The canvas, the AI panel, the theme toggle.
- Editing any file in `components/ui/*`.

## Verify before writing

1. Confirm `button.tsx`, `tabs.tsx`, `dialog.tsx` and `scroll-area.tsx` exist in `components/ui/`, and read their exported names and props. Use what is really exported, not remembered APIs.
2. Confirm the lucide icons `PanelLeftOpen`, `PanelLeftClose`, `Plus`, `X`, `FolderOpen` and `Users` exist in the installed `lucide-react` (they did at version 1.60.0).
3. Read `app/globals.css` to use real token utility names (`bg-nav`, `border-surface-border`, `bg-elevated`, `text-copy-muted`, `bg-accent-dim`, `text-brand`, and so on).

## Editor Navbar: `components/editor/editor-navbar.tsx`

Props (controlled, the component owns no state):

- `isSidebarOpen: boolean`
- `onToggleSidebar: () => void`

Requirements:

- A `<header>` with a fixed height of `h-12` (48px), full width, `bg-nav` with `backdrop-blur`, and a 1px bottom border (`border-b border-surface-border`). No shadow.
- Three sections laid out left, center, right. Left holds the toggle button. Center and right render empty, but keep their layout slots so later units can fill them.
- Toggle button: the shadcn `Button` with an icon size and the `ghost` variant. It shows `PanelLeftClose` while the sidebar is open and `PanelLeftOpen` while it is closed.
- The button needs `aria-label` ("Close projects sidebar" / "Open projects sidebar"), `aria-expanded={isSidebarOpen}` and `aria-controls` pointing at the sidebar's `id`.
- Icons are `h-4 w-4` inside buttons per `ui-context.md`, or whatever size the Button's icon size gives. Use stroke icons only.

## Project Sidebar: `components/editor/project-sidebar.tsx`

Props:

- `isOpen: boolean`
- `onClose: () => void`

Layout and motion:

- A floating overlay: `fixed`, left-aligned, starting below the navbar (top offset = navbar height plus a small gap), with a bottom gap. Width `w-80` (320px).
- It floats above the canvas and must not push or resize the page content. Opening and closing must cause zero layout shift in the surrounding content.
- It slides in from the left using a CSS `transform` transition (`-translate-x-full` when closed, `translate-x-0` when open), about 200ms, with `motion-reduce:transition-none`.
- Surface: `bg-elevated`, a 1px `border-surface-border` border, `rounded-md`, and `shadow-md` (floating elements may use shadows). The border is mandatory, because in the light theme `--bg-elevated` is almost the same shade as `--bg-base`.
- Stack order: below the navbar's blur layer and below shadcn Dialog overlays (Dialog uses `z-50`). Use one z-index value below that and do not invent a z-index scale.
- No backdrop and no scroll lock. The sidebar is not modal, and the canvas stays usable while it is open.

Accessibility:

- Render as `<aside>` with an `id` matching the navbar button's `aria-controls`, and `aria-label="Projects"`.
- When closed, the sidebar must not be focusable or readable by assistive tech. Use the `inert` attribute (React 19 supports it) or an equivalent. Verify by tabbing through the page: focus must never land inside a closed sidebar.
- Pressing `Escape` while focus is inside the sidebar calls `onClose`.

Content:

- Header: the title `Projects` (weight 600) and a close button (`X` icon, ghost icon `Button`, `aria-label="Close sidebar"`) that calls `onClose`.
- Body: the shadcn `Tabs` with two triggers, `My Projects` and `Shared`. Local tab state is fine (default `My Projects`). Do not use the URL or any store for it.
- Both tabs render a placeholder empty state: one `h-8 w-8` stroke icon in `text-copy-muted` (`FolderOpen` for My Projects, `Users` for Shared) with one short line of text under it. Suggested copy: "No projects yet" and "Nothing shared with you yet". The body scrolls via `ScrollArea` if content overflows.
- Footer, pinned at the bottom: a full-width `New Project` `Button` with the `Plus` icon before the label. Use the default `Button` variant. The lime accent CTA is still an open question (see `01-design-sytem.md`), so do not style it with brand colors here. The button has no click behavior yet. Do not add a handler prop for it in this unit.

## Dialog Shell: `components/editor/editor-dialog.tsx`

A thin reusable wrapper over the shadcn `Dialog`, so every future dialog looks the same. It is a shell, not a dialog: do not build or render any concrete dialog in app code.

Props:

- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `title: string`
- `description?: string`
- `children?: ReactNode` (body content)
- `footer?: ReactNode` (action buttons, passed in by the caller)

Requirements:

- Compose the shadcn Dialog's own header, title, description and footer parts. Do not edit `components/ui/dialog.tsx`. Style only through the tokens that already flow into it (`popover`, `card`, `border`).
- Surface, per `ui-context.md`: `bg-surface`, 1px border, `rounded-md`, `shadow-lg`, over a dimmed backdrop. If the generated Dialog does not match, adjust with `className` on the shell and report the gap. Do not edit the generated file.
- Title and description render as the Dialog's real title and description elements, so screen readers announce them. If `description` is omitted, make sure Radix does not warn about a missing description (use the supported opt-out, or render the description visually hidden).
- The footer renders only when provided, with actions aligned to the end.
- Controlled only. No trigger and no internal open state.

## Hard rules

- Use `cn()` from `@/lib/utils` for class merging.
- Tokens only. No hex values, no raw palette classes (`zinc-*`, `gray-*`, `purple-*`, and so on), and no `dark:` variants for colors in our files.
- Radii come from the scale: `rounded-md` for the sidebar and the dialog, `rounded-sm` or `rounded-xs` for small inner elements. Never `rounded-lg` or larger. Circles use `rounded-full`.
- Weights are 400, 500 and 600 only. No `font-bold`.
- No gradients, glows, or tinted icon tiles. The empty-state icon is a bare icon, per the anti-slop rules.
- Add `"use client"` only to a file that actually needs it (hooks, effects, browser APIs). Report which files got it and why.
- Components are UI composition only. No business logic and no data access inside `components/`.
- Do not modify `components/ui/*`, `app/globals.css`, `components.json`, or `app/layout.tsx`. If a token is missing, stop and ask.
- Do not commit or push.

## How to run the visual check

Create one temporary client page (for example `app/editor-check/page.tsx`) that owns the `isSidebarOpen` state, renders `EditorNavbar`, `ProjectSidebar`, some filler content behind them, and one `EditorDialog` opened by a button with a title, description, body and two footer buttons. Check it with the `dark` class on `<html>` and again with it removed. Delete the page before reporting done. It must not remain in the repo.

## Done when

All of these are true. Report the evidence for each:

1. The three component files exist at the exact paths above, and `git status` shows no edits to `components/ui/*`, `globals.css`, `components.json` or `layout.tsx`.
2. `npx tsc --noEmit` and `npm run build` pass, and `npm run lint` reports zero errors from our new files.
3. The navbar toggle swaps `PanelLeftOpen` and `PanelLeftClose` correctly, and the `aria-expanded` value matches the state.
4. The sidebar slides in from the left without moving any other content (filler content stays put when it opens and closes).
5. Closed sidebar: tabbing never enters it. Open sidebar: `Escape` inside it closes it, and the close button closes it.
6. Both tabs switch and show their placeholders, and the `New Project` button is full width at the bottom.
7. The dialog shell shows the title, description, body and footer correctly, closes on `Escape` and on the overlay click, and works without a description with no console warning.
8. In both themes, the navbar, sidebar and dialog show visible 1px token borders. In the light theme, the sidebar is clearly separated from the page (record what you saw).
9. No hardcoded hex, palette class, `dark:` color variant or `font-bold` appears in the new files (grep to confirm).
10. The scratch page is deleted.
11. `context/progress-tracker.md` is updated to match the real state. If it contains entries that are out of date, reconcile them and say so.

## Stop and ask if

- Any file from feature 01 (`tabs`, `dialog`, `button`, `scroll-area`) is missing.
- The generated Dialog or Tabs cannot be made to match the tokens without editing `components/ui/*`.
- You think a route, a shell component or any state store is needed to finish this unit.
- A needed token or icon is missing from `globals.css` or `lucide-react`.
- A requirement here conflicts with `ui-context.md` or `architecture-context.md`.
- You are about to touch anything in the "Out of scope" list.
