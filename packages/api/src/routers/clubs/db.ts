import type { Database } from "@aloysius/db";

/**
 * Either the root database handle or an already-open transaction.
 *
 * The approval path wraps the content write and the submission's status flip in
 * one transaction, so every applier receives a transaction rather than the root
 * handle - and `assertLinkTargetExists`, called from inside those appliers,
 * receives a transaction too. A function typed only as `Database` cannot accept
 * one: `SQLiteAsyncTransaction` is missing `batch`, so the two are not
 * assignable in either direction even though every call used here exists on
 * both.
 *
 * Naming the union once is what keeps that from being rediscovered as a type
 * error at each new call site.
 */
export type DbLike =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];
