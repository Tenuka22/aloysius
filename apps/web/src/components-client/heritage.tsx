"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

gsap.registerPlugin(ScrollTrigger);

function ArchivalImage({ src, className }: { src?: string; className?: string }) {
  const ratioClass = aspectRatioClass(getAspectRatio(src)) || "aspect-[4/3]";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`w-full ${ratioClass} object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5 ${className ?? ""}`}
    >
      <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
        ARCHIVE PHOTO
      </span>
    </div>
  );
}

export function Heritage({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] ?? "";

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

  const foundingYear = Number.parseInt(s("founding_year"), 10);
  const tradition =
    Number.isFinite(foundingYear) && foundingYear > 0
      ? new Date().getFullYear() - foundingYear
      : null;
  const headingLines = s("heritage_heading").split("\n");

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px] grid grid-cols-1 lg:grid-cols-[2px_minmax(0,1fr)_minmax(0,440px)] gap-10 lg:gap-14 items-start">
        <div
          data-animate
          className="hidden lg:block h-full min-h-[420px]"
          style={{ background: "linear-gradient(180deg, #FFB203, rgba(255,178,3,0.08))" }}
        />
        <div data-animate>
          {s("heritage_eyebrow") && (
            <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-5">
              {s("heritage_eyebrow")}
            </div>
          )}
          <h2 className="font-heading font-semibold text-green-dark text-4xl sm:text-5xl lg:text-[58px] leading-[1.05] mb-7">
            {headingLines.map((line: string, i: number) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          {s("heritage_intro") && (
            <p className="text-[16.5px] leading-[1.75] text-green-dark/80 max-w-[52ch] mb-4">
              {s("heritage_intro")}
            </p>
          )}
          {foundingYear > 0 && (
            <div className="flex gap-11 my-11">
              <div>
                <div className="font-heading text-4xl font-semibold text-green-dark">
                  Est.&nbsp;{foundingYear}
                </div>
                <div className="text-xs tracking-[0.14em] text-green-dark/60 mt-1">
                  {s("heritage_founded_label")}
                </div>
              </div>
              {tradition !== null && (
                <div>
                  <div className="font-heading text-4xl font-semibold text-green-dark">
                    {tradition}&nbsp;Years
                  </div>
                  <div className="text-xs tracking-[0.14em] text-green-dark/60 mt-1">
                    {s("heritage_tradition_label")}
                  </div>
                </div>
              )}
            </div>
          )}
          {s("heritage_cta_text") && (
            <a
              href={s("heritage_cta_url") || "/about"}
              className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5"
            >
              {s("heritage_cta_text")} <span>&rarr;</span>
            </a>
          )}
        </div>
        <div data-animate className="flex flex-col gap-4">
          <ArchivalImage src={settings?.heritage_image_1} className="h-[280px] sm:h-[320px]" />
          <ArchivalImage
            src={settings?.heritage_image_2}
            className="h-[170px] sm:h-[190px] w-3/4 self-end"
          />
        </div>
      </div>
    </section>
  );
}
