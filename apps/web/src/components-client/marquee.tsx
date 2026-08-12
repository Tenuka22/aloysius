"use client";

interface Announcement {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  createdAt?: string;
  audience?: string | null;
}

export function AnnouncementsMarquee({
  announcements,
}: {
  announcements: Announcement[];
}) {
  if (!announcements || announcements.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...announcements, ...announcements];

  return (
    <div className="bg-[#c9a227] overflow-hidden py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <a
            key={`${item.id}-${i}`}
            href={`/announcements/${item.slug}`}
            className="group inline-flex items-center gap-3 px-6 text-sm text-[#0a10f0a] hover:text-white transition-colors shrink-0"
          >
            <span className="font-semibold">{item.title}</span>
            {item.excerpt && (
              <span className="text-[#0a1f0a]/60 line-clamp-1 max-w-[200px] group-hover:text-white/80 transition-colors">
                — {item.excerpt}
              </span>
            )}
            <span className="text-[#0a1f0a]/30">•</span>
          </a>
        ))}
      </div>
    </div>
  );
}
