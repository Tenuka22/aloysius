"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  founding_year: "1862",
  heritage_intro:
    "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline, and the pursuit of excellence.",
};

function ArchivalImage({ src, className }: { src?: string; className?: string }) {
  if (src) {
    return <img src={src} alt="" className={`w-full h-full object-cover ${className ?? ""}`} />;
  }
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#013405]/10 to-[#013405]/5 ${className ?? ""}`}
    >
      <span className="text-[11px] tracking-widest text-[#013405]/40 font-semibold">
        ARCHIVE PHOTO
      </span>
    </div>
  );
}

export function Heritage({ settings }: { settings?: Record<string, string> }) {
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

  const foundingYear = Number.parseInt(s("founding_year"), 10) || 1862;
  const tradition = new Date().getFullYear() - foundingYear;

  return (
    <section ref={sectionRef} className="bg-[#FFF8E7] py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px] grid grid-cols-1 lg:grid-cols-[2px_minmax(0,1fr)_minmax(0,440px)] gap-10 lg:gap-14 items-start">
        <div
          data-animate
          className="hidden lg:block h-full min-h-[420px]"
          style={{ background: "linear-gradient(180deg, #FFB203, rgba(255,178,3,0.08))" }}
        />
        <div data-animate>
          <div className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-5">
            OUR HERITAGE
          </div>
          <h2 className="font-['Cormorant_Garamond'] font-semibold text-[#013405] text-4xl sm:text-5xl lg:text-[58px] leading-[1.05] mb-7">
            A Legacy of
            <br />
            Excellence
          </h2>
          <p className="text-[16.5px] leading-[1.75] text-[#013405]/80 max-w-[52ch] mb-4">
            {s("heritage_intro")}
          </p>
          <div className="flex gap-11 my-11">
            <div>
              <div className="font-['Cormorant_Garamond'] text-4xl font-semibold text-[#013405]">
                Est.&nbsp;{foundingYear}
              </div>
              <div className="text-xs tracking-[0.14em] text-[#013405]/60 mt-1">
                FOUNDED IN GALLE
              </div>
            </div>
            <div>
              <div className="font-['Cormorant_Garamond'] text-4xl font-semibold text-[#013405]">
                {tradition}&nbsp;Years
              </div>
              <div className="text-xs tracking-[0.14em] text-[#013405]/60 mt-1">
                OF ALOYSIAN TRADITION
              </div>
            </div>
          </div>
          <a
            href="/about"
            className="inline-flex items-center gap-2.5 font-bold text-sm text-[#013405] border-b-2 border-[#FFB203] pb-1.5"
          >
            Explore Our History <span>&rarr;</span>
          </a>
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
