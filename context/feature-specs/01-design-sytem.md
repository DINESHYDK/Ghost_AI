Read `CLAUDE.md` before starting. Then read `context/ui-context.md` in full, especially "Component Library", "Border Radius" and "Anti-AI slop Rules". This unit follows them exactly.

# Feature 01: Design System and UI Primitives

## Goal

Add the remaining shadcn/ui primitives and confirm that all of them render with Ghost AI's design tokens in both themes. The shadcn foundation already exists; this unit finishes and verifies it.

## Current state (already done, do not redo)

- Tokens, theme variables, `@theme` mappings, radii, shadow reset and the shadcn variable mapping are in `app/globals.css`. Light is on `:root`, dark on `.dark`, and `<html>` carries `dark` by default.
- Inter and JetBrains Mono are loaded in `app/layout.tsx`.
- shadcn is initialised: `components.json` exists (style `radix-nova`, baseColor `neutral`, CSS variables on, icon library `lucide`, aliases `@/components`, `@/components/ui`, `@/lib/utils`).
- `lucide-react` is installed.
- `lib/utils.ts` exports `cn` from the `cn` package (`export { cn } from "cn"`). The generated `button.tsx` imports `cn` from `"cn"` too. `cn` was tested: it resolves Tailwind conflicts (`p-2` + `p-4` gives `p-4`) and keeps custom token classes (`text-sm` + `text-copy-muted` keeps both).
- `components/ui/button.tsx` is installed.

## Scope

In scope:

1. Add these shadcn components with the CLI: Card, Dialog, Input, Tabs, Textarea, ScrollArea.
2. Verify all seven components (Button plus the six new ones) against the design tokens, in dark and light.
3. Record the result in `context/progress-tracker.md`.

Out of scope (do not start these):

- Editing `app/page.tsx`, the sign-in or sign-up pages, or `app/layout.tsx`.
- The Dark / Light theme toggle.
- Extra shadcn components (Dropdown, Toast, Sidebar, Select, and so on).
- A lime "accent" button variant. See "Open question" below.
- Any canvas, AI panel or workspace UI.

## Verify before writing

1. Run `npx shadcn --version` and `npx shadcn add --help`. Use the CLI's real flags, not remembered ones.
2. Read `components.json` and `app/globals.css` so you know the current state.
3. Confirm the new components import from `radix-ui` (the unified package already installed). Do not install individual `@radix-ui/*` packages.

## Hard rules

- Add components with the shadcn CLI only. Never hand-write or paste component code.
- Add only the six missing components. Do not re-add `button`. Never pass an overwrite flag.
- Do not modify any file in `components/ui/*` after generation (see "Protected Foundation Components" in `ai-workflow-rules.md`). If a component looks wrong, fix it through tokens in `globals.css`, not by editing the component.
- Generated components may contain their own class names (`rounded-lg`, `dark:` variants, `bg-black/50` on the dialog overlay). That is accepted. The "no hardcoded colors" and "no `dark:` for colors" rules apply to code we write, not to generated files.
- Do not change `lib/utils.ts`, and do not install `clsx` or `tailwind-merge`. `cn` already works. Touch it only if the verification below fails, and then stop and ask.
- Do not change values of existing tokens in `globals.css`. If a new component needs a variable that is not mapped yet, map it to an existing token, add it to the shadcn mapping table in `ui-context.md`, and say so in your summary.
- Do not add colors, fonts, radii or shadows that are not in `ui-context.md`.
- After each `shadcn add`, run `git status` and `git diff` on `app/globals.css`, `components.json`, `package.json`. Revert anything the CLI changed unexpectedly. Only new files under `components/ui/` and the dependency lines they need are expected.
- Icons come from `lucide-react`, stroke-based only. Do not reinstall it.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. `components/ui/` contains exactly: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `tabs.tsx`, `textarea.tsx`, `scroll-area.tsx`. `git diff` shows no edits to any of them after generation.
2. `npx tsc --noEmit` and `npm run build` pass. Run `npm run lint` and report any errors that come from our own code, separate from generated files.
3. `cn()` check still passes: `cn("p-2", "p-4")` gives `p-4`, and `cn("text-sm", "text-copy-muted")` keeps both classes.
4. Visual check of every component in both themes (see below). Each one uses token colors, shows 1px token borders where it has borders, shows the lime focus ring on keyboard focus, and uses a radius of 6px or smaller (except circles). No shadcn default gray/oklch palette is visible.
5. In the light theme, the Dialog (and any floating surface) has a visible 1px border against the background. If it blends in, record that in the progress tracker. Do not edit the component.
6. No new hardcoded hex values or raw palette classes (`zinc-*`, `slate-*`, `gray-*`, `purple-*`) in any file we wrote.
7. `app/globals.css`, `components.json` and `app/layout.tsx` are unchanged, unless a mapping was added under the rule above and reported.
8. `context/progress-tracker.md` is updated: completed work, the light-theme panel finding, and the open question below.

### How to run the visual check

Create one temporary page (for example `app/design-check/page.tsx`) that renders every component with realistic content: all Button variants and sizes, Card, a Dialog opened by a trigger, Input and Textarea (normal, focused, disabled, invalid), Tabs, and a ScrollArea with overflowing content. Check it with the `dark` class on `<html>` and again with it removed. Delete the page before reporting done. It must not remain in the repo.

## Open question (record it, do not resolve it)

The lime accent button (`bg-brand text-on-accent`, the one main call to action per screen) is not a shadcn variant, and `button.tsx` must stay unedited. Add this to `progress-tracker.md` as an open question: how the accent CTA is built (a `className` override at the call site, or an app-level wrapper component). It is decided in a later unit.

## Stop and ask if

- The CLI wants to overwrite `button.tsx`, `globals.css`, `components.json` or `lib/utils.ts`.
- The CLI asks to change the style, base color or aliases in `components.json`.
- A component cannot be made to match the tokens without editing the generated file.
- The `cn()` check fails, or a generated file imports something that is not installed.
- Installing a component adds a dependency other than `radix-ui` packages already present.
- You are about to modify anything in the "Out of scope" list.
