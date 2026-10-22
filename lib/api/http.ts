import "server-only";

export interface ErrorResponse {
  error: string;
}

export function jsonResponse<T>(body: T, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(status: number, message: string) {
  return jsonResponse<ErrorResponse>({ error: message }, status);
}

export const badRequest = (message: string) => errorResponse(400, message);
export const unauthorized = () => errorResponse(401, "Unauthorized");
export const forbidden = () => errorResponse(403, "Forbidden");
export const projectNotFound = () => errorResponse(404, "Project not found");

export function internalError(route: string, error: unknown) {
  // Log only the error type and code: messages can contain SQL, values or connection details.
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
  const name = error instanceof Error ? error.name : typeof error;
  console.error(`[api] ${route} failed`, { name, code });
  return errorResponse(500, "Internal server error");
}

type JsonObjectResult = { ok: true; value: Record<string, unknown> } | { ok: false; response: Response };

export async function readJsonObject(request: Request): Promise<JsonObjectResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: errorResponse(415, "Content-Type must be application/json") };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: errorResponse(400, "Body must be valid JSON") };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, response: errorResponse(400, "Body must be a JSON object") };
  }
  return { ok: true, value: body as Record<string, unknown> };
}
