"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";
import { IconArrowRight } from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

const categoryLabels: Record<string, string> = {
  academic: "Academic",
  sports: "Sports",
  arts: "Arts",
  clubs: "Clubs",
  community: "Community",
  other: "Other",
};

interface AchievementRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  recipientNames: string[] | null;
  recipientType: string | null;
  year: number | null;
  coverImage: string | null;
  tags: string[] | null;
}

export function Achievements({
  initialData,
  settings,
}: {
  initialData?: AchievementRow[];
  settings?: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const items = (initialData ?? []).slice(0, 6);
  const s = (key: string) => settings?.[key] ?? "";
  const heading = s("achievements_heading");
  const description = s("achievements_description");

  const featured = items[0];
  const rest = items.slice(1);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  if (items.length === 0 && !heading) return null;

  return (
    <section
      ref={sectionRef}
      className="bg-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-[1180px]">
        <div
          data-animate
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 lg:mb-14"
        >
          <div>
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-green-dark m-0">
              {heading}
            </h2>
            {description && (
              <p data-animate className="text-[15px] text-green-dark/60 max-w-[60ch] mt-3.5">
                {description}
              </p>
            )}
          </div>
          <Link
            to="/achievements"
            className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
          >
            View All &rarr;
          </Link>
        </div>

        {featured && (
          <Link
            data-animate
            key={featured.id}
            to="/achievements/$slug"
            params={{ slug: featured.slug }}
            className="group block mb-4 lg:mb-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-gold bg-white">
              <div className="relative w-full overflow-hidden">
                {featured.coverImage ? (
                  <img
                    src={featured.coverImage}
                    alt={featured.title}
                    className={`w-full ${aspectRatioClass(getAspectRatio(featured.coverImage)) || "aspect-video"} lg:aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105`}
                  />
                ) : (
                  <div className="w-full aspect-video lg:aspect-[4/3] bg-gradient-to-br from-green-dark/10 to-gold/5" />
                )}
              </div>
              <div className="p-7 lg:p-10 flex flex-col justify-center">
                <div className="text-[11px] tracking-[0.16em] font-bold text-gold mb-3">
                  {(categoryLabels[featured.category] ?? featured.category).toUpperCase()}
                </div>
                <div className="font-heading text-2xl sm:text-[32px] font-semibold leading-tight text-green-dark mb-3">
                  {featured.title}
                </div>
                {featured.description && (
                  <p className="text-[15px] text-green-dark/65 leading-relaxed mb-4 line-clamp-3">
                    {featured.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-[13px] text-green-dark/50">
                  {featured.year && <span>{featured.year}</span>}
                  {featured.recipientNames && featured.recipientNames.length > 0 && (
                    <span>{featured.recipientNames.join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div data-animate className="border-t border-green-dark/10">
            {rest.map((item, idx) => (
              <Link
                key={item.id}
                to="/achievements/$slug"
                params={{ slug: item.slug }}
                className="group flex items-center gap-4 sm:gap-6 px-4 py-4 sm:py-5 border-b border-green-dark/10 hover:bg-white transition-colors"
              >
                <div className="w-16 sm:w-20 shrink-0 aspect-[4/3] overflow-hidden bg-green-dark/5">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-dark/10 to-gold/10" />
                  )}
                </div>
                <div className="text-[11px] tracking-[0.16em] font-bold text-gold w-12 sm:w-16 shrink-0">
                  {item.year ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-base sm:text-lg font-semibold leading-snug text-green-dark group-hover:underline truncate">
                    {item.title}
                  </div>
                  {item.recipientNames && item.recipientNames.length > 0 && (
                    <div className="text-[13px] text-green-dark/50 mt-0.5 truncate">
                      {item.recipientNames.join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-[11px] tracking-[0.14em] font-bold text-gold/70 uppercase hidden sm:block w-24 text-right shrink-0">
                  {categoryLabels[item.category] ?? item.category}
                </div>
                <div className="text-gold shrink-0">
                  <IconArrowRight size={18} stroke={1.5} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-sm text-green-dark/50">No achievements published yet.</div>
        )}
      </div>
    </section>
  );
}
