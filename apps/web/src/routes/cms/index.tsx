import { Dashboard } from "@aloysius/ui/components/cms/dashboard";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { orpc } from "@/utils/orpc";

const md = "@media (min-width: 40rem)";

const styles = stylex.create({
  wrap: {
    paddingBlockStart: space.md,
    paddingBlockEnd: space.md,
    paddingInlineStart: space.md,
    paddingInlineEnd: space.md,
    [md]: {
      paddingBlockStart: space.lg,
      paddingBlockEnd: space.lg,
      paddingInlineStart: space.lg,
      paddingInlineEnd: space.lg,
    },
  },
  heading: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.size2xl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
});

const DashboardContent = () => {
  /*
   * Real counts, from `cms.dashboardStats`. This screen used to import three
   * constant arrays of invented figures and render them as though they were
   * measured; every tile, queue entry and health row is now a `count()` against
   * the table it describes.
   */
  const { data: stats } = useSuspenseQuery(
    orpc.cms.dashboardStats.queryOptions()
  );

  return (
    <div {...stylex.props(styles.wrap)}>
      <h1 {...stylex.props(styles.heading)}>Dashboard</h1>
      <Dashboard
        health={stats.health}
        pendingItems={stats.pendingItems}
        tiles={stats.tiles}
      />
    </div>
  );
};

export const Route = createFileRoute("/cms/")({
  head: () => ({
    meta: [
      { title: "CMS Dashboard — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <DashboardContent />
    </Suspense>
  ),
});
