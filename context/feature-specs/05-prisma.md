Read `CLAUDE.md` before starting. Then read `context/architecture-context.md` ("Storage Model", "Auth and Collaboration Model", "Invariants") and `context/code-standards.md` ("Data and Storage", "File Organization").

# Feature 05: Prisma, Project Data Models and Client

## Goal

Add Prisma ORM (version 7) with the two project data models, a cached server-side Prisma client, and the first migration. Data layer only: no API routes, no queries, no UI.

## Current state (read this, it corrects the old spec)

- **Prisma is NOT installed.** `prisma`, `@prisma/client`, `@prisma/adapter-pg` and `pg` are absent from `package.json` and `node_modules`. There is no `prisma/` folder and no `prisma.config.ts`. This unit installs them.
- **There is no database yet.** `.env.local` holds only the Clerk variables. There is no `DATABASE_URL`.
- `dotenv` exists in `node_modules` only as a transitive dependency and `server-only` is only a transitive dependency of Clerk. Both are installed explicitly in this unit.
- `.gitignore` already ignores `.env*`.

## Dependencies and versions (critical)

On the npm registry the `latest` tag of `prisma` is the **8.0 release candidate** while `@prisma/client` `latest` is 7.10.1. A plain `npm install prisma` would pair mismatched major versions and use a different schema system. Do not do that.

- Use Prisma **7.x** for everything: `prisma` (dev dependency), `@prisma/client`, `@prisma/adapter-pg`, all pinned to the **same exact 7.10.x version**. Verify with `npm ls prisma @prisma/client @prisma/adapter-pg`.
- Also install: `pg` and `@types/pg`, `dotenv` (explicitly), and `server-only`.
- `@prisma/extension-accelerate` is needed only if the Accelerate branch (below) is implemented. Check the Accelerate docs for what Prisma 7 requires and install it pinned to a compatible version.
- Do not follow documentation for Prisma 8 (its pages mention a "contract" and `// use prisma-8` files). That is not what this project uses.

## Scope

In scope:

1. Install the dependencies above.
2. `prisma.config.ts` at the project root.
3. `prisma/schema.prisma` (generator and datasource only) and `prisma/models/project.prisma` (the two models).
4. `lib/prisma.ts`, the cached client.
5. The first migration, applied to a development database, and the generated client.
6. A `postinstall` script (`prisma generate`) and `.gitignore` entry for the generated client.
7. Updating `context/progress-tracker.md`.

Out of scope (do not start these):

- API routes, server actions, queries, or any code that reads or writes projects.
- Other models: users, specs, task runs, templates. Clerk is the source of truth for users, so there is no `User` table.
- A seed script, Prisma Studio setup, or deployment configuration.
- Anything involving Vercel Blob, Liveblocks or the canvas. `canvasJsonPath` is only a column here.
- UI changes.

## Verify before writing

Read the Prisma ORM **7** docs for the installed version. Do not write from memory. Confirm in particular:

1. The `generator` block for the new client: the provider value and the required `output` path, and how the generated client is imported (never from `@prisma/client` if the docs say otherwise).
2. `prisma.config.ts` shape: `defineConfig`, `schema`, `migrations.path`, `datasource.url`. In Prisma 7 the connection URL lives in `prisma.config.ts`, not in the `datasource` block.
3. The Prisma CLI does **not** load `.env` files on its own, and `.env.local` is not special to it. The config must load `.env.local` explicitly (for example `dotenv` with `path: ".env.local"`). Without this, migrations fail with a missing `DATABASE_URL`.
4. Multi-file schema: the folder layout, where the `datasource` and `generator` blocks live, and that the `migrations` directory must sit next to the file defining the `datasource` block. Run `npx prisma validate` to prove the layout works.
5. How the driver adapter is passed to `PrismaClient` in v7 (`new PrismaPg({ connectionString })` then `new PrismaClient({ adapter })`).
6. The exact v7 usage for Prisma Accelerate with a `prisma+postgres://` URL. The Postgres docs page does not cover it, so read the Accelerate docs. Do not guess.
7. Whether `env("DATABASE_URL")` in `prisma.config.ts` throws when the variable is missing (it can break `prisma generate` and builds). If so, use a form that lets `generate` run without a database.

## Database and environment

- The user provides the database. Do not create accounts, databases, or Docker containers, and do not choose a provider.
- `DATABASE_URL` is stored in `.env.local` (gitignored). If it is missing, **stop and ask**. Do not invent a value.
- Never print, log or commit `DATABASE_URL` or any credentials. When checking it, only test its prefix or presence.
- Do not add any other new environment variable. If Prisma Migrate needs a separate direct connection URL for the user's provider (some pooled and Accelerate URLs do not support migrations), stop and ask instead of inventing a variable.
- Before migrating, confirm with the user that `DATABASE_URL` points to a **development** database, never production.

## Models

Schema files: `prisma/schema.prisma` holds the `generator` and `datasource` only. `prisma/models/project.prisma` holds the enum and both models.

Keep to the fields listed. The only additions are the `id` columns and `updatedAt`, which Prisma's conventions require.

### `ProjectStatus` enum

`DRAFT`, `ARCHIVED`.

### `Project`

| Field             | Type            | Notes                                                                 |
| ----------------- | --------------- | --------------------------------------------------------------------- |
| `id`              | `String`        | primary key, `@default(cuid())`                                       |
| `ownerId`         | `String`        | the owner's Clerk user ID. No relation (there is no User table)       |
| `name`            | `String`        |                                                                       |
| `description`     | `String?`       | optional                                                              |
| `status`          | `ProjectStatus` | `@default(DRAFT)`                                                     |
| `canvasJsonPath`  | `String?`       | nullable. Will hold the Vercel Blob URL of the canvas snapshot later  |
| `createdAt`       | `DateTime`      | `@default(now())`                                                     |
| `updatedAt`       | `DateTime`      | `@updatedAt`                                                          |
| `collaborators`   | relation        | `ProjectCollaborator[]`                                               |

Index: `@@index([ownerId, createdAt])`. This single composite index serves both "projects for this owner" and "this owner's projects newest first", so a separate `ownerId` index would be redundant.

### `ProjectCollaborator`

| Field       | Type       | Notes                                                                      |
| ----------- | ---------- | -------------------------------------------------------------------------- |
| `id`        | `String`   | primary key, `@default(cuid())`                                            |
| `projectId` | `String`   | foreign key to `Project`                                                   |
| `project`   | relation   | `onDelete: Cascade`, so deleting a project removes its collaborators       |
| `email`     | `String`   | collaborator's email                                                       |
| `createdAt` | `DateTime` | `@default(now())`                                                          |

Constraints and indexes: `@@unique([projectId, email])`, `@@index([email])`, `@@index([projectId, createdAt])`.

Decisions in this table (the user may change them): `cuid()` ids, and the composite index on `Project`. The original spec said "indexes on owner ID and creation date", which can mean two separate indexes.

Email rule for later units (record it in the progress tracker, do not build it here): collaborator emails must be stored **lowercase**, and access checks must only trust a **verified** email on the Clerk user. Otherwise someone could gain access to a project by claiming an address they do not own. Prisma cannot enforce this, so it belongs at the write and read boundaries of the later features.

## Prisma client: `lib/prisma.ts`

- First line: `import "server-only"`, so a client component can never import the database client.
- Exports exactly one `prisma` instance (a named export).
- Cached on `globalThis` in non-production so hot reloads do not create new connections. In production, create it once at module scope.
- Branch on `DATABASE_URL`:
  - starts with `prisma+postgres://`: use Prisma Accelerate, exactly as the Prisma 7 Accelerate docs describe.
  - otherwise: use the direct `@prisma/adapter-pg` adapter with the connection string.
- Import the client from the generated output path set in the generator block.
- No query helpers, no business logic in this file.

## Config and scripts

- `prisma.config.ts` loads `.env.local`, points `schema` at the `prisma` folder, sets `migrations.path` to `prisma/migrations`, and sets `datasource.url` from `DATABASE_URL`.
- Add `"postinstall": "prisma generate"` to `package.json` scripts, so the client exists after a fresh install and in CI.
- Add the generated client output folder to `.gitignore`. Generated code is not committed. The `prisma/migrations` folder **is** committed (the user commits it).

## Migration

- Name: `init_projects` (use the CLI's real flag for naming, checked with `--help`).
- Run `npx prisma migrate dev` against the development database, then make sure the client is generated.
- Never run `migrate reset`, `db push`, `migrate deploy`, `--force`, `--accept-data-loss`, or anything that drops tables or data.
- If the migration fails, report the error. Do not retry with destructive flags.

## Hard rules

- Do not modify `components/ui/*`, existing specs, or unrelated files. Allowed edits: `package.json` and the lockfile (dependencies, the postinstall script), `.gitignore` (generated client), plus the new files above.
- Keep Prisma server-only. Never import `lib/prisma.ts` into a client component.
- Do not write any query code in this unit.
- Do not commit or push.

## Done when

All of these are true. Report the evidence for each:

1. `npm ls prisma @prisma/client @prisma/adapter-pg` shows one aligned 7.x version, and no Prisma 8 packages are installed.
2. `npx prisma validate` passes. The schema has both models, the enum, the cascade relation, the unique constraint and the indexes exactly as above.
3. `npx prisma migrate status` reports the database is up to date, and `prisma/migrations` contains the `init_projects` migration. Show the generated SQL's table and index names.
4. `lib/prisma.ts` exports one cached `prisma`, begins with `import "server-only"`, handles both URL branches, and caches on `globalThis` outside production.
5. `npx tsc --noEmit` and `npm run lint` (errors in our own files) pass, and `npm run build` passes from a state where the generated client has just been produced by `postinstall`.
6. `git status` shows no credentials, no `.env*` file, and no generated client files staged or tracked.
7. If it can be done without installing anything else, run a throwaway script that creates a `Project` with a `ProjectCollaborator`, confirms the duplicate `(projectId, email)` is rejected, deletes the project, and confirms the collaborator was cascade-deleted. Remove every row and the script afterwards. If that is not possible, say so and list these checks for the user to run in Prisma Studio.
8. `context/progress-tracker.md` is updated to the real state, including the email rule above and the open question about which database provider and URL type are used.

## Stop and ask if

- `DATABASE_URL` is missing, or you cannot confirm it points to a development database.
- The user's database needs a separate direct URL for migrations, or needs a new environment variable.
- Prisma 7 docs for the installed version contradict anything in this spec (generator, config, adapter, Accelerate).
- The multi-file schema layout does not validate, or the migrations folder cannot sit where Prisma requires.
- A migration would drop or alter existing data.
- You think another model, a route, or a query is needed to finish this unit.
- You are about to touch anything in the "Out of scope" list.
