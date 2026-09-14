import { MemoryPublisher } from "@orpc/publisher/memory";

export type StaffEvent =
  | { type: "created"; id: string }
  | { type: "updated"; id: string }
  | { type: "deleted"; id: string };

/**
 * Process-scoped publisher for staff mutations.
 * watch-staff subscribes; create/update/delete procedures publish.
 */
export const staffPublisher = new MemoryPublisher<{
  "staff-changed": StaffEvent;
}>();
