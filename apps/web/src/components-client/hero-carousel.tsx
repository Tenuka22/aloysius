"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@aloysius-web/ui/components/carousel"
import Autoplay from "embla-carousel-autoplay"
import { cn } from "@aloysius-web/ui/lib/utils"

type HeroCarouselItem = {
  id: string
  title: string
  excerpt?: string | null
  coverImage?: string | null
  category?: string
  tags?: string[]
  source: "news" | "events" | "student-works" | "achievements" | "gallery" | "announcements"
}

const sourceConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  news: { label: "News", gradient: "from-blue-600/90 to-blue-800/90", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  events: { label: "Event", gradient: "from-emerald-600/90 to-emerald-800/90", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  "student-works": { label: "Student Work", gradient: "from-violet-600/90 to-violet-800/90", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  achievements: { label: "Achievement", gradient: "from-amber-600/90 to-amber-800/90", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  gallery: { label: "Gallery", gradient: "from-pink-600/90 to-pink-800/90", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  announcements: { label: "Announcement", gradient: "from-rose-600/90 to-rose-800/90", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
}

export function HeroCarousel({ items }: { items: HeroCarouselItem[] }) {
  if (!items.length) return null

  return (
    <div className="max-w-6xl mx-auto">
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {items.slice(0, 8).map((item) => {
            const config = sourceConfig[item.source] ?? sourceConfig.news
            return (
              <CarouselItem key={item.id} className="pl-3 md:basis-1/2 lg:basis-1/4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      draggable={false}
                    />
                  ) : (
                    <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", config.gradient)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-12 text-white/30">
                        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                      </svg>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/80 mb-2">
                      {config.label}
                    </span>
                    <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-white/60 text-xs mt-1 line-clamp-1">{item.excerpt}</p>
                    )}
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
