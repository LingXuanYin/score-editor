// ABOUTME: Seam 1 for the YuE2 writer when the model gains an Ins voice it did not read from the source header.
// ABOUTME: The expected text follows the two-voice samples: the Ins header line before K and one V: Ins block per body.
import { readFileSync } from "node:fs";
import { yue2Dialect } from "@anti_entropy/score-dialect-yue2";
import type { Score } from "@anti_entropy/score-editor";
import { describe, expect, it } from "vitest";

const HEADER = `X:1
T:
M:4/4
L:1/16
Q:1/4=120
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"`;

function parse(text: string): Score {
  const { score, diagnostics } = yue2Dialect.parse(text);
  expect(diagnostics).toEqual([]);
  if (score === null) throw new Error("the score did not read");
  return score;
}

function withIns(score: Score): Score {
  return {
    ...score,
    voices: ["Vocal", "Ins"],
    notes: [
      ...score.notes,
      { id: "Ins:0", voice: "Ins", bar: 0, start: 0, duration: 1024, midi: 60, tie: false },
      { id: "Ins:1024", voice: "Ins", bar: 1, start: 1024, duration: 1024, midi: null, tie: false },
    ],
  };
}

describe("YuE2 writes a voice the model gained", () => {
  it("puts the Ins header before K and its body block after Vocal's", () => {
    const source = `${HEADER}
K:C
V: Vocal
C4D4E4F4|G16|`;
    const text = yue2Dialect.serialize(withIns(parse(source)));

    expect(text).toBe(`${HEADER}
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:C
V: Vocal
C4D4E4F4|G16|
V: Ins
C16|z16|`);
    expect(yue2Dialect.check(parse(text))).toEqual([]);
  });

  it("does not add a second Ins header to a source that already has one", () => {
    const directory = new URL("../packages/score-dialect-yue2/tests/", import.meta.url);
    const original = readFileSync(new URL("samples/compact-three-sections.abc", directory), "utf8");
    const text = yue2Dialect.serialize(parse(original));

    expect(text).toBe(original);
  });
});
