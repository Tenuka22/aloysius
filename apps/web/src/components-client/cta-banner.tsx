"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  cta_title: "Be part of a legacy.\nBuild your future.",
  cta_subtitle: "Join a community where values meet vision, and every student shines.",
  cta_button_text: "Apply Now",
  cta_button_url: "#",
};

export function CTABanner({ settings }: { settings?: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);

  const s = (key: string) => settings?.[key] || DEFAULTS[key] || "";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const titleLines = s("cta_title").split("\n");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12">
      <div
        ref={ref}
        className="mx-auto max-w-5xl border bg-muted/30 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-light mb-2">
            {titleLines.map((line: string, i: number) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-muted-foreground mb-4">{s("cta_subtitle")}</p>
          <a
            href={s("cta_button_url") || "#"}
            className="inline-flex h-10 items-center bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {s("cta_button_text") || "Apply Now"}
          </a>
        </div>
      </div>
    </section>
  );
}
