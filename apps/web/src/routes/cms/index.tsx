import { Dashboard } from "@aloysius/ui/components/cms/dashboard";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/cms/")({
  head: () => ({
    meta: [
      { title: "CMS Dashboard — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <h1 {...stylex.props(styles.heading)}>Dashboard</h1>
      <Dashboard />
    </div>
  ),
});
