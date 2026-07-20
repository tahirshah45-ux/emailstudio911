import type { TimelineEvent, TimelineEventType } from "@/lib/types";
import { readCollection, writeCollection } from "./jsonStore";

/**
 * Timeline event log — the immutable project communication history.
 * Events are append-only; nothing in the UI deletes them.
 */

export async function addEvent(
  projectId: string,
  type: TimelineEventType,
  description: string,
  communicationId: string | null = null
): Promise<TimelineEvent> {
  const event: TimelineEvent = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    projectId,
    communicationId,
    type,
    description,
    at: new Date().toISOString(),
  };
  const events = await readCollection<TimelineEvent>("events");
  events.push(event);
  await writeCollection("events", events);
  return event;
}

export async function eventsForProject(projectId: string): Promise<TimelineEvent[]> {
  const events = await readCollection<TimelineEvent>("events");
  return events.filter((e) => e.projectId === projectId).sort((a, b) => b.at.localeCompare(a.at));
}
