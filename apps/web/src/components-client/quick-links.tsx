"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  IconSchool,
  IconBook,
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconStar,
  IconAward,
  IconBriefcase,
  IconHeart,
  IconArrowRight,
} from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ElementType> = {
  school: IconSchool,
  book: IconBook,
  trophy: IconTrophy,
  users: IconUsers,
  calendar: IconCalendar,
  star: IconStar,
  award: IconAward,
  briefcase: IconBriefcase,
  heart: IconHeart,
  "arrow-right": IconArrowRight,
};

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
      iconKey: s(`quicklink${i}_icon`),
    }))
    .filter((l) => l.text.trim().length > 0);

  const heading = s("quicklinks_heading");
  const ctaText = s("quicklinks_cta_text");
  const ctaUrl = s("quicklinks_cta_url") || "/about";

  if (links.length === 0 && !heading) return null;

  return (
    <section ref={sectionRef} className="bg-green-dark py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 lg:mb-14">
          <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-cream m-0">
            {heading}
          </h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {links.map((link) => (
              <a
                key={link.num}
                href={link.url || "#"}
                data-animate
                className="group bg-cream border-2 border-gold hover:bg-gold transition-colors duration-300 p-7 lg:p-8 flex flex-col justify-between min-h-[220px]"
              >
                <div className="flex items-start justify-between">
                  <div className="font-heading text-[56px] lg:text-[72px] text-gold group-hover:text-green-dark leading-none transition-colors duration-300">
                    {link.num}
                  </div>
                  {link.iconKey && iconMap[link.iconKey] && (
                    <div className="text-gold group-hover:text-green-dark transition-colors duration-300">
                      {React.createElement(iconMap[link.iconKey], { size: 28, stroke: 1.5 })}
                    </div>
                  )}
                </div>
                <div className="font-bold text-[17px] text-green-dark group-hover:text-green-dark mt-4">
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
