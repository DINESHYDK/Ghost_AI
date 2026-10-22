import { auth } from "@clerk/nextjs/server";

import { badRequest, internalError, jsonResponse, readJsonObject, unauthorized } from "@/lib/api/http";
import { createProject, listOwnedProjects, type ProjectSummary } from "@/lib/projects/project-data";
import { parseCreateProjectInput } from "@/lib/projects/project-input";

interface ProjectListResponse {
  projects: ProjectSummary[];
}

interface ProjectResponse {
  project: ProjectSummary;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const projects = await listOwnedProjects(userId);
    return jsonResponse<ProjectListResponse>({ projects });
  } catch (error) {
    return internalError("GET /api/projects", error);
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body.ok) return body.response;

  const input = parseCreateProjectInput(body.value);
  if (!input.ok) return badRequest(input.error);

  try {
    const project = await createProject(userId, input.value.name);
    return jsonResponse<ProjectResponse>({ project }, 201);
  } catch (error) {
    return internalError("POST /api/projects", error);
  }
}
