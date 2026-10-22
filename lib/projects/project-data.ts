import "server-only";

import { Prisma, type ProjectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Never select ownerId or canvasJsonPath into anything returned to clients.
const projectSummarySelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export type OwnedProjectResult<T> = { status: "ok"; value: T } | { status: "not_found" } | { status: "forbidden" };

export function listOwnedProjects(ownerId: string): Promise<ProjectSummary[]> {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: projectSummarySelect,
  });
}

export function createProject(ownerId: string, name: string): Promise<ProjectSummary> {
  return prisma.project.create({
    data: { ownerId, name },
    select: projectSummarySelect,
  });
}

export async function renameOwnedProject(
  ownerId: string,
  projectId: string,
  name: string,
): Promise<OwnedProjectResult<ProjectSummary>> {
  const access = await checkOwnership(ownerId, projectId);
  if (access) return access;

  try {
    const project = await prisma.project.update({
      where: { id: projectId, ownerId },
      data: { name },
      select: projectSummarySelect,
    });
    return { status: "ok", value: project };
  } catch (error) {
    if (isRecordNotFound(error)) return { status: "not_found" };
    throw error;
  }
}

export async function deleteOwnedProject(ownerId: string, projectId: string): Promise<OwnedProjectResult<string>> {
  const access = await checkOwnership(ownerId, projectId);
  if (access) return access;

  try {
    // Collaborator rows are removed by the database cascade.
    const deleted = await prisma.project.delete({
      where: { id: projectId, ownerId },
      select: { id: true },
    });
    return { status: "ok", value: deleted.id };
  } catch (error) {
    if (isRecordNotFound(error)) return { status: "not_found" };
    throw error;
  }
}

async function checkOwnership(
  ownerId: string,
  projectId: string,
): Promise<{ status: "not_found" } | { status: "forbidden" } | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) return { status: "not_found" };
  if (project.ownerId !== ownerId) return { status: "forbidden" };
  return null;
}

function isRecordNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
