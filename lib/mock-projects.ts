// Temporary in-memory mock data; replaced by real project data in a later unit.
import type { ProjectListItem } from "@/types/project";

export const initialMockProjects: ProjectListItem[] = [
  { id: "mock-1", name: "Ride-sharing backend", isOwner: true },
  { id: "mock-2", name: "E-commerce checkout", isOwner: true },
  { id: "mock-3", name: "Chat service", isOwner: true },
  { id: "mock-4", name: "Real-time collaborative document editing platform", isOwner: true },
  { id: "mock-5", name: "Payments platform", isOwner: false },
  { id: "mock-6", name: "Notification system", isOwner: false },
];

export function createMockProjectId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Placeholder for the real API call (a later unit replaces this): waits ~400 ms so loading states are visible.
export function simulateRequest() {
  return new Promise<void>((resolve) => setTimeout(resolve, 400));
}
