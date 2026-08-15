"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string | null;
  slug?: string;
}

export function Gallery({
  initialImages,
  settings,
}: {
  initialImages?: GalleryImage[];
  settings?: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const items = (initialImages ?? []).slice(0, 20);
  const s = (key: string) => settings?.[key] ?? "";
  const heading = s("gallery_heading");

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
          stagger: 0.04,
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
        <div
          data-animate
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
        >
          <div>
            {s("gallery_eyebrow") && (
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                {s("gallery_eyebrow")}
              </div>
            )}
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              {heading}
            </h2>
          </div>
          {s("gallery_cta_text") && (
            <a
              href={s("gallery_cta_url") || "/gallery"}
              className="font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 whitespace-nowrap"
            >
              {s("gallery_cta_text")} &rarr;
            </a>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center text-green-dark/50 py-12">
            No gallery images published yet.
          </div>
        ) : (
          <div ref={gridRef} className="columns-[320px] gap-4">
            {items.map((item) => (
              <div key={item.id} className="mb-4 break-inside-avoid overflow-hidden">
                {item.slug ? (
                  <a href={`/gallery/${item.slug}`} className="block">
                    <img
                      src={item.url}
                      alt={item.caption || "Gallery image"}
                      loading="lazy"
                      className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || "Gallery image"}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
