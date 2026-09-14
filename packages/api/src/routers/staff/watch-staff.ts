import { eventIterator } from "@orpc/server";
import * as v from "valibot";

import { adminProcedure } from "../../index";
import { staffPublisher } from "./staff-publisher";

const staffEventSchema = v.variant("type", [
  v.object({ type: v.literal("created"), id: v.string() }),
  v.object({ type: v.literal("updated"), id: v.string() }),
  v.object({ type: v.literal("deleted"), id: v.string() }),
]);

export const watchStaff = adminProcedure
  .output(eventIterator(staffEventSchema))
  .handler(async function* watchStaff({ signal, lastEventId }) {
    const iterator = staffPublisher.subscribe("staff-changed", {
      signal,
      lastEventId,
    });
    for await (const event of iterator) {
      yield event;
    }
  });
