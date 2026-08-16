"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export function NoticeStrip({ settings }: { settings?: Record<string, string> }) {
  const s = (key: string) => settings?.[key] ?? "";
  const topId = s("top_announcement_id").trim();

  const { data: topAnnouncement } = useQuery(
    orpc.announcements.get.queryOptions({
      input: { id: topId },
      enabled: !!topId,
    }),
  );

  // Top announcement selected in the homepage CMS -> yellow strip with green text
  if (topAnnouncement) {
    return (
      <div className="bg-gold text-green-dark text-[13px] flex items-center gap-3.5 px-4 sm:px-6 lg:px-12 py-[7px]">
        <span className="inline-flex items-center gap-2 font-bold tracking-[0.12em] text-[11px] shrink-0 text-green-dark">
          <span className="w-[7px] h-[7px] rounded-full bg-green-dark" />
          {s("notice_label") || "TOP ANNOUNCEMENT"}
        </span>
        <a
          href={`/announcements/${topAnnouncement.slug}`}
          className="truncate font-semibold hover:underline"
        >
          {topAnnouncement.title}
        </a>
        <a
          href={`/announcements/${topAnnouncement.slug}`}
          className="ml-auto text-green-dark font-semibold text-xs whitespace-nowrap hover:underline shrink-0"
        >
          {s("notice_cta_text") || "View"} &rarr;
        </a>
      </div>
    );
  }

  const text = s("notice_text").trim();
  if (!text) return null;

  const url = s("notice_url") || "/news-events";
  const isHigh = settings?.notice_priority === "high";
  const color = isHigh ? "var(--red-alert)" : "var(--gold)";

  return (
    <div className="bg-green-darker text-cream text-[13px] flex items-center gap-3.5 px-4 sm:px-6 lg:px-12 py-[9px]">
      <span
        className="inline-flex items-center gap-2 font-bold tracking-[0.12em] text-[11px] shrink-0"
        style={{ color }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
        {s("notice_label") || "NOTICE"}
      </span>
      <span className="opacity-90 truncate">{text}</span>
      {s("notice_cta_text") && (
        <a
          href={url}
          className="ml-auto text-gold font-semibold text-xs whitespace-nowrap hover:underline shrink-0"
        >
          {s("notice_cta_text")} &rarr;
        </a>
      )}
    </div>
  );
}
