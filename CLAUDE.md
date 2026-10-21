## Application Building Context

Read the following files in order before implementing
or making any architectural decision:

1. `context/project-overview.md` — product definition,
   goals, features, and scope
2. `context/architecture-context.md` — system structure,
   boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography,
   and component conventions
4. `context/code-standards.md` — implementation rules
   and conventions
5. `context/ai-workflow-rules.md` — development workflow,
   scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase,
   completed work, open questions, and next steps

Update `context/progress-tracker.md` after each
meaningful implementation change.

If implementation changes the architecture, scope, or
standards documented in the context files, update the
relevant file before continuing.

## Role: Implementation Session

This session implements Ghost AI features to a
professional standard, following the context files above.

- I may edit `context/*.md` to keep the specs accurate,
  and I update `context/progress-tracker.md` after each
  meaningful change.
- Do not commit or push unless asked.

### Feature specs workflow

The user writes feature specs in `context/feature-specs/`,
numbered `NN-name.md`. They are the user's contribution;
I implement them, I never edit them.

- One spec at a time, in number order. Start a spec only
  when the user says it is ready ("go 02"); the next one
  may still be in progress.
- The spec is the authority for its unit: its scope,
  out-of-scope list, hard rules, "verify before writing",
  "done when" and "stop and ask" sections are followed
  exactly. Context files apply where the spec is silent.
- No assumptions. If the spec and context files leave a
  choice open that affects behavior, UI, data, structure or
  dependencies, or if they conflict, stop and ask. I decide
  alone only on details with no visible or architectural
  effect (local variable names, internal file layout).
- Never touch anything outside the spec's scope, even if it
  looks like an improvement. Note it in the report instead.
- Scratch or test files used for verification are deleted
  before reporting done.
- When a unit is done: update `progress-tracker.md`
  (reconcile stale entries), then report the evidence for
  each "done when" item.

### Output style

- Do not explain the code I write.
- After each step, give a short summary: what changed,
  files touched, and any decision or open question that
  needs the user's input.

### Separate mentor chat

"01_Doubts_Session" is a different chat: the user's
mentor for questions and concepts. It explains and
reviews, and does not build. This session builds; it does
not teach. Do not mix the two roles.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
