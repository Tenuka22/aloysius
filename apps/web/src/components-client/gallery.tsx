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

export function Gallery({
  initialData,
  settings,
}: {
  initialData?: GalleryRow[];
  settings?: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const items = (initialData ?? []).slice(0, 6);
  const heading = settings?.gallery_heading || "Gallery";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
      gsap.fromTo(
        gridRef.current?.children ?? [],
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 90%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [items.length]);

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-295">
        <div data-animate className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
              MEDIA
            </div>
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              {heading}
            </h2>
          </div>
          <a
            href="/gallery"
            className="font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 whitespace-nowrap"
          >
            Full Gallery &rarr;
          </a>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-green-dark/50 py-12">No gallery albums published yet.</div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-4 auto-rows-32.5 sm:auto-rows-37.5 gap-3.5">
            {items.map((item, i) => (
              <div
                key={item.id}
                className={`relative overflow-hidden ${i === 0 || i === 2 ? "row-span-2" : ""}`}
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title || "Gallery image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-dark/10 to-green-dark/5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
