// ABOUTME: Imports hand-written YuE2 scores as songs through the package entries, with every note, chord and grid value counted by hand.
// ABOUTME: Covers a tie across a barline, rests, a meter and key change, two sections, chords, and a score with no Ins voice.
import { yue2Dialect } from "@anti_entropy/score-dialect-yue2";
import { songFromScore } from "@anti_entropy/score-editor";
import { describe, expect, it } from "vitest";
import { SONG_ABC } from "./song-scores";

// Counting: a quarter note is 3840 song ticks, so an eighth is 1920. In the score's own ticks a quarter is 256, and a
// song tick is 15 of those, so 1 quarter = 256 score ticks = 3840 song ticks.
const fields = { style: "warm pop", lyricLines: [], scoreMode: "full" as const, seed: 7 };
const MIX = { volumeDb: 0, pan: 0, mute: false, solo: false };

/** A Vocal-only score in 4/4 of eighths, in C, with the given body lines after its header. */
function vocalOnly(...body: string[]): string {
  return [
    "X:1",
    "T:",
    "M:4/4",
    "L:1/8",
    "Q:1/4=100",
    'V: Vocal clef=treble name="Vocal Melody" snm="Vocal"',
    "K:C",
    ...body,
  ].join("\n");
}

describe("songFromScore", () => {
  it("turns the voices into tracks, the chords into the chord track, and the bars into the time grid", () => {
    const score = yue2Dialect.parse(SONG_ABC).score;
    expect(score).not.toBeNull();
    if (score === null) return;

    expect(songFromScore(score, fields)).toEqual({
      style: "warm pop",
      lyricLines: [],
      scoreMode: "full",
      seed: 7,
      time: {
        tempo: { unit: "1/4", bpm: 120 },
        tempoChanges: [],
        meter: { numerator: 4, denominator: 4 },
        meterChanges: [{ bar: 2, meter: { numerator: 3, denominator: 4 } }],
        keys: [
          { at: 0, key: "G" },
          { at: 30720, key: "C" },
        ],
        barCount: 4,
        sections: [
          { name: "intro", firstBar: 0, barCount: 2 },
          { name: "verse", firstBar: 2, barCount: 2 },
        ],
      },
      notationUnit: 1920,
      tracks: [
        {
          id: "vocal",
          name: "Vocal",
          role: "vocal",
          program: 52,
          timbre: "lead",
          mix: MIX,
          // The A is one note: its tie runs from the last beat of the first bar across the barline.
          notes: [
            { id: "n1", pitch: 67, start: 0, duration: 7680, velocity: 100 },
            { id: "n2", pitch: 69, start: 11520, duration: 7680, velocity: 100 },
            { id: "n3", pitch: 71, start: 19200, duration: 3840, velocity: 100 },
            { id: "n4", pitch: 72, start: 23040, duration: 7680, velocity: 100 },
            { id: "n5", pitch: 72, start: 30720, duration: 3840, velocity: 100 },
            { id: "n6", pitch: 76, start: 34560, duration: 3840, velocity: 100 },
            { id: "n7", pitch: 79, start: 38400, duration: 3840, velocity: 100 },
            { id: "n8", pitch: 81, start: 42240, duration: 11520, velocity: 100 },
          ],
          placements: [],
          pitchBend: [],
          controls: [],
        },
        {
          id: "ins",
          name: "Ins",
          role: "instrument",
          program: 80,
          timbre: "square-lead",
          mix: MIX,
          notes: [
            { id: "n9", pitch: 62, start: 7680, duration: 7680, velocity: 100 },
            { id: "n10", pitch: 62, start: 15360, duration: 7680, velocity: 100 },
            { id: "n11", pitch: 52, start: 42240, duration: 11520, velocity: 100 },
          ],
          placements: [],
          pitchBend: [],
          controls: [],
        },
      ],
      chords: {
        program: 88,
        timbre: "pad",
        mix: MIX,
        chords: [
          { id: "c12", start: 0, name: "G" },
          { id: "c13", start: 19200, name: "Em" },
          { id: "c14", start: 30720, name: "C" },
        ],
      },
      clips: [],
      guideTrack: "ins",
      audioTracks: [],
      bindings: [],
      nextId: 15,
    });
  });

  it("gives a score with no Ins voice no instrumental track and no guide track", () => {
    const score = yue2Dialect.parse(vocalOnly("% verse", "V: Vocal", '"C"C8|')).score;
    expect(score).not.toBeNull();
    if (score === null) return;

    const song = songFromScore(score, fields);
    expect(song.tracks.map((track) => track.id)).toEqual(["vocal"]);
    expect(song.guideTrack).toBeNull();
  });

  it("keeps only the chord in force where two chords share a position", () => {
    const score = yue2Dialect.parse(vocalOnly("% verse", "V: Vocal", '"C""G"C8|')).score;
    expect(score).not.toBeNull();
    if (score === null) return;

    expect(songFromScore(score, fields).chords.chords).toEqual([{ id: "c2", start: 0, name: "G" }]);
  });
});
