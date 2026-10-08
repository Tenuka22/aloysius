import { bp } from "@aloysius/ui/tokens/breakpoints.stylex";
import { color, radius } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  container: {
    display: "flex",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "2rem",
  },
  spinner: {
    height: "1.5rem",
    width: "1.5rem",
    borderRadius: radius.circle,
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: color.border,
    borderTopColor: color.accent,
    animationName: {
      default: spin,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "0.6s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
});

const Loader = () => (
  <output aria-label="Loading" {...stylex.props(styles.container)}>
    <div {...stylex.props(styles.spinner)} />
  </output>
);

export default Loader;
