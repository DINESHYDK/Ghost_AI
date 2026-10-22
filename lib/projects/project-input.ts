import "server-only";

export const PROJECT_NAME_MAX_LENGTH = 60;
export const DEFAULT_PROJECT_NAME = "Untitled Project";

export interface CreateProjectInput {
  name: string;
}

export interface RenameProjectInput {
  name: string;
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const NAME_TOO_LONG = `Name must be at most ${PROJECT_NAME_MAX_LENGTH} characters`;

export function parseCreateProjectInput(body: Record<string, unknown>): ParseResult<CreateProjectInput> {
  const { name } = body;
  if (name === undefined || name === null) return { ok: true, value: { name: DEFAULT_PROJECT_NAME } };
  if (typeof name !== "string") return { ok: false, error: "Name must be a string" };

  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: true, value: { name: DEFAULT_PROJECT_NAME } };
  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) return { ok: false, error: NAME_TOO_LONG };
  return { ok: true, value: { name: trimmed } };
}

export function parseRenameProjectInput(body: Record<string, unknown>): ParseResult<RenameProjectInput> {
  const { name } = body;
  if (typeof name !== "string") return { ok: false, error: "Name is required" };

  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: "Name is required" };
  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) return { ok: false, error: NAME_TOO_LONG };
  return { ok: true, value: { name: trimmed } };
}
