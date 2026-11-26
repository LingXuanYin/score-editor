// ABOUTME: Checks every traced YuE2 sample through the package entries: it reads, reports the recorded facts and writes back byte for byte.
// ABOUTME: The samples are real generated scores; expected facts are the ones samples.json records.
import { readFileSync } from "node:fs";
import { yue2Dialect } from "@anti_entropy/score-dialect-yue2";
import { describe, expect, it } from "vitest";
import { SAMPLE_SWEEP_TIMEOUT } from "./yue2-support";

interface SampleFact {
  file: string;
  truncated: boolean;
  voices: string[];
  hasChords: boolean;
}

const directory = new URL("../packages/score-dialect-yue2/tests/", import.meta.url);
const facts = JSON.parse(readFileSync(new URL("samples.json", directory), "utf8")) as SampleFact[];

function lf(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

describe("YuE2 samples", () => {
  for (const fact of facts) {
    it(`${fact.file} reads and writes back unchanged`, { timeout: SAMPLE_SWEEP_TIMEOUT }, () => {
      const text = readFileSync(new URL(`samples/${fact.file}`, directory), "utf8");
      const { score, diagnostics } = yue2Dialect.parse(text);

      expect(diagnostics).toEqual([]);
      expect(score).not.toBeNull();
      if (!score) return;

      expect(score.truncation !== null).toBe(fact.truncated);
      expect(score.voices).toEqual(fact.voices);
      expect(score.hasChords).toBe(fact.hasChords);
      expect(yue2Dialect.serialize(score)).toBe(lf(text));
    });
  }
});
