"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GalleryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  authorName: string | null;
  authorType: string | null;
  tags: string[] | null;
}

export function Gallery({ initialData }: { initialData?: GalleryRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const items = initialData ?? [];

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

      gsap.fromTo(
        ref.current?.children ?? [],
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
              Moments
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">Gallery</h2>
          </div>
          <a
            href="/gallery"
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

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
              No gallery albums published yet.
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={item.id}
                className={`group overflow-hidden bg-muted cursor-pointer hover:shadow-lg transition-all duration-300 ${
                  i === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <div
                  className={`bg-muted overflow-hidden ${i === 0 ? "aspect-[4/3]" : "aspect-video"}`}
                >
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
                        className="size-10 text-muted-foreground/30"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`${i === 0 ? "p-5" : "p-3"}`}>
                  <div
                    className={`font-semibold group-hover:text-[#c9a227] transition-colors ${i === 0 ? "text-lg" : "text-sm"}`}
                  >
                    {item.title}
                  </div>
                  {i === 0 && item.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                  {item.authorName && (
                    <div className="text-xs text-muted-foreground mt-1">by {item.authorName}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
