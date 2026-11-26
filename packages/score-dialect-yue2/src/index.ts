// ABOUTME: Main entry of @anti_entropy/score-dialect-yue2. It depends on the core package for types only.
// ABOUTME: Exports the YuE2 dialect (identity, declarative constraints, parse, serialize, check) and its reading facts.
import type { DialectConstraints, ScoreDialect } from "@anti_entropy/score-editor";
import { CHORD_ROOTS, parseYue2, QUALITIES } from "./parser";
import { checkYue2, serializeYue2 } from "./writer";

export const yue2Id = "yue2";

export const yue2Constraints: DialectConstraints = {
  voices: [
    { name: "Vocal", required: true, allowsChords: true },
    { name: "Ins", required: false, allowsChords: false },
  ],
  keys: {
    major: ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"],
    minor: ["Abm", "Ebm", "Bbm", "Fm", "Cm", "Gm", "Dm", "Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "A#m"],
  },
  tempo: { unit: "1/4", min: 20, max: 400 },
  sectionMarker: "% ",
  lyricsInScore: false,
  // RULES.md D1: the duration numbers the format accepts under its L: unit.
  durations: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48],
  // RULES.md H3: M:n/d, numerator 1..999999, denominator a power of two up to 1024, never symbolic.
  meter: {
    form: "fraction",
    numerator: { min: 1, max: 999999 },
    denominator: { min: 1, max: 1024, powerOfTwo: true },
    symbolic: false,
  },
  // RULES.md C1-C3: root spelling, quality suffix and an optional slash bass.
  chords: { roots: CHORD_ROOTS, qualities: QUALITIES, slashBass: true },
};

export const yue2Dialect: ScoreDialect = {
  id: yue2Id,
  constraints: yue2Constraints,
  parse(text) {
    return parseYue2(text);
  },
  serialize(score) {
    return serializeYue2(score);
  },
  check(score) {
    return checkYue2(score);
  },
};
