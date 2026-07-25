import type { TimelineEvent, TimelineEventType } from "@/lib/types";
import { COLLECTIONS, newId, repo } from "./index";

/**
 * Timeline event log — the immutable project communication history.
 * Events are append-only; nothing in the UI deletes them.
 * Stored in the `timeline_events` collection.
 */

export async function addEvent(
  projectId: string,
  type: TimelineEventType,
  description: string,
  communicationId: string | null = null
): Promise<TimelineEvent> {
  const event: TimelineEvent = {
    id: newId(),
    projectId,
    communicationId,
    type,
    description,
    at: new Date().toISOString(),
  };
  await repo.set(COLLECTIONS.events, event.id, event);
  return event;
}

export async function eventsForProject(projectId: string): Promise<TimelineEvent[]> {
  const events = await repo.query<TimelineEvent>(COLLECTIONS.events, "projectId", projectId);
  return events.sort((a, b) => b.at.localeCompare(a.at));
}
