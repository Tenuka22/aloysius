import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";

export const CAPABILITY_MANAGE_NEWS = "manage_news";
export const CAPABILITY_MANAGE_EVENTS = "manage_events";
export const CAPABILITY_MANAGE_ANNOUNCEMENTS = "manage_announcements";
export const CAPABILITY_MANAGE_ANNOUNCEMENTS_GLOBAL =
  "manage_announcements_global";
export const CAPABILITY_MANAGE_GALLERY = "manage_gallery";
export const CAPABILITY_MANAGE_STUDENT_WORKS = "manage_student_works";

export const ALL_CAPABILITIES = [
  CAPABILITY_MANAGE_NEWS,
  CAPABILITY_MANAGE_EVENTS,
  CAPABILITY_MANAGE_ANNOUNCEMENTS,
  CAPABILITY_MANAGE_ANNOUNCEMENTS_GLOBAL,
  CAPABILITY_MANAGE_GALLERY,
  CAPABILITY_MANAGE_STUDENT_WORKS,
] as const;

export type Capability = (typeof ALL_CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  [CAPABILITY_MANAGE_NEWS]: "News articles",
  [CAPABILITY_MANAGE_EVENTS]: "Events",
  [CAPABILITY_MANAGE_ANNOUNCEMENTS]: "Club announcements",
  [CAPABILITY_MANAGE_ANNOUNCEMENTS_GLOBAL]: "School-wide announcements",
  [CAPABILITY_MANAGE_GALLERY]: "Photo albums",
  [CAPABILITY_MANAGE_STUDENT_WORKS]: "Student works",
};

export const CAPABILITY_DESCRIPTIONS: Record<Capability, string> = {
  [CAPABILITY_MANAGE_NEWS]:
    "Create and manage news articles for this activity",
  [CAPABILITY_MANAGE_EVENTS]: "Create and manage events for this activity",
  [CAPABILITY_MANAGE_ANNOUNCEMENTS]:
    "Create announcements scoped to this activity",
  [CAPABILITY_MANAGE_ANNOUNCEMENTS_GLOBAL]:
    "Create announcements visible across the entire school",
  [CAPABILITY_MANAGE_GALLERY]: "Manage photo albums for this activity",
  [CAPABILITY_MANAGE_STUDENT_WORKS]:
    "Create and manage student works for this activity",
};

export function hasCapability(
  capabilities: string[] | null | undefined,
  cap: string,
): boolean {
  if (!capabilities) return false;
  return capabilities.includes(cap);
}

export function assertCapability(
  capabilities: string[] | null | undefined,
  cap: string,
): void {
  if (!hasCapability(capabilities, cap)) {
    throw new ORPCError("FORBIDDEN", {
      message: `This activity does not have the "${cap}" capability.`,
    });
  }
}

export async function fetchActivityCapabilities(
  db: ReturnType<typeof createDb>,
  activityId: string,
): Promise<string[]> {
  const row = await db
    .select({ capabilities: activities.capabilities })
    .from(activities)
    .where(eq(activities.id, activityId))
    .get();
  return row?.capabilities ?? [];
}
