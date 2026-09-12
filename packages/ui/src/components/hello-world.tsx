import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  container: {
    display: "flex",
    minHeight: "100svh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
  },
  heading: {
    margin: 0,
    fontFamily: "system-ui, sans-serif",
    fontSize: "2rem",
    fontWeight: 600,
    color: "#fafafa",
  },
});

export function HelloWorld() {
  return (
    <div {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.heading)}>Hello, world!</h1>
    </div>
  );
}
