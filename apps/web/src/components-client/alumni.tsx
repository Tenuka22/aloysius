"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  alumni_quote: "The Aloysian Legacy Continues.",
  alumni_description:
    "A global network of Aloysians in leadership, service and scholarship - connected by the crest they carried.",
  alumni_cta1_text: "Old Boys' Association",
  alumni_cta1_url: "#",
  alumni_cta2_text: "Distinguished Aloysians",
  alumni_cta2_url: "#",
};

export function Alumni({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] || DEFAULTS[key] || "";

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

  const photo = settings?.alumni_photo;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#013405] text-[#FFF8E7] py-24 sm:py-32.5 px-4 sm:px-6 lg:px-12"
    >
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none opacity-[0.06] hidden lg:block"
        style={{ left: -100, top: "50%", transform: "translateY(-50%)", height: 520, width: "auto" }}
      />
      <div className="relative mx-auto max-w-270 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 lg:gap-20 items-center">
        <div data-animate>
          <div className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-5">
            OLD BOYS&rsquo; ASSOCIATION
          </div>
          <h2 className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] mb-6.5">
            &ldquo;{s("alumni_quote")}&rdquo;
          </h2>
          <p className="text-base leading-[1.75] text-[#FFF8E7]/75 max-w-[54ch] mb-10">
            {s("alumni_description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={s("alumni_cta1_url") || "#"}
              className="inline-flex items-center justify-center bg-[#FFB203] text-[#013405] font-extrabold text-sm px-7.5 py-3.5 hover:bg-[#FFD45A] transition-colors"
            >
              {s("alumni_cta1_text")}
            </a>
            <a
              href={s("alumni_cta2_url") || "#"}
              className="inline-flex items-center justify-center border border-[#FFF8E7]/50 text-[#FFF8E7] font-bold text-sm px-7.5 py-3.5 hover:border-[#FFB203] hover:text-[#FFB203] transition-colors"
            >
              {s("alumni_cta2_text")}
            </a>
          </div>
        </div>
        <div data-animate>
          {photo ? (
            <img src={photo} alt="" className="w-full h-[300px] sm:h-110 object-cover" />
          ) : (
            <div className="w-full h-[300px] sm:h-110 flex items-center justify-center bg-[#FFF8E7]/5">
              <span className="text-[11px] tracking-widest text-[#FFF8E7]/40 font-semibold">
                ARCHIVAL PHOTOGRAPH
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
