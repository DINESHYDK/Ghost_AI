import { auth } from "@clerk/nextjs/server";

import {
  badRequest,
  forbidden,
  internalError,
  jsonResponse,
  projectNotFound,
  readJsonObject,
  unauthorized,
} from "@/lib/api/http";
import { deleteOwnedProject, renameOwnedProject, type ProjectSummary } from "@/lib/projects/project-data";
import { parseRenameProjectInput } from "@/lib/projects/project-input";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

interface ProjectResponse {
  project: ProjectSummary;
}

interface DeleteProjectResponse {
  id: string;
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body.ok) return body.response;

  const input = parseRenameProjectInput(body.value);
  if (!input.ok) return badRequest(input.error);

  const { projectId } = await params;
  try {
    const result = await renameOwnedProject(userId, projectId, input.value.name);
    if (result.status === "not_found") return projectNotFound();
    if (result.status === "forbidden") return forbidden();
    return jsonResponse<ProjectResponse>({ project: result.value });
  } catch (error) {
    return internalError("PATCH /api/projects/[projectId]", error);
  }
}

export async function DELETE(_request: Request, { params }: ProjectRouteContext) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { projectId } = await params;
  try {
    const result = await deleteOwnedProject(userId, projectId);
    if (result.status === "not_found") return projectNotFound();
    if (result.status === "forbidden") return forbidden();
    return jsonResponse<DeleteProjectResponse>({ id: result.value });
  } catch (error) {
    return internalError("DELETE /api/projects/[projectId]", error);
  }
}
