"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  IconSchool,
  IconUsers,
  IconTrophy,
  IconWorld,
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

const iconMap: Record<string, React.ComponentType<{ stroke?: number; size?: number | string; className?: string }>> = {
  heritage: IconSchool,
  students: IconUsers,
  activities: IconTrophy,
  global: IconWorld,
};

export function Stats({
  initialData,
}: {
  initialData?: { id: string; value: string; label: string; icon: string | null }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  const stats =
    initialData && initialData.length > 0
      ? initialData.map((s) => ({
          value: s.value,
          label: s.label,
          icon: s.icon ?? "heritage",
        }))
      : defaultStats;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-[#0a1f0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
      <div
        ref={ref}
        className="relative mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 py-16 px-4 sm:px-6 lg:px-8"
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center text-center gap-4 py-6 px-4 ${
              i < stats.length - 1 ? "lg:border-r border-white/10" : ""
            } ${i < stats.length - 2 || (i < stats.length - 1 && stats.length <= 5) ? "border-b lg:border-b-0 border-white/10" : ""}`}
          >
            <div className="text-[#c9a227]">
              {(() => {
                const Icon = iconMap[stat.icon] ?? IconSchool;
                return <Icon stroke={1.25} size={36} />;
              })()}
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-light text-[#c9a227] tracking-tight tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-2">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
