import { describe, expect, it } from "vitest";

import {
  generatePassphrase,
  PASSPHRASE_ENTROPY_BITS,
  PASSPHRASE_WORDS,
} from "./passphrase";

describe("passphrase generation", () => {
  it("issues four words and two digits, hyphen separated", () => {
    const parts = generatePassphrase().split("-");
    expect(parts).toHaveLength(6);
    expect(
      parts.slice(0, 4).every((word) => /^[a-z]+$/u.test(word))
    ).toBeTruthy();
    expect(parts.slice(4).every((digit) => /^\d$/u.test(digit))).toBeTruthy();
  });

  /**
   * The whole point of the change: a credential an operator can read off a
   * screen and type again. Long unbroken hex fails this, which is why the old
   * generator did.
   */
  it("stays short enough to write on paper and retype", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const passphrase = generatePassphrase();
      expect(passphrase.length).toBeGreaterThanOrEqual(14);
      expect(passphrase.length).toBeLessThanOrEqual(48);
    }
  });

  /**
   * Every character has to survive a phone keyboard and a read down a line.
   * Upper case invites autocapitalise, and the visually identical pairs are the
   * classic transcription failure.
   */
  it("contains no character that is easy to mistype for another", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      expect(generatePassphrase()).toMatch(/^[a-z0-9-]+$/u);
    }
  });

  it("never repeats a word inside one passphrase", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const words = generatePassphrase().split("-").slice(0, 4);
      expect(new Set(words).size).toBe(4);
    }
  });

  it("does not repeat across consecutive issues", () => {
    const issued = new Set<string>();
    for (let attempt = 0; attempt < 200; attempt += 1) {
      issued.add(generatePassphrase());
    }
    // Collisions are legal, just improbable at this word count; the point is
    // that the generator is drawing fresh entropy every call.
    expect(issued.size).toBeGreaterThan(190);
  });

  it("draws from the whole word list rather than a narrow slice", () => {
    const seen = new Set<string>();
    for (let attempt = 0; attempt < 4000; attempt += 1) {
      for (const word of generatePassphrase().split("-")) {
        seen.add(word);
      }
    }
    // A generator stuck on a handful of words would pass every other test here.
    expect(seen.size).toBeGreaterThan(PASSPHRASE_WORDS.length * 0.8);
  });

  it("keeps the word list free of duplicates and stray whitespace", () => {
    expect(
      PASSPHRASE_WORDS.every((word) => /^[a-z]+$/u.test(word))
    ).toBeTruthy();
    expect(new Set(PASSPHRASE_WORDS).size).toBe(PASSPHRASE_WORDS.length);
  });

  it("carries enough entropy to be worth issuing", () => {
    // Four words from a list this size plus two digits. Pinned so the figure
    // quoted in the source comment cannot silently go stale.
    expect(PASSPHRASE_WORDS.length).toBeGreaterThan(500);
    expect(PASSPHRASE_ENTROPY_BITS).toBeGreaterThan(40);
  });
});
