"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const s = (key: string) => settings?.[key] ?? "";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 })
        .fromTo(ruleRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, "-=0.5")
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.35",
        )
        .fromTo(
          buttonsRef.current?.children ?? [],
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
          "-=0.4",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleLines = s("hero_title").split("\n");
  const bgImage = settings?.hero_bg_image;

  return (
    <section
      ref={sectionRef}
      className="relative bg-green-dark overflow-hidden"
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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-cream px-6">
        <div className="text-[11px] tracking-[0.28em] font-bold text-gold mb-5">ESTD. 1862</div>
        <h1
          ref={headingRef}
          className="font-heading font-semibold leading-[1.02] m-0"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
        >
          {titleLines.map((line: string, i: number) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {s("hero_location_line") && (
          <div className="mt-4 text-[13px] tracking-[0.22em] font-semibold text-cream/85">
            {s("hero_location_line")}
          </div>
        )}
        <div ref={ruleRef} className="w-14 h-0.5 bg-gold my-8 origin-center" />
        {s("hero_tagline") && (
          <p
            ref={taglineRef}
            className="font-heading italic text-[26px] m-0 text-cream/95 max-w-[65ch]"
          >
            {s("hero_tagline")}
          </p>
        )}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 mt-11">
          {s("hero_cta1_text") && (
            <a
              href={s("hero_cta1_url") || "/about"}
              className="inline-flex items-center justify-center bg-gold text-green-dark font-extrabold text-sm tracking-wider px-[2.25rem] py-[0.9375rem] hover:bg-gold-light transition-colors shadow-lg shadow-green-dark/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-green-dark"
            >
              {s("hero_cta1_text")}
            </a>
          )}
          {s("hero_cta2_text") && (
            <a
              href={s("hero_cta2_url") || "/admissions"}
              className="inline-flex items-center justify-center border border-cream/60 text-cream font-bold text-sm tracking-wider px-[2.25rem] py-[0.9375rem] hover:border-gold hover:text-gold transition-colors shadow-md shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-green-dark"
            >
              {s("hero_cta2_text")}
            </a>
          )}
        </div>
      </div>

      {s("hero_scroll_text") && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/60 text-[10px] tracking-[0.2em] pointer-events-none">
          {s("hero_scroll_text")}
        </div>
      )}
    </section>
  );
}
