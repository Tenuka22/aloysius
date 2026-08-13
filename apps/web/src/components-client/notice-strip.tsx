"use client";

export function NoticeStrip({ settings }: { settings?: Record<string, string> }) {
  const text = settings?.notice_text?.trim();
  if (!text) return null;

  const url = settings?.notice_url || "/news-events";
  const isHigh = settings?.notice_priority === "high";
  const color = isHigh ? "#E05252" : "#FFB203";

  return (
    <div className="bg-green-darker text-cream text-[13px] flex items-center gap-3.5 px-4 sm:px-6 lg:px-12 py-[9px]">
      <span
        className="inline-flex items-center gap-2 font-bold tracking-[0.12em] text-[11px] shrink-0"
        style={{ color }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
        NOTICE
      </span>
      <span className="opacity-90 truncate">{text}</span>
      <a
        href={url}
        className="ml-auto text-gold font-semibold text-xs whitespace-nowrap hover:underline shrink-0"
      >
        View all notices &rarr;
      </a>
    </div>
  );
}
