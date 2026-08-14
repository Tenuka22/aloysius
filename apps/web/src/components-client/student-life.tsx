"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { aspectRatioClass, getAspectRatio } from "@/lib/image-ratio";

gsap.registerPlugin(ScrollTrigger);

export type LifeTile = {
  id: string;
  label: string;
  image?: string | null;
  href?: string;
};

type Slot =
  | { key: "sports" | "music" | "scouts" | "faith"; kind: "image"; className: string }
  | { key: "clubs" | "houses" | "prefects"; kind: "text"; className: string; bgClass: string };

const SLOTS: Slot[] = [
  { key: "sports", kind: "image", className: "" },
  { key: "music", kind: "image", className: "" },
  {
    key: "clubs",
    kind: "text",
    className: "",
    bgClass: "bg-green-dark text-cream",
  },
  {
    key: "houses",
    kind: "text",
    className: "",
    bgClass: "bg-red-brand text-cream",
  },
  { key: "scouts", kind: "image", className: "" },
  { key: "faith", kind: "image", className: "" },
  {
    key: "prefects",
    kind: "text",
    className: "",
    bgClass: "bg-gold text-green-dark",
  },
];

function ImageTile({
  tile,
  className,
  labelFallback,
}: {
  tile: LifeTile;
  className: string;
  labelFallback: string;
}) {
  const label = tile.label || labelFallback;

  const inner = (
    <div className="relative w-full inline-block overflow-hidden rounded-xl">
      {tile.image ? (
        <img
          src={tile.image}
          alt={label}
          className={`w-full ${aspectRatioClass(getAspectRatio(tile.image)) || "aspect-video"} object-cover`}
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-green-dark/15 to-green-dark/5" />
      )}
      {label && (
        <div className="absolute left-4 sm:left-5 bottom-3 sm:bottom-4 bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-3 sm:px-4 py-1.5 sm:py-2 pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );

  if (tile.href) {
    return (
      <a href={tile.href} data-tile className={`block ${className}`}>
        {inner}
      </a>
    );
  }
  return (
    <div data-tile className={`block ${className}`}>
      {inner}
    </div>
  );
}

function TextTile({
  tile,
  className,
  bgClass,
  subtext,
}: {
  tile: LifeTile;
  className: string;
  bgClass: string;
  subtext?: string;
}) {
  const inner = (
    <div className={`flex w-full inline-block items-center justify-center text-center p-3 ${bgClass}`}>
      <div className="min-w-0">
        <div className="font-extrabold text-[13px] sm:text-[15px] tracking-[0.08em] leading-snug line-clamp-2">
          {tile.label}
        </div>
        {subtext && <div className="text-xs text-gold mt-1">{subtext}</div>}
      </div>
    </div>
  );

  if (tile.href) {
    return (
      <a href={tile.href} data-tile className={`block ${className}`}>
        {inner}
      </a>
    );
  }
  return (
    <div data-tile className={`block ${className}`}>
      {inner}
    </div>
  );
}

const SETTING_LABEL_KEYS: Record<string, string> = {
  sports: "life_sports_label",
  music: "life_music_label",
  clubs: "life_clubs_label",
  houses: "life_houses_label",
  scouts: "life_scouts_label",
  faith: "life_faith_label",
  prefects: "life_prefects_label",
};

export function StudentLife({
  settings,
  tiles = [],
}: {
  settings?: Record<string, string>;
  tiles?: LifeTile[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] ?? "";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-tile]"),
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        {s("life_eyebrow") && (
          <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
            {s("life_eyebrow")}
          </div>
        )}
        <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-12 sm:mb-15">
          {s("life_heading")}
        </h2>

        <div className="columns-[200px] sm:columns-[280px] lg:columns-[320px] gap-x-3 sm:gap-x-4">
          {SLOTS.map((slot, i) => {
            const tile = tiles[i];
            const settingLabelKey = SETTING_LABEL_KEYS[slot.key];

            if (slot.kind === "image") {
              const imageKey = `life_${slot.key}_image`;
              const fallbackImage = settings?.[imageKey] ?? null;
              const resolvedTile = tile
                ? { ...tile, image: tile.image ?? fallbackImage }
                : { id: slot.key, label: "", image: fallbackImage };
              return (
                <div key={slot.key} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
                  <ImageTile
                    tile={resolvedTile}
                    className={slot.className}
                    labelFallback={s(settingLabelKey)}
                  />
                </div>
              );
            }

            return (
              <div key={slot.key} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
                <TextTile
                  tile={tile ?? { id: slot.key, label: s(settingLabelKey) }}
                  className={slot.className}
                  bgClass={slot.bgClass}
                  subtext={slot.key === "clubs" ? s("life_clubs_subtext") : undefined}
                />
              </div>
            );
          })}

          {tiles.slice(SLOTS.length).map((tile) => (
            <div key={tile.id} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
              <ImageTile tile={tile} className="" labelFallback="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
