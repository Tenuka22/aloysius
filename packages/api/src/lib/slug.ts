import { eq, like, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(
  table: { slug: { name: string }; id: { name: string } },
  title: string,
  excludeId?: string
): Promise<string> {
  const db = createDb();
  const base = toSlug(title);

  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.slug, slug))
      .get();

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter++;
  }
}
