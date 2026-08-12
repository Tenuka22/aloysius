"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

export function Achievements({ initialData }: { initialData?: AchievementRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const items = initialData ?? [];
  const featured = items[0];
  const rest = items.slice(1, 5);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 90%", once: true },
        },
      );

      if (featuredRef.current) {
        gsap.fromTo(
          featuredRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: featuredRef.current, start: "top 90%", once: true },
          },
        );
      }

      gsap.fromTo(
        ref.current?.children ?? [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
              Recognition
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">Achievements</h2>
          </div>
          <a
            href="/achievements"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            View All
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {featured ? (
          <div ref={featuredRef} className="mb-8">
            <Link
              to="/achievements/$slug"
              params={{ slug: featured.slug }}
              className="group grid md:grid-cols-2 gap-6 border bg-background overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video md:aspect-auto bg-muted overflow-hidden">
                {featured.coverImage ? (
                  <img
                    src={featured.coverImage}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c9a227]/10 to-[#c9a227]/5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-16 text-[#c9a227]/30"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.172-1.756.96-1.756 1.94v3.03c0 .621.504 1.125 1.125 1.125h3.03c.98 0 1.768-.788 1.94-1.756M5.25 4.236A2.25 2.25 0 017.5 2.25h9a2.25 2.25 0 012.25 2.25c.343 1.32.467 2.688.35 4.047"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <span className="inline-flex items-center bg-[#c9a227]/10 text-[#c9a227] px-3 py-1 text-xs font-semibold mb-3 w-fit">
                  {categoryLabels[featured.category] ?? featured.category}
                  {featured.year && ` · ${featured.year}`}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-[#c9a227] transition-colors">
                  {featured.title}
                </h3>
                {featured.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                    {featured.description}
                  </p>
                )}
                {featured.recipientNames && featured.recipientNames.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {featured.recipientNames.join(", ")}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ) : null}

        {rest.length > 0 && (
          <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rest.map((item) => (
              <Link
                key={item.id}
                to="/achievements/$slug"
                params={{ slug: item.slug }}
                className="group border bg-background overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="size-8 text-muted-foreground/30"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.172-1.756.96-1.756 1.94v3.03c0 .621.504 1.125 1.125 1.125h3.03c.98 0 1.768-.788 1.94-1.756M5.25 4.236A2.25 2.25 0 017.5 2.25h9a2.25 2.25 0 012.25 2.25c.343 1.32.467 2.688.35 4.047"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]">
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  <div className="text-sm font-semibold mt-1 group-hover:text-[#c9a227] transition-colors line-clamp-2">
                    {item.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
