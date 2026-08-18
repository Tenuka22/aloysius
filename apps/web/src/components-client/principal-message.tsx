"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MediaImage } from "@/components-client/media-image";

gsap.registerPlugin(ScrollTrigger);

type Principal = {
  slug: string | null;
  name: string;
  title: string | null;
  quote: string | null;
  message: string | null;
  portrait: string | null;
} | null;

export function PrincipalMessage({
  settings,
  principal,
}: {
  settings?: Record<string, string>;
  principal?: Principal;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] ?? "";

  const displayName = principal?.name || s("principal_name");
  const displayQuote = principal?.quote || s("principal_quote");
  const photo = principal?.portrait || settings?.principal_photo;
  const titleLine = (principal?.title ?? s("principal_title")).trim();
  const schoolLine = s("school_name").trim();

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

  if (!displayName && !displayQuote && !photo) return null;

  return (
    <section
      ref={sectionRef}
      className="relative bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-32 px-4 sm:px-6 lg:px-12 overflow-hidden"
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-[180px] sm:text-[280px] font-bold text-green-dark/[0.03] leading-none select-none"
        aria-hidden="true"
      >
        &ldquo;
      </div>

      <div className="relative mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 lg:gap-[72px] items-center">
        <div data-animate className="relative max-w-[340px] mx-auto lg:mx-0 w-full">
          <div className="absolute -right-3.5 -bottom-3.5 w-full h-full border border-gold -z-10 pointer-events-none" />
          <MediaImage
            src={photo}
            alt={displayName}
            className="w-full aspect-[3/4] object-cover shadow-xl shadow-green-dark/10"
            fallback={
              <div className="w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-green-dark/[0.07] to-green-dark/[0.02]">
                <span className="text-[11px] tracking-[0.18em] text-green-dark/50 font-semibold">
                  PRINCIPAL PORTRAIT
                </span>
              </div>
            }
          />
        </div>
        <div data-animate>
          {displayQuote && (
            <blockquote className="relative">
              <p className="font-heading text-2xl sm:text-[32px] leading-[1.3] font-medium text-green-dark mb-6">
                &ldquo;{displayQuote}&rdquo;
              </p>
              <div className="w-10 h-1 bg-gold" />
            </blockquote>
          )}
          {displayName && (
            <div className="font-heading italic text-[28px] text-green-dark/55 mt-7">
              &mdash; {displayName}
            </div>
          )}
          {(titleLine || schoolLine) && (
            <div className="text-[11px] tracking-[0.18em] text-green-dark/55 mt-2.5 font-semibold">
              {[titleLine, schoolLine]
                .filter(Boolean)
                .map((part) => part.toUpperCase())
                .join(" \u2022 ")}
            </div>
          )}
          {s("principal_cta_text") && (
            <a
              href={
                principal?.slug
                  ? `/principals/${principal.slug}`
                  : s("principal_cta_url") || "/principals"
              }
              className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 mt-8 hover:text-green-darker transition-colors"
            >
              {s("principal_cta_text")} <span aria-hidden="true">&rarr;</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
