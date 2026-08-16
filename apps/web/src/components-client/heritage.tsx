"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MediaImage } from "@/components-client/media-image";

gsap.registerPlugin(ScrollTrigger);

function ArchivalPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-green-dark/[0.07] to-green-dark/[0.02] ${className ?? ""}`}
    >
      <span className="text-[11px] tracking-[0.18em] text-green-dark/50 font-semibold">
        ARCHIVE PHOTO
      </span>
    </div>
  );
}

function ArchivalImage({ src, alt, className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <MediaImage
      src={src}
      alt={alt ?? ""}
      className={`w-full object-cover ${className ?? ""}`}
      fallback={<ArchivalPlaceholder className={className} />}
    />
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
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
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
  const bannerSrc = settings?.heritage_image_2;
  const portraitSrc = settings?.heritage_image_1;

  return (
    <section
      ref={sectionRef}
      className="relative bg-cream py-24 sm:py-32 px-4 sm:px-6 lg:px-12 overflow-hidden"
    >
      {foundingYear > 0 && (
        <div
          className="pointer-events-none absolute -left-2 lg:left-8 top-1/2 -translate-y-1/2 font-heading text-[150px] lg:text-[260px] font-bold text-green-dark/[0.04] leading-none select-none"
          aria-hidden="true"
        >
          {foundingYear}
        </div>
      )}

      <div className="relative mx-auto max-w-[1180px] grid grid-cols-1 lg:grid-cols-[2px_minmax(0,1fr)_minmax(0,400px)] gap-10 lg:gap-14 items-start">
        <div
          data-animate
          className="hidden lg:block h-full min-h-[420px]"
          style={{ background: "linear-gradient(180deg, var(--gold) 0%, color-mix(in oklab, var(--gold) 6%, transparent) 100%)" }}
        />
        <div data-animate className="flex flex-col gap-8">
          <div>
            <h2 className="font-heading font-semibold text-green-dark text-4xl sm:text-5xl lg:text-[58px] leading-[1.05] mb-5">
              {headingLines.map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
            <div className="w-10 h-1 bg-gold" />
          </div>

          {s("heritage_intro") && (
            <p className="text-[15px] sm:text-base text-green-dark/75 leading-relaxed max-w-[62ch]">
              {s("heritage_intro")}
            </p>
          )}

          {bannerSrc && (
            <ArchivalImage
              src={bannerSrc}
              className="aspect-[16/9] shadow-xl shadow-green-dark/10"
            />
          )}

          {foundingYear > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
              <div>
                <div className="font-heading text-4xl font-semibold text-green-dark tracking-tight">
                  Est.&nbsp;{foundingYear}
                </div>
                <div className="text-[11px] tracking-[0.16em] text-green-dark/55 mt-1 font-semibold">
                  {s("heritage_founded_label")}
                </div>
              </div>
              {tradition !== null && (
                <div>
                  <div className="font-heading text-4xl font-semibold text-green-dark tracking-tight">
                    {tradition}&nbsp;Years
                  </div>
                  <div className="text-[11px] tracking-[0.16em] text-green-dark/55 mt-1 font-semibold">
                    {s("heritage_tradition_label")}
                  </div>
                </div>
              )}
            </div>
          )}

          {s("heritage_cta_text") && (
            <a
              href={s("heritage_cta_url") || "/about"}
              className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 hover:text-green-darker transition-colors"
            >
              {s("heritage_cta_text")} <span aria-hidden="true">&rarr;</span>
            </a>
          )}
        </div>
        <div data-animate>
          <div className="relative">
            <ArchivalImage
              src={portraitSrc}
              className="aspect-[4/5] shadow-xl shadow-green-dark/10"
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 border-b-2 border-r-2 border-gold"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
