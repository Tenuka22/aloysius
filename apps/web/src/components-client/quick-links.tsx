"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function QuickLinks({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] ?? "";

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
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const links = [1, 2, 3, 4]
    .map((i) => ({
      num: `0${i}`,
      text: s(`quicklink${i}_text`),
      url: s(`quicklink${i}_url`),
    }))
    .filter((l) => l.text.trim().length > 0);

  const heading = s("quicklinks_heading");
  const eyebrow = s("quicklinks_eyebrow");
  const ctaText = s("quicklinks_cta_text");
  const ctaUrl = s("quicklinks_cta_url") || "/about";

  if (links.length === 0 && !heading) return null;

  return (
    <section ref={sectionRef} className="bg-cream py-20 sm:py-24 px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            {eyebrow && (
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                {eyebrow}
              </div>
            )}
            {heading && (
              <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
                {heading}
              </h2>
            )}
          </div>
          {ctaText && (
            <a
              href={ctaUrl}
              className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
            >
              {ctaText} &rarr;
            </a>
          )}
        </div>

        {links.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-gold/20"
            style={{ background: "rgba(255,178,3,0.2)" }}
          >
            {links.map((link) => (
              <a
                key={link.num}
                href={link.url || "#"}
                data-animate
                className="group bg-white hover:bg-gold/10 transition-colors px-7 py-9 flex flex-col justify-between min-h-[170px]"
              >
                <div className="font-heading text-[38px] text-gold font-semibold">
                  {link.num}
                </div>
                <div className="font-bold text-[17px] text-green-dark mt-3.5 group-hover:underline">
                  {link.text}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
