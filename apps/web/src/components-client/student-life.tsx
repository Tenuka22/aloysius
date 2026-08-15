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
  | { key: string; kind: "image"; bgClass: string; defaultRatio: number }
  | { key: string; kind: "text"; bgClass: string; defaultRatio: number };

const SLOTS: Slot[] = [
  { key: "sports", kind: "image", bgClass: "", defaultRatio: 16 / 9 },
  { key: "music", kind: "image", bgClass: "", defaultRatio: 3 / 4 },
  { key: "clubs", kind: "text", bgClass: "bg-green-dark text-cream", defaultRatio: 4 / 3 },
  { key: "houses", kind: "text", bgClass: "bg-red-brand text-cream", defaultRatio: 1 },
  { key: "scouts", kind: "image", bgClass: "", defaultRatio: 16 / 9 },
  { key: "faith", kind: "image", bgClass: "", defaultRatio: 3 / 4 },
  { key: "prefects", kind: "text", bgClass: "bg-gold text-green-dark", defaultRatio: 1 },
];

const SETTING_LABEL_KEYS: Record<string, string> = {
  sports: "life_sports_label",
  music: "life_music_label",
  clubs: "life_clubs_label",
  houses: "life_houses_label",
  scouts: "life_scouts_label",
  faith: "life_faith_label",
  prefects: "life_prefects_label",
};

function resolveAspectClass(imageUrl: string | null | undefined, defaultRatio: number): string {
  const fromUrl = getAspectRatio(imageUrl);
  return aspectRatioClass(fromUrl ?? defaultRatio) || "aspect-video";
}

function ImageTile({
  tile,
  label,
  bgClass,
  defaultRatio,
}: {
  tile: LifeTile;
  label: string;
  bgClass: string;
  defaultRatio: number;
}) {
  const aspect = resolveAspectClass(tile.image, defaultRatio);

  const inner = (
    <div className="group relative w-full overflow-hidden">
      {tile.image ? (
        <img
          src={tile.image}
          alt={label}
          className={`w-full ${aspect} object-cover transition-transform duration-500 group-hover:scale-105`}
        />
      ) : (
        <div className={`w-full ${aspect} ${bgClass || "bg-green-dark/10"}`} />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
      {label && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-5 py-3">
            {label}
          </div>
        </div>
      )}
    </div>
  );

  if (tile.href) {
    return (
      <a href={tile.href} data-tile className="block">
        {inner}
      </a>
    );
  }
  return (
    <div data-tile className="block">
      {inner}
    </div>
  );
}

function TextTile({
  label,
  bgClass,
  defaultRatio,
  href,
}: {
  label: string;
  bgClass: string;
  defaultRatio: number;
  href?: string;
}) {
  const aspect = aspectRatioClass(defaultRatio) || "aspect-video";

  const inner = (
    <div className="group relative w-full overflow-hidden">
      <div className={`w-full ${aspect} flex items-center justify-center ${bgClass}`}>
        <div className="p-5 text-center">
          <div className="font-extrabold text-[13px] sm:text-[15px] tracking-[0.08em] leading-snug">
            {label}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
        <div className="bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-5 py-3">
          {label}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} data-tile className="block">
        {inner}
      </a>
    );
  }
  return (
    <div data-tile className="block">
      {inner}
    </div>
  );
}

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
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const heading = s("life_heading");

  if (tiles.length === 0 && !heading) return null;

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        {heading && (
          <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-12 sm:mb-15">
            {heading}
          </h2>
        )}

        <div className="columns-[200px] sm:columns-[280px] lg:columns-[320px] gap-x-3 sm:gap-x-4">
          {SLOTS.map((slot) => {
            const tile = tiles.find((t) => t.id === slot.key);
            const settingLabelKey = SETTING_LABEL_KEYS[slot.key];
            const imageKey = `life_${slot.key}_image`;
            const fallbackImage = settings?.[imageKey] ?? null;
            const label = tile?.label || s(settingLabelKey);

            if (!label) return null;

            const resolvedTile = tile
              ? { ...tile, image: tile.image ?? fallbackImage }
              : { id: slot.key, label, image: fallbackImage };

            if (slot.kind === "image") {
              return (
                <div key={slot.key} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
                  <ImageTile
                    tile={resolvedTile}
                    label={label}
                    bgClass={slot.bgClass}
                    defaultRatio={slot.defaultRatio}
                  />
                </div>
              );
            }

            return (
              <div key={slot.key} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
                <TextTile
                  label={label}
                  bgClass={slot.bgClass}
                  defaultRatio={slot.defaultRatio}
                  href={resolvedTile.href}
                />
              </div>
            );
          })}

          {tiles.slice(SLOTS.length).map((tile) => (
            <div key={tile.id} className="break-inside-avoid mb-3 sm:mb-4 w-full inline-block">
              <ImageTile
                tile={tile}
                label={tile.label}
                bgClass=""
                defaultRatio={4 / 3}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
