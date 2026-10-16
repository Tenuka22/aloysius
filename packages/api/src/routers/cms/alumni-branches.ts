import {
  alumniBranch,
  alumniBranchIdSchema,
} from "@aloysius/db/schema/alumni-branch";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";

/**
 * The branch directory on `/alumni`: where to find the Association, ordered
 * by `sortOrder`. Replaces `ALUMNI_BRANCH_CARDS`, a fixed three-row array
 * that never had a `contact` or `href` set despite the interface supporting
 * both. Published like `alumni-notables.ts`, with no review queue.
 */

const alumniBranchFieldsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  contact: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(160)))),
  href: v.optional(
    v.nullable(
      v.pipe(
        v.string(),
        v.url(),
        v.regex(/^https?:\/\//u, "Must be an http or https URL")
      )
    )
  ),
  sortOrder: v.optional(v.number(), 0),
});

/** Published branches, ordered for display. */
export const listAlumniBranches = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(alumniBranch)
      .orderBy(asc(alumniBranch.sortOrder), asc(alumniBranch.name))
      .all();

    return rows
      .filter((row) => row.publishedAt !== null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        contact: row.contact,
        href: row.href,
        sortOrder: row.sortOrder,
      }));
  }
);

export const createAlumniBranch = cmsProcedure
  .input(alumniBranchFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(alumniBranch)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        contact: input.contact ?? null,
        href: input.href ?? null,
        sortOrder: input.sortOrder ?? 0,
        publishedAt: new Date(),
      })
      .returning({ id: alumniBranch.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAlumniBranch = cmsProcedure
  .input(
    v.object({
      id: alumniBranchIdSchema,
      ...alumniBranchFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(alumniBranch)
      .set({
        name: input.name,
        contact: input.contact ?? null,
        href: input.href ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .where(eq(alumniBranch.id, input.id))
      .returning({ id: alumniBranch.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Alumni branch not found" });
    }

    return { id: record.id };
  });

export const deleteAlumniBranch = cmsProcedure
  .input(v.object({ id: alumniBranchIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(alumniBranch)
      .where(eq(alumniBranch.id, input.id))
      .returning({ id: alumniBranch.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Alumni branch not found" });
    }

    return { id: input.id };
  });
