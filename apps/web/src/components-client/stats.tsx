"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

function StatIcon({ icon }: { icon: string }) {
  if (icon === "heritage") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
      </svg>
    );
  }
  if (icon === "students") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
        />
      </svg>
    );
  }
  if (icon === "activities") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

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
    <section className="border-y border-border/50 bg-[#0a1f0a]">
      <div
        ref={ref}
        className="mx-auto max-w-6xl flex flex-wrap justify-center gap-x-12 gap-y-8 py-12 px-4 sm:px-6 lg:px-8"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4">
            <div className="size-11 bg-white/5 border border-white/10 flex items-center justify-center text-[#c9a227]">
              <StatIcon icon={stat.icon} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
