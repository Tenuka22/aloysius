"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

const DEFAULTS: Record<string, string> = {
  hero_badge: "Certa Viriliter",
  hero_title: "St. Aloysius'\nCollege",
  hero_tagline: "Tradition. Excellence. Leadership.",
  hero_cta1_text: "Explore the College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Admissions",
  hero_cta2_url: "/admissions",
};

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const s = (key: string) => settings?.[key] || DEFAULTS[key] || "";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4",
        )
        .fromTo(
          buttonsRef.current?.children ?? [],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleLines = s("hero_title").split("\n");
  const bgImage = settings?.hero_bg_image;

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#013405] overflow-hidden"
      style={{ height: "92vh", minHeight: 640 }}
    >
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(1,52,5,0.5) 0%, rgba(1,52,5,0.72) 60%, rgba(1,52,5,0.94) 100%)",
        }}
      />
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none opacity-[0.07]"
        style={{ right: -120, bottom: -160, height: 640, width: "auto" }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#FFF8E7] px-6">
        <div className="text-[11px] tracking-[0.5em] font-bold text-[#FFB203] mb-6">
          {s("hero_badge").toUpperCase()}
        </div>
        <h1
          ref={headingRef}
          className="font-['Cormorant_Garamond'] font-semibold leading-[1.02] m-0"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
        >
          {titleLines.map((line: string, i: number) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <div className="mt-4.5 text-[13px] tracking-[0.42em] font-semibold text-[#FFF8E7]/85">
          GALLE &bull; SRI LANKA
        </div>
        <div className="w-14 h-0.5 bg-[#FFB203] my-8.5" />
        <p
          ref={taglineRef}
          className="font-['Cormorant_Garamond'] italic text-[26px] m-0 text-[#FFF8E7]/95"
        >
          {s("hero_tagline")}
        </p>
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 mt-11">
          <a
            href={s("hero_cta1_url") || "/about"}
            className="inline-flex items-center justify-center bg-[#FFB203] text-[#013405] font-extrabold text-sm tracking-wider px-8.5 py-3.75 hover:bg-[#FFD45A] transition-colors"
          >
            {s("hero_cta1_text") || "Explore the College"}
          </a>
          <a
            href={s("hero_cta2_url") || "/admissions"}
            className="inline-flex items-center justify-center border border-[#FFF8E7]/60 text-[#FFF8E7] font-bold text-sm tracking-wider px-8.5 py-3.75 hover:border-[#FFB203] hover:text-[#FFB203] transition-colors"
          >
            {s("hero_cta2_text") || "Admissions"}
          </a>
        </div>
      </div>

      <div className="absolute bottom-6.5 left-1/2 -translate-x-1/2 text-[#FFF8E7]/60 text-[10px] tracking-[0.3em] pointer-events-none">
        SCROLL
      </div>
    </section>
  );
}
