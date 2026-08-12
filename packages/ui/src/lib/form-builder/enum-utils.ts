import type { SelectOption } from "./types";

type EnumSchema = {
  type: "string";
  enum: readonly string[];
};

export function optionsFromSchema(schema: EnumSchema): SelectOption[] {
  return schema.enum.map((value) => ({
    value,
    label: formatLabel(value),
  }));
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const SYSTEM_FIELDS = new Set([
  "id",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
]);
