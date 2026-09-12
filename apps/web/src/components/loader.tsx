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
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#d4d4d4",
    borderTopColor: "#171717",
    animationName: spin,
    animationDuration: "0.6s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
});

export default function Loader() {
  return (
    <div role="status" aria-label="Loading" {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.spinner)} />
    </div>
  );
}
