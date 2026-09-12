export interface DatabaseConfig {
  TURSO_DATABASE_URL: string;
  /** Auth token for a remote libsql-server (sqld)/Turso instance; unused for local `file:` URLs. */
  TURSO_AUTH_TOKEN?: string;
}
