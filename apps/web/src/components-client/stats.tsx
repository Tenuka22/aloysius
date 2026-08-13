"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  IconSchool,
  IconUsers,
  IconTrophy,
  IconWorld,
  IconHeart,
  IconStar,
  IconAward,
  IconBook,
} from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

const defaultStats = [
  {
    value: `${Math.floor(new Date().getFullYear() - 1862)}+`,
    label: "Years of Excellence",
    icon: "heritage",
  },
  { value: "4500+", label: "Students", icon: "students" },
  { value: "100+", label: "Co-Curricular Activities", icon: "activities" },
  { value: "20+", label: "Global Partnerships", icon: "global" },
];

const iconMap: Record<
  string,
  React.ComponentType<{ stroke?: number; size?: number | string; className?: string }>
> = {
  heritage: IconSchool,
  students: IconUsers,
  activities: IconTrophy,
  global: IconWorld,
  heart: IconHeart,
  star: IconStar,
  award: IconAward,
  book: IconBook,
  school: IconSchool,
  trophy: IconTrophy,
  world: IconWorld,
};

function parseNumericValue(value: string): { num: number; suffix: string } | null {
  const match = value.match(/^([\d,]+)/);
  if (!match) return null;
  const numStr = match[1].replace(/,/g, "");
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return null;
  const suffix = value.slice(match[1].length);
  return { num, suffix };
}

function AnimatedValue({ value, shouldAnimate }: { value: string; shouldAnimate: boolean }) {
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? "0" : value);
  const animated = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || animated.current) return;

    const parsed = parseNumericValue(value);
    if (!parsed) {
      setDisplayValue(value);
      return;
    }

    animated.current = true;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: parsed.num,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => {
        const current = Math.round(obj.val);
        setDisplayValue(current.toLocaleString() + parsed.suffix);
      },
    });
  }, [shouldAnimate, value]);

  return <>{displayValue}</>;
}

export function Stats({
  initialData,
}: {
  initialData?: { id: string; value: string; label: string; icon: string | null }[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const stats =
    initialData && initialData.length > 0
      ? initialData.map((s) => ({
          value: s.value,
          label: s.label,
          icon: s.icon ?? "heritage",
        }))
      : defaultStats;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-stat]"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
            onEnter: () => setHasAnimated(true),
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-muted/30 relative overflow-hidden border-y border-border"
    >
      <div className="relative mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-0 py-16 px-4 sm:px-6 lg:px-8 justify-center">
        {stats.map((stat, i) => {
          const iconKey = stat.icon?.toLowerCase() ?? "school";
          const Icon = iconMap[iconKey] ?? IconSchool;

          return (
            <div
              key={stat.label}
              data-stat
              className={`flex flex-col items-center justify-center text-center gap-4 py-6 px-4 ${
                i < 2 ? "border-b lg:border-b-0 border-border" : ""
              } ${i < stats.length - 1 ? "lg:border-r border-border" : ""}`}
            >
              <div className="text-[#c9a227]">
                <Icon stroke={1.25} size={36} />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-light text-[#c9a227] tracking-tight tabular-nums">
                  <AnimatedValue value={stat.value} shouldAnimate={hasAnimated} />
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
