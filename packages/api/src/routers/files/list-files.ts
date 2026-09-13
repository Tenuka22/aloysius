import { files } from "@aloysius/db/schema/files";
import { desc } from "drizzle-orm";

import { adminProcedure } from "../../index";

export const listFiles = adminProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(files)
    .orderBy(desc(files.createdAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    size: row.size,
    type: row.type,
    url: `/api/files/${row.key}`,
    createdAt: row.createdAt.toISOString(),
  }));
});
