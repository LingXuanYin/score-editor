// ABOUTME: Checks the host-built dialect registry and the declarative YuE2 constraints through the package entries.
// ABOUTME: There is no global registry: a host passes the dialects it imports and finds one by model ID.

import { yue2Constraints, yue2Dialect, yue2Id } from "@anti_entropy/score-dialect-yue2";
import { createDialectRegistry } from "@anti_entropy/score-editor";
import { describe, expect, it } from "vitest";

describe("dialect registry and constraints", () => {
  it("finds YuE2 by model id and misses an unknown model", () => {
    const registry = createDialectRegistry([yue2Dialect]);

    expect(registry.find("yue2")).toBe(yue2Dialect);
    expect(registry.find("another-model")).toBeUndefined();
    expect(yue2Dialect.id).toBe(yue2Id);
    expect(yue2Dialect.constraints).toBe(yue2Constraints);
  });

  it("declares YuE2's durations, meter, chord vocabulary and tempo", () => {
    expect(yue2Constraints.durations).toEqual([1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48]);
    expect(yue2Constraints.meter).toMatchObject({
      form: "fraction",
      numerator: { min: 1, max: 999999 },
      denominator: { min: 1, max: 1024, powerOfTwo: true },
      symbolic: false,
    });
    expect(yue2Constraints.chords.slashBass).toBe(true);
    expect(yue2Constraints.chords.qualities).toEqual([
      "",
      "m",
      "dim",
      "aug",
      "7",
      "maj7",
      "m7",
      "dim7",
      "m7b5",
      "sus4",
      "sus2",
      "6",
      "m6",
      "7sus4",
      "m(maj7)",
    ]);
    expect(yue2Constraints.chords.roots).toContain("C#");
    expect(yue2Constraints.chords.roots).toContain("Dbb");
    expect(yue2Constraints.tempo).toEqual({ unit: "1/4", min: 20, max: 400 });
  });
});
