import { eq } from "drizzle-orm";
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

type TableWithSlug = {
  slug: any
  id: any
  [key: string]: any
}

export async function generateUniqueSlug(
  table: TableWithSlug,
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
      .from(table as any)
      .where(eq(table.slug, slug))
      .get();

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter++;
  }
}

export async function checkSlugUnique(
  table: TableWithSlug,
  slug: string,
  excludeId?: string
): Promise<{ unique: boolean; suggestion?: string }> {
  const db = createDb();
  const existing = await db
    .select({ id: table.id })
    .from(table as any)
    .where(eq(table.slug, slug))
    .get();

  if (!existing || existing.id === excludeId) {
    return { unique: true };
  }

  const suggestion = await generateUniqueSlug(table, slug, excludeId);
  return { unique: false, suggestion };
}
