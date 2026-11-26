// ABOUTME: Reads song drafts through the package entries: a version 3 text reads back as written, and a malformed one is no draft.
// ABOUTME: A version 2 draft, written out by hand, reads as the notes of its score with its timbres, mixes and score tracks.
import { yue2Dialect } from "@anti_entropy/score-dialect-yue2";
import { readSongDraft, type Song, type SongDraft, songDraftText } from "@anti_entropy/score-editor";
import { describe, expect, it } from "vitest";
import { SONG_ABC } from "./song-scores";

const HASH = "a".repeat(64);

/** Two audio tracks: one with a candidate of each stem and one of a take with no stems, and a binding between them. */
const AUDIO_TRACKS: Song["audioTracks"] = [
  {
    id: "audio-1",
    take: "take-1",
    stem: "vocals",
    anchors: [
      { recording: 0, timeline: 0.5 },
      { recording: 12.25, timeline: 12.75 },
    ],
    removed: [{ start: 1.25, end: 1.5 }],
    uncertain: true,
    suspect: [{ start: 2, end: 2.5 }],
    mix: { volumeDb: -3, pan: 0.25, mute: false, solo: true },
    candidates: [
      { id: "candidate-1", take: "take-1", stem: "drums", anchors: [], removed: [], uncertain: false, suspect: [] },
      { id: "candidate-2", take: "take-1", stem: "bass", anchors: [], removed: [], uncertain: false, suspect: [] },
      {
        id: "candidate-3",
        take: "take-1",
        stem: "other",
        anchors: [{ recording: 0, timeline: 0.5 }],
        removed: [],
        uncertain: false,
        suspect: [],
      },
      {
        id: "candidate-4",
        take: "take-2",
        stem: null,
        anchors: [],
        removed: [],
        uncertain: true,
        suspect: [{ start: 4, end: 4.25 }],
      },
    ],
  },
  {
    id: "audio-2",
    take: "take-2",
    stem: null,
    anchors: [],
    removed: [],
    uncertain: false,
    suspect: [],
    mix: { volumeDb: -6, pan: -0.5, mute: true, solo: false },
    candidates: [],
  },
];

/** A version 2 draft as the previous format stored it: the score as text, the multitrack part, and fields v3 drops. */
const VERSION_2_DRAFT = {
  version: 2,
  sourceKey: "song-2",
  sourceHash: HASH,
  handoffHash: "b".repeat(64),
  updatedAt: 1700000000001,
  project: {
    style: "warm pop",
    lyrics: "la la",
    lyricLines: [{ text: "la la", phrase: null }],
    score: SONG_ABC,
    scoreMode: "full",
    seed: 7,
    multitrack: {
      vocal: { timbre: "warm-lead", mix: { volumeDb: -3, pan: -0.25, mute: false, solo: false } },
      instrumental: { timbre: "soft-pad", mix: { volumeDb: -6, pan: 0.5, mute: false, solo: true } },
      chords: { timbre: "organ", mix: { volumeDb: -9, pan: 0, mute: true, solo: false } },
      scoreTracks: [
        {
          id: "melody-2",
          name: "Lead",
          drum: false,
          timbre: "pluck",
          mix: { volumeDb: 2, pan: 0.1, mute: false, solo: false },
          notes: [
            { start: 0, duration: 256, midi: 64 },
            { start: 256, duration: 512, midi: 67 },
          ],
        },
        {
          id: "kit-2",
          name: "Kit",
          drum: true,
          timbre: "kit",
          mix: { volumeDb: -2, pan: 0, mute: false, solo: false },
          notes: [{ start: 0, duration: 128, midi: 36 }],
        },
      ],
      audioTracks: [],
      bindings: [],
      baseTake: null,
      timeMap: null,
    },
    mood: "calm",
    ending: "end-here",
    stoppedBatches: ["batch-1"],
    handedOutAt: 1699999999999,
    changeRecords: [],
  },
};

/** The song the version 2 draft reads as, counted by hand: the score's notes as in the import test, then the score tracks. */
const EXPECTED: SongDraft = {
  version: 3,
  sourceKey: "song-2",
  sourceHash: HASH,
  updatedAt: 1700000000001,
  song: {
    style: "warm pop",
    lyricLines: [{ text: "la la", phrase: null }],
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
        timbre: "warm-lead",
        mix: { volumeDb: -3, pan: -0.25, mute: false, solo: false },
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
        timbre: "soft-pad",
        mix: { volumeDb: -6, pan: 0.5, mute: false, solo: true },
        notes: [
          { id: "n9", pitch: 62, start: 7680, duration: 7680, velocity: 100 },
          { id: "n10", pitch: 62, start: 15360, duration: 7680, velocity: 100 },
          { id: "n11", pitch: 52, start: 42240, duration: 11520, velocity: 100 },
        ],
        placements: [],
        pitchBend: [],
        controls: [],
      },
      {
        // A score track's notes are in score ticks (256 to the quarter) and move to song ticks, 15 times longer.
        id: "melody-2",
        name: "Lead",
        role: "instrument",
        program: 0,
        timbre: "pluck",
        mix: { volumeDb: 2, pan: 0.1, mute: false, solo: false },
        notes: [
          { id: "n15", pitch: 64, start: 0, duration: 3840, velocity: 100 },
          { id: "n16", pitch: 67, start: 3840, duration: 7680, velocity: 100 },
        ],
        placements: [],
        pitchBend: [],
        controls: [],
      },
      {
        id: "kit-2",
        name: "Kit",
        role: "drums",
        program: 0,
        timbre: "kit",
        mix: { volumeDb: -2, pan: 0, mute: false, solo: false },
        notes: [{ id: "n17", pitch: 36, start: 0, duration: 1920, velocity: 100 }],
        placements: [],
        pitchBend: [],
        controls: [],
      },
    ],
    chords: {
      program: 88,
      timbre: "organ",
      mix: { volumeDb: -9, pan: 0, mute: true, solo: false },
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
    mood: "calm",
    ending: "end-here",
    stoppedBatches: ["batch-1"],
    nextId: 18,
  },
};

/**
 * A version 3 draft with every optional branch of the song model filled in: a track with a pitch bend range beside one
 * without, clips with placements, pitch bend, controls, notes with a probability or muted, and the audio tracks.
 */
const RICH_DRAFT: SongDraft = {
  version: 3,
  sourceKey: "song-3",
  sourceHash: "c".repeat(64),
  updatedAt: 1700000000002,
  song: {
    style: "dream pop",
    lyricLines: [
      { text: "la la", phrase: { firstBar: 0, barCount: 2 } },
      { text: "oh", phrase: null },
    ],
    scoreMode: "melody",
    seed: 11,
    time: {
      tempo: { unit: "1/4", bpm: 120 },
      tempoChanges: [{ at: 30720, tempo: { unit: "1/4", bpm: 90 } }],
      meter: { numerator: 4, denominator: 4 },
      meterChanges: [{ bar: 2, meter: { numerator: 3, denominator: 4 } }],
      keys: [{ at: 0, key: "G" }],
      barCount: 4,
      sections: [
        { name: "intro", firstBar: 0, barCount: 2 },
        { name: null, firstBar: 2, barCount: 2 },
      ],
    },
    notationUnit: 960,
    tracks: [
      {
        id: "vocal",
        name: "Vocal",
        role: "vocal",
        program: 52,
        timbre: "lead",
        mix: { volumeDb: 0, pan: 0, mute: false, solo: false },
        notes: [
          { id: "n1", pitch: 67, start: 0, duration: 1920, velocity: 90, probability: 0.75, muted: false },
          { id: "n2", pitch: 69, start: 1920, duration: 1920, velocity: 100, muted: true },
          { id: "n3", pitch: 71, start: 3840, duration: 1920, velocity: 100 },
        ],
        placements: [
          { id: "p4", clip: "k5", start: 0, loops: 2, trimStart: 0, trimEnd: 0 },
          { id: "p6", clip: "k5", start: 7680, loops: 1, trimStart: 960, trimEnd: 480 },
        ],
        pitchBend: [
          { at: 0, value: 0 },
          { at: 1920, value: -4096 },
        ],
        controls: [
          {
            controller: 1,
            points: [
              { at: 0, value: 0 },
              { at: 3840, value: 127 },
            ],
          },
        ],
      },
      {
        id: "ins",
        name: "Ins",
        role: "instrument",
        program: 80,
        timbre: "square-lead",
        mix: { volumeDb: -6, pan: 0.5, mute: false, solo: true },
        notes: [],
        placements: [],
        pitchBend: [],
        controls: [],
      },
      {
        id: "melody-2",
        name: "Lead",
        role: "instrument",
        program: 0,
        timbre: "pluck",
        mix: { volumeDb: 2, pan: 0.1, mute: false, solo: false },
        notes: [{ id: "n9", pitch: 64, start: 0, duration: 3840, velocity: 100 }],
        placements: [],
        pitchBend: [{ at: 1920, value: 8191 }],
        controls: [],
        bendRange: 12,
      },
      {
        id: "kit-2",
        name: "Kit",
        role: "drums",
        program: 0,
        timbre: "kit",
        mix: { volumeDb: -2, pan: 0, mute: false, solo: false },
        notes: [{ id: "n10", pitch: 36, start: 0, duration: 960, velocity: 110 }],
        placements: [],
        pitchBend: [],
        controls: [],
      },
    ],
    chords: {
      program: 88,
      timbre: "organ",
      mix: { volumeDb: -9, pan: 0, mute: true, solo: false },
      chords: [
        { id: "c11", start: 0, name: "G" },
        { id: "c12", start: 15360, name: "Em7" },
      ],
    },
    clips: [
      {
        id: "k5",
        name: "Hook",
        role: "vocal",
        program: 52,
        length: 3840,
        notes: [
          { id: "n7", pitch: 60, start: 0, duration: 1920, velocity: 90, probability: 0.5, muted: true },
          { id: "n8", pitch: 62, start: 1920, duration: 1920, velocity: 90 },
        ],
      },
    ],
    guideTrack: "ins",
    audioTracks: AUDIO_TRACKS,
    bindings: [["audio-1", "audio-2"]],
    mood: "calm",
    ending: "back-to-start",
    stoppedBatches: ["batch-1", "batch-2"],
    nextId: 13,
  },
};

/** The path to every object of a parsed JSON value, the value itself included, as the keys and indexes that reach it. */
function objectPaths(
  value: unknown,
  path: ReadonlyArray<string | number> = [],
): ReadonlyArray<ReadonlyArray<string | number>> {
  if (Array.isArray(value)) return value.flatMap((item, index) => objectPaths(item, [...path, index]));
  if (typeof value !== "object" || value === null) return [];
  return [path, ...Object.entries(value).flatMap(([key, child]) => objectPaths(child, [...path, key]))];
}

/** The text of a draft with one more field, `extra`, on the object that `path` reaches. */
function withExtraFieldAt(text: string, path: ReadonlyArray<string | number>): string {
  const draft = JSON.parse(text);
  let object = draft;
  for (const key of path) object = object[key];
  object.extra = true;
  return JSON.stringify(draft);
}

describe("readSongDraft", () => {
  it("reads a version 2 draft as its notes, with its timbres, mixes and score tracks", () => {
    expect(readSongDraft(JSON.stringify(VERSION_2_DRAFT), yue2Dialect)).toEqual(EXPECTED);
  });

  it("reads a version 3 draft back as it was written, with every optional branch filled", () => {
    expect(readSongDraft(songDraftText(RICH_DRAFT), yue2Dialect)).toStrictEqual(RICH_DRAFT);
  });

  it("is no draft when a version 3 draft has a shape the song model does not have", () => {
    const withBadRole = JSON.parse(songDraftText(RICH_DRAFT));
    withBadRole.song.tracks[0].role = "lead";
    const withBadBend = JSON.parse(songDraftText(RICH_DRAFT));
    withBadBend.song.tracks[2].bendRange = "12";
    const withoutSong = JSON.parse(songDraftText(RICH_DRAFT));
    delete withoutSong.song;

    expect(readSongDraft(JSON.stringify(withBadRole), yue2Dialect)).toBeNull();
    expect(readSongDraft(JSON.stringify(withBadBend), yue2Dialect)).toBeNull();
    expect(readSongDraft(JSON.stringify(withoutSong), yue2Dialect)).toBeNull();
  });

  it("is no draft when a version 3 draft has a field the song model does not list, at any object", () => {
    const text = songDraftText(RICH_DRAFT);
    const accepted = objectPaths(JSON.parse(text)).filter(
      (path) => readSongDraft(withExtraFieldAt(text, path), yue2Dialect) !== null,
    );
    expect(accepted).toEqual([]);
  });

  it("is no draft when a version 2 draft's score does not read", () => {
    const unreadable = { ...VERSION_2_DRAFT, project: { ...VERSION_2_DRAFT.project, score: "not a score" } };
    expect(readSongDraft(JSON.stringify(unreadable), yue2Dialect)).toBeNull();
  });
});
