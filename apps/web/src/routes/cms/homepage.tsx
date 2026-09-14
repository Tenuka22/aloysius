import {
  HomepageEditor,
  HomepageEditorActions,
} from "@aloysius/ui/components/cms/homepage-editor";
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
  screenHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space.md,
  },
  headingWrap: {
    minWidth: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    textWrap: "balance",
  },
  note: {
    margin: 0,
    marginBlockStart: space["3xs"],
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

// oRPC dynamic link for cache invalidation will be added here.
// See: https://orpc.dev/docs/client/dynamic-link

const HomepageContent = () => {
  const { data: homepage } = useSuspenseQuery(
    orpc.cms.getHomepage.queryOptions()
  );

  // homepage is null when no backend data exists yet — the editor falls back
  // to the seed data in the UI package.
  return <HomepageEditor initialBlocks={homepage?.blocks} />;
};

export const Route = createFileRoute("/cms/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <div {...stylex.props(styles.screenHead)}>
        <div {...stylex.props(styles.headingWrap)}>
          <p {...stylex.props(styles.eyebrow)}>Pages / Homepage</p>
          <h1 {...stylex.props(styles.heading)}>Homepage Editor</h1>
          <p {...stylex.props(styles.note)}>
            Edit the sections that make up the public homepage.
          </p>
        </div>
        <HomepageEditorActions />
      </div>
      <Suspense fallback={<div>Loading homepage…</div>}>
        <HomepageContent />
      </Suspense>
    </div>
  ),
});
