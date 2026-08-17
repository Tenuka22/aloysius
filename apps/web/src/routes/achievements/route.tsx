"use client";

import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";

const CATEGORIES = [
  { key: "ALL", label: "All Achievements" },
  { key: "academic", label: "Academic" },
  { key: "sports", label: "Sports" },
  { key: "arts", label: "Arts" },
  { key: "clubs", label: "Clubs" },
  { key: "community", label: "Community" },
  { key: "other", label: "Other" },
];

const categoryLabel = Object.fromEntries(
  CATEGORIES.filter((c) => c.key !== "ALL").map((c) => [c.key, c.label]),
);

export const Route = createFileRoute("/achievements")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      orpc.achievements.list.queryOptions({
        input: { page: 1, pageSize: 50, status: "published" },
      }),
    );
  },
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data } = useSuspenseQuery(
    orpc.achievements.list.queryOptions({
      input: { page: 1, pageSize: 50, status: "published" },
    }),
  );
  const [activeCat, setActiveCat] = useState("ALL");

  const items = data?.rows ?? [];

  const filtered = useMemo(
    () =>
      activeCat === "ALL" ? items : items.filter((item) => item.category === activeCat),
    [items, activeCat],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const selectCategory = (key: string) => setActiveCat(key);

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:border focus:border-[#FFB203] focus:bg-[#013405] focus:px-4 focus:py-2 focus:text-sm focus:text-[#FFB203] focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="bg-[#013405] text-[#FFF8E7] pt-20 pb-16 sm:pt-24 sm:pb-19 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div className="text-xs tracking-[0.2em] text-[#FFF8E7]/60 mb-6.5">
              <Link to="/" className="hover:text-[#FFB203] transition-colors">
                HOME
              </Link>
              &nbsp;/&nbsp;<span className="text-[#FFB203]">ACHIEVEMENTS</span>
            </div>
            <div className="flex items-center gap-4.5 mb-6.5">
              <span className="h-px w-12 bg-[#FFB203]/50 shrink-0" />
              <span className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203]">
                HALL OF FAME
              </span>
            </div>
            <h1 className="font-heading font-semibold text-5xl sm:text-6xl lg:text-[72px] leading-[1.02] m-0">
              Our Achievements
            </h1>
            <p className="text-[15px] sm:text-base text-[#FFF8E7]/65 mt-6 max-w-[62ch]">
              Celebrating excellence in academics, sports, the arts and service to the community —
              earned by Aloysians, year after year.
            </p>
            <div className="flex gap-3 flex-wrap mt-11">
              {CATEGORIES.map((cat) => {
                const active = cat.key === activeCat;
                return (
                  <button
                    key={cat.key}
                    onClick={() => selectCategory(cat.key)}
                    className="text-xs font-bold tracking-widest px-4.5 py-2.25 transition-colors"
                    style={{
                      border: `1px solid ${active ? "#FFB203" : "rgba(255,178,3,0.4)"}`,
                      background: active ? "#FFB203" : "transparent",
                      color: active ? "#013405" : "#FFB203",
                    }}
                  >
                    {cat.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section className="bg-[#FFF8E7] py-24 px-4 sm:px-6 lg:px-12">
            <div className="mx-auto max-w-295 text-center text-[#013405]/50">
              No achievements published in this category yet.
            </div>
          </section>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <section className="bg-[#FFF8E7] pt-16 sm:pt-22.5 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-12">
                <div className="mx-auto max-w-295">
                  <Link
                    to="/achievements/$slug"
                    params={{ slug: featured.slug }}
                    className="group grid grid-cols-1 lg:grid-cols-2 border-2 border-[#FFB203] bg-[#fffdf6]"
                  >
                    <div className="relative w-full overflow-hidden">
                      {featured.coverImage ? (
                        <img
                          src={featured.coverImage}
                          alt={featured.title}
                          className="w-full aspect-video lg:aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full aspect-video lg:aspect-[4/3] bg-gradient-to-br from-[#013405]/10 to-[#013405]/5" />
                      )}
                    </div>
                    <div className="p-8 lg:p-11 flex flex-col justify-center">
                      <div className="flex items-center gap-3.5 mb-5">
                        <span className="text-[11px] tracking-[0.16em] font-bold text-[#A51919] uppercase">
                          {categoryLabel[featured.category] ?? featured.category}
                        </span>
                        {featured.year && (
                          <span className="text-[11px] tracking-[0.14em] font-bold text-[#013405]/45">
                            {featured.year}
                          </span>
                        )}
                      </div>
                      <div className="font-heading text-3xl sm:text-[38px] font-semibold leading-tight text-[#013405]">
                        {featured.title}
                      </div>
                      {featured.description && (
                        <p className="text-[15px] text-[#013405]/65 leading-relaxed mt-4 line-clamp-3">
                          {featured.description}
                        </p>
                      )}
                      {(featured.recipientNames?.length ?? 0) > 0 && (
                        <div className="text-[13px] text-[#013405]/50 mt-6">
                          {featured.recipientNames!.join(", ")}
                        </div>
                      )}
                      <div className="inline-flex items-center gap-2.5 font-bold text-sm text-[#013405] border-b-2 border-[#FFB203] pb-1.5 mt-8 w-fit group-hover:text-[#FFB203] transition-colors">
                        Read the Story <span>&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <section className="bg-[#fffdf6] border-t border-[#013405]/[0.08] pt-14 sm:pt-18 pb-22.5 px-4 sm:px-6 lg:px-12">
                <div className="mx-auto max-w-295">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 gap-x-8">
                    {rest.map((item) => (
                      <Link
                        key={item.id}
                        to="/achievements/$slug"
                        params={{ slug: item.slug }}
                        className="group block"
                      >
                        <div className="relative overflow-hidden">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#013405]/10 to-[#013405]/5" />
                          )}
                          {item.year && (
                            <span className="absolute top-0 left-0 bg-[#FFB203] px-3 py-1.5 text-[11px] tracking-[0.14em] font-bold text-[#013405]">
                              {item.year}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3.5 text-[10.5px] tracking-[0.14em] font-bold mt-5 mb-3">
                          <span className="text-[#A51919] uppercase">
                            {categoryLabel[item.category] ?? item.category}
                          </span>
                          {(item.recipientNames?.length ?? 0) > 0 && (
                            <span className="text-[#013405]/45 truncate">
                              {item.recipientNames!.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="font-heading text-2xl font-semibold leading-tight text-[#013405] group-hover:underline decoration-[#FFB203] decoration-2 underline-offset-4">
                          {item.title}
                        </div>
                        {item.description && (
                          <p className="text-[13.5px] text-[#013405]/60 leading-relaxed mt-2.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}