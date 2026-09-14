import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

const styles = stylex.create({
  page: {
    display: "flex",
    minHeight: "80vh",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    maxWidth: "320px",
  },
  heading: {
    margin: "0 0 0.5rem",
    fontSize: "1.5rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  button: {
    padding: "0.6rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#0b4619",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: {
    color: "#b3261e",
    fontSize: "0.9rem",
  },
});

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.username({
      username,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "Sign in failed");
      return;
    }

    navigate({ to: "/admin" });
  };

  return (
    <div {...stylex.props(styles.page)}>
      <form {...stylex.props(styles.form)} onSubmit={handleSubmit}>
        <h1 {...stylex.props(styles.heading)}>Sign in</h1>
        <div {...stylex.props(styles.field)}>
          <label htmlFor="username">Username</label>
          <input
            {...stylex.props(styles.input)}
            autoComplete="username"
            id="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            type="text"
            value={username}
          />
        </div>
        <div {...stylex.props(styles.field)}>
          <label htmlFor="password">Password</label>
          <input
            {...stylex.props(styles.input)}
            autoComplete="current-password"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        {error && <p {...stylex.props(styles.error)}>{error}</p>}
        <button
          {...stylex.props(styles.button)}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});
