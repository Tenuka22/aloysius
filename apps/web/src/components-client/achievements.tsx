"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = ["ALL", "academic", "sports", "arts", "clubs", "community", "other"];

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
  const items = (initialData ?? []).slice(0, 3);
  const s = (key: string) => settings?.[key] ?? "";
  const heading = s("achievements_heading");
  const description = s("achievements_description");

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
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
      style={{ background: "#000000" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, #000000, #013405)" }}
      />
      <div className="relative mx-auto max-w-295">
        {s("achievements_eyebrow") && (
          <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
            {s("achievements_eyebrow")}
          </div>
        )}
        <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-4">
          {heading}
        </h2>
        {description && (
          <p data-animate className="text-[15px] text-cream/65 max-w-[60ch] mb-14">
            {description}
          </p>
        )}

        <div data-animate className="flex flex-wrap gap-3 mb-11">
          {categories.map((cat) => (
            <a
              key={cat}
              href="/achievements"
              className="border border-gold/40 text-gold text-xs font-bold tracking-widest px-4.5 py-2.25 hover:bg-gold hover:text-green-dark transition-colors"
            >
              {cat === "ALL" ? "ALL" : categoryLabels[cat].toUpperCase()}
            </a>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {items.map((item) => (
              <Link
                key={item.id}
                data-animate
                to="/achievements/$slug"
                params={{ slug: item.slug }}
                className="block border-t-2 border-gold pt-6"
              >
                <div className="text-[11px] tracking-[0.16em] font-bold text-gold">
                  {(categoryLabels[item.category] ?? item.category).toUpperCase()}
                </div>
                <div className="font-heading text-[27px] font-semibold leading-tight my-3.5">
                  {item.title}
                </div>
                <div className="text-[13px] text-cream/60">
                  {[item.year, item.recipientNames?.join(", ")].filter(Boolean).join(" • ")}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-cream/50">No achievements published yet.</div>
        )}
      </div>
    </section>
  );
}
