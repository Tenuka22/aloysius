import { Panel, PanelHead } from "@aloysius/ui/components/cms/cms-primitives";
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: space.md,
    [md]: {
      gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
    },
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: space["2xs"],
  },
  label: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  value: {
    margin: 0,
    fontSize: font.size3xl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
});

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(orpc.staff.listStaff.queryOptions());
  },
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <Suspense fallback="Loading dashboard">
        <DashboardPage />
      </Suspense>
    </div>
  ),
});

const DashboardPage = () => {
  const { data: staff } = useSuspenseQuery(orpc.staff.listStaff.queryOptions());

  const withEmail = staff.filter((row) => row.email).length;
  const withPortrait = staff.filter((row) => row.portraitFileId).length;

  return (
    <div {...stylex.props(styles.grid)}>
      <Panel>
        <PanelHead title="Total staff" />
        <div {...stylex.props(styles.statCard)}>
          <p {...stylex.props(styles.value)}>{staff.length}</p>
        </div>
      </Panel>
      <Panel>
        <PanelHead title="With email on file" />
        <div {...stylex.props(styles.statCard)}>
          <p {...stylex.props(styles.value)}>{withEmail}</p>
        </div>
      </Panel>
      <Panel>
        <PanelHead title="With a portrait" />
        <div {...stylex.props(styles.statCard)}>
          <p {...stylex.props(styles.value)}>{withPortrait}</p>
        </div>
      </Panel>
    </div>
  );
};
