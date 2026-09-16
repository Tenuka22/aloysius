import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";

const styles = stylex.create({
  wrap: {
    paddingBlock: space.lg,
    paddingInline: space.lg,
  },
  heading: {
    margin: 0,
    marginBlockEnd: space.lg,
    fontSize: font.size2xl,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
    gap: space.md,
  },
  card: {
    padding: space.lg,
    backgroundColor: color.surface,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
  },
  cardLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  cardValue: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.size3xl,
    fontWeight: font.weightExtrabold,
    color: color.onSurface,
  },
});

const TeacherOfficerDashboard = () => (
  <div {...stylex.props(styles.wrap)}>
    <h1 {...stylex.props(styles.heading)}>Teacher Officer Dashboard</h1>
    <div {...stylex.props(styles.grid)}>
      <div {...stylex.props(styles.card)}>
        <p {...stylex.props(styles.cardLabel)}>My Class</p>
        <p {...stylex.props(styles.cardValue)}>—</p>
      </div>
      <div {...stylex.props(styles.card)}>
        <p {...stylex.props(styles.cardLabel)}>Students</p>
        <p {...stylex.props(styles.cardValue)}>—</p>
      </div>
      <div {...stylex.props(styles.card)}>
        <p {...stylex.props(styles.cardLabel)}>Pending Marks</p>
        <p {...stylex.props(styles.cardValue)}>—</p>
      </div>
    </div>
  </div>
);

export const Route = createFileRoute("/teacher-officer/")({
  component: TeacherOfficerDashboard,
});
