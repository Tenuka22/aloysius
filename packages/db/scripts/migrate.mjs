import { spawn } from "node:child_process";

/**
 * `drizzle-kit migrate` (1.0.0-rc.4) prints "migrations applied
 * successfully!" and then crashes on Windows during its own process
 * teardown (a libuv assertion in a native handle-close path, unrelated to
 * the migration itself), exiting non-zero after a real success. This
 * wrapper treats that specific pattern as success so `dev:db` doesn't
 * abort the whole `dev` chain on a migration that actually worked, while
 * still propagating any genuine migration failure.
 */
const child = spawn("drizzle-kit", ["migrate"], {
  stdio: ["inherit", "pipe", "inherit"],
  shell: true,
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk;
  process.stdout.write(chunk);
});

child.on("exit", (code) => {
  const succeeded =
    output.includes("migrations applied successfully") ||
    output.includes("No pending migrations");
  process.exit(code === 0 || succeeded ? 0 : (code ?? 1));
});
