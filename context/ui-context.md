# UI Context

This file is the single source of truth for the design system.

Reference aesthetic: https://personal-website.getdesign.md/ (near-monochrome, boxy, mono labels).

## Theme

Dark and light, both supported. **Dark is the default.** The look is a quiet technical workspace:
near-monochrome gray surfaces separated by 1px borders, one lime brand accent, and sky blue reserved
for AI.

Implementation:

- Raw CSS variables live in `app/globals.css`: light values on `:root`, dark values on `.dark`.
  `<html>` carries the `dark` class by default. (`.dark` follows the shadcn/ui convention.)
- `@theme inline` maps the raw variables to Tailwind utilities (utility column below).
- Declare `@custom-variant dark (&:where(.dark, .dark *));` so Tailwind's `dark:` follows the class,
  not the OS setting.
- Components never use `dark:` for colors. The tokens switch with the theme.
- Never hardcode hex values or raw Tailwind palette classes (`zinc-*`, `slate-*`, `gray-*`,
  `purple-*`, ...) in components.

Theme toggle (in scope, low priority, after the core flow works):

- Two options only: Dark and Light. No "follow OS" option.
- Default is dark; light applies only when the user picks it.
- The choice is persisted in a cookie so the server renders the right class on `<html>` and there
  is no flash of the wrong theme.

### Surfaces and borders

| Role                   | Variable           | Dark        | Light     | Tailwind utility               |
| ---------------------- | ------------------ | ----------- | --------- | ------------------------------ |
| Page background        | `--bg-base`        | `#0a0a0a`   | `#ececec` | `bg-base`                      |
| Canvas / panels        | `--bg-surface`     | `#15171a`   | `#ffffff` | `bg-surface`                   |
| Elevated surface       | `--bg-elevated`    | `#1e2124`   | `#f5f4f2` | `bg-elevated`                  |
| Subtle / hover surface | `--bg-subtle`      | `#2a2d33`   | `#ebebe9` | `bg-subtle`                    |
| AI chat panel          | `--bg-ai`          | `#2a2d33`   | `#ececec` | `bg-ai-surface`                |
| AI message bubble      | `--bg-ai-bubble`   | `#33373d`   | `#ffffff` | `bg-ai-bubble`                 |
| Default border         | `--border-default` | `#2e2e2e`   | `#d9d9d9` | `border-surface-border`        |
| Strong border / input  | `--border-strong`  | `#ffffff2e` | `#aaaaaa` | `border-surface-border-strong` |

### Text

| Role      | Variable           | Dark        | Light     | Tailwind utility      |
| --------- | ------------------ | ----------- | --------- | --------------------- |
| Primary   | `--text-primary`   | `#ffffff`   | `#1e2124` | `text-copy-primary`   |
| Secondary | `--text-secondary` | `#ffffffb8` | `#52555a` | `text-copy-secondary` |
| Muted     | `--text-muted`     | `#ffffff8c` | `#767676` | `text-copy-muted`     |
| Faint     | `--text-faint`     | `#ffffff40` | `#aaaaaa` | `text-copy-faint`     |

### Accent and state

| Role                   | Variable               | Dark                    | Light       | Tailwind utility             |
| ---------------------- | ---------------------- | ----------------------- | ----------- | ---------------------------- |
| Brand accent (lime)    | `--accent-primary`     | `#bfff38`               | `#4a6d00`   | `text-brand`, `bg-brand`     |
| Brand dim              | `--accent-primary-dim` | `rgba(191,255,56,0.12)` | `#4a6d0014` | `bg-accent-dim`              |
| Text on accent         | `--on-accent`          | `#101400`               | `#ffffff`   | `text-on-accent`             |
| Primary button fill    | `--btn-primary`        | `#ffffff`               | `#1e2124`   | `bg-btn-primary`             |
| Text on primary button | `--btn-primary-text`   | `#1e2124`               | `#ffffff`   | `text-btn-primary-text`      |
| AI accent (sky blue)   | `--accent-ai`          | `#8FD9FB`               | `#0e7fae`   | `text-ai-accent`, `bg-ai-accent` |
| Error                  | `--state-error`        | `#ff7a7a`               | `#ff4136`   | `text-error`                 |
| Success                | `--state-success`      | `#34d399`               | `#15803d`   | `text-success`               |
| Warning                | `--state-warning`      | `#fbbf24`               | `#b45309`   | `text-warning`               |

`#8FD9FB` is too pale on white, so the light theme uses the darker `#0e7fae`.

Button usage:

- **Accent** (`bg-brand text-on-accent`): the single main call to action on a screen.
- **Primary** (`bg-btn-primary text-btn-primary-text`): regular primary actions.
- **Secondary**: transparent fill, `border-surface-border-strong`, hover `bg-subtle`.
- **Ghost**: text only, `text-copy-secondary`, hover `text-copy-primary`.

### Effects

| Role            | Variable         | Dark                   | Light                   | Tailwind utility |
| --------------- | ---------------- | ---------------------- | ----------------------- | ---------------- |
| Shadow small    | `--elevation-sm` | `0 1px 2px #0006`      | `0 1px 2px #1e212414`   | `shadow-sm`      |
| Shadow medium   | `--elevation-md` | `0 2px 12px #00000080` | `0 2px 8px #1e212414`   | `shadow-md`      |
| Shadow large    | `--elevation-lg` | `0 4px 16px #000000b3` | `0 4px 12px #1e21241a`  | `shadow-lg`      |
| Sticky nav fill | `--nav-bg`       | `rgba(10,10,10,.85)`   | `rgba(236,236,236,.85)` | `bg-nav`         |
| Canvas edge     | `--edge`         | `#f8fafc`              | `#1e2124`               | `stroke-edge`    |
| Canvas handle   | `--handle`       | `#ffffff`              | `#1e2124`               | `bg-handle`      |

The raw shadow variables are named `--elevation-*` because `--shadow-*` is Tailwind's own theme
namespace; reusing it would make the mapping self-referential. Tailwind's default shadow scale is
reset, so `shadow-sm` / `shadow-md` / `shadow-lg` are the only shadows available.

Shadows: the style is boxy and flat, and borders do most of the separation. Use shadows only on
floating elements (popovers, the AI panel, modals), never on cards or inline panels. The light `sm`
and `md` shadows are derived from the site's light shadow (same ink color).

The nav uses `--nav-bg` with a backdrop blur, which is functional (keeps content readable under a sticky bar), not decoration.

## Typography

| Role                     | Font           | Variable      | Tailwind    |
| ------------------------ | -------------- | ------------- | ----------- |
| UI / body                | Inter          | `--font-sans` | `font-sans` |
| Code, labels, node IDs   | JetBrains Mono | `--font-mono` | `font-mono` |

Load both with `next/font/google` (`Inter`, `JetBrains_Mono`) as CSS variables on `<html>`, then map
them to `--font-sans` / `--font-mono` in `@theme inline`. `body` uses `font-sans`, `antialiased`,
16px / 1.5. Geist is no longer used. Fraunces is not adopted.

Weights: exactly three. Load Inter at 400, 500 and 600 only.

- 400: body text
- 500: UI labels, buttons, the hero heading
- 600: headings (H2, H3, panel titles)

No 700. (The reference site's CSS asks for 600, but its font link loads 400/500/700, so its 600 text
actually renders at 700. We load 600 for real.) JetBrains Mono uses 400 and 500.

Scale:

| Role | Size                       | Weight | Tracking | Line height |
| ---- | -------------------------- | ------ | -------- | ----------- |
| Hero | `clamp(56px, 10.5vw, 152px)` | 500  | -0.03em  | 0.95        |
| H2   | 38px                       | 600    | -0.01em  | 1.1         |
| H3   | 26px                       | 600    | normal   | 1.2         |
| Body | 16px                       | 400    | normal   | 1.5         |

Tracking tokens: tight `-0.025em`, wider `0.05em`, widest `0.1em`.

Mono label pattern: JetBrains Mono, 12px, weight 500, uppercase, `0.1em` tracking, used for
eyebrows, section numbers and IDs (e.g. `001 / Identity`, `001 / step`).

## Border Radius

Boxy. 3px to 6px almost everywhere.

| Context                                      | Value  | Variable        | Tailwind       |
| -------------------------------------------- | ------ | --------------- | -------------- |
| Chips, tiny UI, small inline icon buttons    | `3px`  | `--radius-xs`   | `rounded-xs`   |
| Inputs, small controls, chat bubbles, list items | `4px`  | `--radius-sm`   | `rounded-sm`   |
| Buttons, cards, panels, modals, popovers     | `6px`  | `--radius-md`   | `rounded-md`   |
| Badges / tags only                           | `60px` | `--radius-pill` | `rounded-pill` |

- Circles (avatars, status dots, canvas handles) use `rounded-full`.
- Do not use `rounded-lg`, `rounded-xl`, `rounded-2xl` or `rounded-3xl`. Modals do not get a bigger
  radius.
- Tailwind v4's default `rounded-xs` is 2px, so `--radius-xs` must be overridden to 3px in `@theme`.

## Canvas

### Node Color Palette

8 color pairs, each with a dark-theme and a light-theme variant. Defined in `types/canvas.ts` as
`NODE_COLORS`, keyed by name. Purple is a normal user-pickable node color; it is the only place
purple appears.

Nodes store the color **name**, never a hex value: `neutral`, `blue`, `purple`, `orange`, `red`,
`pink`, `green` or `teal`. The renderer resolves the name to the dark or light pair for the current
theme. An unknown or missing name falls back to `neutral`. See `architecture-context.md` for the
schema rule.

| Name    | Dark fill / text      | Light fill / text     |
| ------- | --------------------- | --------------------- |
| neutral | `#1F1F1F` / `#EDEDED` | `#ffffff` / `#1e2124` |
| blue    | `#10233D` / `#52A8FF` | `#e6f1ff` / `#0b5fc0` |
| purple  | `#2E1938` / `#BF7AF0` | `#f3e8fb` / `#7b2fb5` |
| orange  | `#331B00` / `#FF990A` | `#fff0dc` / `#b55a00` |
| red     | `#3C1618` / `#FF6166` | `#ffe6e7` / `#c4262c` |
| pink    | `#3A1726` / `#F75F8F` | `#ffe6ef` / `#c2185b` |
| green   | `#0F2E18` / `#62C073` | `#e3f5e7` / `#1f7a35` |
| teal    | `#062822` / `#0AC7B4` | `#dff5f2` / `#0b7a6e` |

Default node color: `neutral`.

### Edge Style

Smooth-step path with an arrow marker. Color `var(--edge)`: `#f8fafc` dark, `#1e2124` light. Thin
stroke; edges are visually secondary to nodes.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon,
cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle`: default general-purpose node
- `diamond`: decision / gateway
- `circle`: event / endpoint
- `pill`: service / process
- `cylinder`: database / storage
- `hexagon`: external system / boundary

### Connection Handles

Small circular handles, hidden by default, revealed on node hover. Appear at all four sides of a
node.

- Fill `var(--handle)`: `#ffffff` dark, `#1e2124` light (same as `--text-primary`).
- A 1px `--bg-base` ring around each handle keeps it visible on any node color.
- On hover and while a connection is being dragged, the handle switches to `--accent-primary`.

### Canvas Background

React Flow `<Background>` component with a dot grid. The canvas sits on `--bg-base`; the dots use
`--border-default`. Nodes and floating panels (`--bg-elevated`) stand out against the base.

Light-theme caveat: `--bg-elevated` (`#f5f4f2`) is very close to `--bg-base` (`#ececec`). Floating
panels and popovers must always carry a visible 1px `--border-default`. If that is still not enough,
they use `--bg-surface` (`#ffffff`) in the light theme. This needs checking in the running app.

## Anti-"AI slop" Rules

Hard rules for all UI work. The earlier preview looked like generic AI output; these prevent that.

- **No purple, indigo or violet in shared UI** (navbar, panels, buttons, AI chat, icons, avatars).
  Purple exists only as one user-pickable canvas node color.
- **No gradients, glows or blurred color blobs as decoration.** Flat surfaces separated by 1px
  borders.
- **No icon-in-a-tinted-rounded-square tile on every card** as the default pattern. Use icons only
  where they carry meaning.
- **No pill-shaped everything.** Radii are 3-6px; pills are for small badges only.
- **No emoji, no decorative sparkle spam.** At most one sparkle icon, used only to mark AI-generated
  content.
- **Color is semantic, not decorative.** Lime = brand / primary action. Sky blue = AI. Red / green /
  amber = state. Do not introduce a new accent color without adding it to the tokens first.
- **Tokens only.** Never hardcode hex or raw Tailwind palette classes (`zinc-*`, `slate-*`,
  `purple-*`, ...) in components.
- **Typography:** Inter for UI, JetBrains Mono for labels, code and IDs. Tight tracking on large
  headings. Three weights only: 400 / 500 / 600.
- **Prefer restraint:** near-monochrome gray surfaces, one accent per context, generous spacing,
  thin borders.

## Component Library

shadcn/ui on top of Tailwind. The project has custom design tokens (this file) but no custom
component library. Components live in `components/ui/`. Use the `shadcn` CLI to add new components
rather than writing them from scratch, and do not edit them (see `ai-workflow-rules.md`).

shadcn components read their own variables. Point those at our tokens in `globals.css` instead of
editing the components:

| shadcn variable                         | Our token                              |
| --------------------------------------- | -------------------------------------- |
| `--background` / `--foreground`         | `--bg-base` / `--text-primary`         |
| `--card` / `--card-foreground`          | `--bg-surface` / `--text-primary`      |
| `--popover` / `--popover-foreground`    | `--bg-elevated` / `--text-primary`     |
| `--primary` / `--primary-foreground`    | `--btn-primary` / `--btn-primary-text` |
| `--secondary` / `--secondary-foreground`| `--bg-subtle` / `--text-primary`       |
| `--muted` / `--muted-foreground`        | `--bg-elevated` / `--text-muted`       |
| `--accent` / `--accent-foreground`      | `--bg-subtle` / `--text-primary`       |
| `--destructive`                         | `--state-error`                        |
| `--border`                              | `--border-default`                     |
| `--input`                               | `--border-strong`                      |
| `--ring`                                | `--accent-primary`                     |
| `--radius`                              | `6px`                                  |

- **Naming trap:** in shadcn, `--accent` means the hover / selected surface, not a brand color.
  Never point it at lime. Lime stays in our own `--accent-primary` / `--on-accent`, outside
  shadcn's set.
- **`--ring`:** the reference site uses a neutral gray (`#8c8c8c`). Lime gives a clearer focus ring
  on both themes, so this deviation from the site is deliberate.
- **`--radius`:** shadcn's generated formulas multiply `--radius` (`sm` 0.6x, `md` 0.8x, `lg` 1x,
  `xl` 1.4x, up to `4xl` 2.6x), which does not give our scale. They are replaced in `@theme` with
  fixed values: `xs` 3px, `sm` 4px, `md` 6px, and `lg` through `4xl` all pinned to 6px, because
  shadcn's own components use `rounded-lg` and up and we can't edit them. Our own components still
  never use `rounded-lg` or larger.
- **Sidebar variables** (`--sidebar-*`) follow the same mapping: `--bg-elevated`, `--btn-primary`,
  `--bg-subtle`, `--border-default`, `--accent-primary` for the ring.
- **Chart variables** (`--chart-*`) are not defined. Charts are out of scope; add tokens first if
  that changes.
- Setup: Radix base, `radix-nova` style (`components.json`), Lucide icons. `lib/utils.ts`
  re-exports `cn` from shadcn's `cn` package. When `shadcn init` or a registry item rewrites
  `globals.css` or adds a font to `layout.tsx`, restore the token mapping and fonts afterwards.

## Layout Patterns

- Editor workspace: full-viewport layout. Floating sidebar overlay on the left, center canvas,
  slide-over AI sidebar on the right.
- Left sidebar: floating overlay, `bg-elevated`, 1px `border-surface-border`, `rounded-md`. Active
  item: `bg-accent-dim text-brand`.
- AI sidebar (chatbot): `bg-ai-surface` panel. Messages are `bg-ai-bubble` with `rounded-sm` and a
  1px border (AI messages use `border-surface-border-strong`). The header uses a single sparkle icon
  in `text-ai-accent`. Composer: `bg-ai-bubble`, strong border, lime send button.
- Floating panels (left sidebar, AI sidebar, popovers) always have a 1px `border-surface-border`
  and may use `--shadow-md`. See the light-theme caveat under Canvas Background.
- Modals and dialogs: centered, `bg-surface`, 1px border, `rounded-md`, `--shadow-lg`, over a dimmed
  backdrop.
- Navbar: sticky top bar, `--nav-bg` with backdrop blur, 1px bottom border.

## Icons

Lucide React. Stroke-based icons only, no filled variants. Sizes: `h-4 w-4` inline, `h-5 w-5` in
buttons, `h-8 w-8` for empty-state icons. Icon color comes from tokens (`text-ai-accent` for the AI
sparkle, `text-copy-muted` for neutral icons).
