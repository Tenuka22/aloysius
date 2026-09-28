/**
 * What counts as a username in this deployment.
 *
 * Better Auth's `username` plugin ships a default rule of `/^[a-zA-Z0-9_.]+$/`
 * — no hyphen — and enforces it in three places, including `signIn.username`.
 * Club administrator usernames are generated from the club configuration and
 * are hyphenated (`photography-admin`), so the default rule would reject every
 * one of them at the login screen.
 *
 * That combination is what made this a silent data bug rather than a validation
 * error: a hand-rolled insert bypasses the rule, so the row was created
 * happily and only failed later, at sign-in, with nothing in the database to
 * explain why. The rule therefore lives here, once, and is used both to
 * configure the plugin and to vet a username before it is written — so a
 * username that could never sign in is never created in the first place.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u;

export const isValidUsername = (value: string) => USERNAME_PATTERN.test(value);
