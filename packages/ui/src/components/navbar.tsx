import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";

const styles = stylex.create({
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e5e5e5",
    fontFamily: "system-ui, sans-serif",
  },
  brand: {
    fontWeight: 600,
    fontSize: "1.125rem",
    color: "#0a0a0a",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    gap: "1.25rem",
  },
  link: {
    color: "#0a0a0a",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
});

export const Navbar = () => (
  <nav {...stylex.props(styles.nav)}>
    <Link to="/" {...stylex.props(styles.brand)}>
      St. Aloysius&apos; College, Galle
    </Link>
    <div {...stylex.props(styles.links)}>
      <Link to="/sign-in" {...stylex.props(styles.link)}>
        Sign in
      </Link>
      <Link to="/admin" {...stylex.props(styles.link)}>
        Admin
      </Link>
    </div>
  </nav>
);
