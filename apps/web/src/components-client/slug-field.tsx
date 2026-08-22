"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "@/utils/orpc";
import { cn } from "@aloysius-web/ui/lib/utils";

type SlugCheckInput = { slug: string; excludeId?: string };
type SlugCheckResult = { unique: boolean; suggestion?: string | null };

const checkSlugRouters: Record<
  string,
  (input: SlugCheckInput) => Promise<SlugCheckResult>
> = {
  news: client.news.checkSlug,
  events: client.events.checkSlug,
  announcements: client.announcements.checkSlug,
  achievements: client.achievements.checkSlug,
  activities: client.activities.checkSlug,
  gallery: client.gallery.checkSlug,
  studentWorks: client.studentWorks.checkSlug,
};

export function SlugFieldInline({
  sourceField = "title",
  routerName,
  value,
  onChange,
  label = "Slug",
  required = false,
  excludeId,
}: {
  sourceField?: string;
  routerName: string;
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  excludeId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const lastCheckedSlug = useRef<string>("");

  const checkSlugUniqueness = useCallback(
    async (slugValue: string) => {
      if (!slugValue) {
        setError(null);
        return;
      }
      setChecking(true);
      try {
        const result = await checkSlugRouters[routerName]({ slug: slugValue, excludeId });
        if (!result.unique) {
          setError(`Slug already exists. Suggestion: ${result.suggestion}`);
        } else {
          setError(null);
        }
      } catch {
        setError(null);
      } finally {
        setChecking(false);
      }
    },
    [routerName, excludeId],
  );

  useEffect(() => {
    if (value && value !== lastCheckedSlug.current) {
      const timeout = setTimeout(() => {
        checkSlugUniqueness(value);
        lastCheckedSlug.current = value;
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <p className="text-xs text-muted-foreground">
        URL-friendly identifier. Auto-generated from {sourceField}.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={() => {
          if (value) checkSlugUniqueness(value);
        }}
        placeholder="e.g. 2026-art-exhibition"
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input focus-visible:ring-ring",
        )}
      />
      {checking && <p className="text-xs text-muted-foreground">Checking availability...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
