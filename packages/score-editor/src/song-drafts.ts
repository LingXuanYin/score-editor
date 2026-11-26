// ABOUTME: The song draft: version 3 keeps the song itself, and its shape is checked with valibot when the text is read.
// ABOUTME: A version 1 or 2 draft is read through the given dialect and imported, with its multitrack settings and score tracks merged in.
import * as v from "valibot";
import type { ScoreDialect } from "./dialect";
import { readDraft } from "./drafts";
import type { Song } from "./song";
import { songOf } from "./song-import";

/** The version of the song draft this package writes. Versions 1 and 2 are read, never written. */
export const SONG_DRAFT_VERSION = 3;

/** A saved edit of one song, with the source it was started from. */
export interface SongDraft {
  readonly version: 3;
  /** The source project's key; the host maps it to its own storage. */
  readonly sourceKey: string;
  /** The content hash of the original's lyrics and score when the draft was started. */
  readonly sourceHash: string;
  /** Milliseconds since the epoch, from the clock the keeper was given. */
  readonly updatedAt: number;
  readonly song: Song;
}

const str = v.string();
const flag = v.boolean();
const int = v.pipe(v.number(), v.integer());
const mix = v.strictObject({ volumeDb: v.number(), pan: v.number(), mute: flag, solo: flag });
const meter = v.strictObject({ numerator: int, denominator: int });
const tempo = v.strictObject({ unit: str, bpm: v.number() });
const role = v.picklist(["vocal", "instrument", "drums"]);
const curvePoint = v.strictObject({ at: int, value: v.number() });
const songNote = v.strictObject({
  id: str,
  pitch: int,
  start: int,
  duration: int,
  velocity: int,
  probability: v.exactOptional(v.number()),
  muted: v.exactOptional(flag),
});
const clipPlacement = v.strictObject({
  id: str,
  clip: str,
  start: int,
  loops: int,
  trimStart: int,
  trimEnd: int,
});
const songTrack = v.strictObject({
  id: str,
  name: str,
  role,
  program: int,
  timbre: str,
  mix,
  notes: v.array(songNote),
  placements: v.array(clipPlacement),
  pitchBend: v.array(curvePoint),
  bendRange: v.exactOptional(v.number()),
  controls: v.array(v.strictObject({ controller: int, points: v.array(curvePoint) })),
});
const clip = v.strictObject({ id: str, name: str, role, program: int, length: int, notes: v.array(songNote) });
const chordTrack = v.strictObject({
  program: int,
  timbre: str,
  mix,
  chords: v.array(v.strictObject({ id: str, start: int, name: str })),
});
const span = v.strictObject({ start: v.number(), end: v.number() });
const placement = v.strictObject({
  id: str,
  take: str,
  stem: v.nullable(v.picklist(["vocals", "drums", "bass", "other"])),
  anchors: v.array(v.strictObject({ recording: v.number(), timeline: v.number() })),
  removed: v.array(span),
  uncertain: flag,
  suspect: v.array(span),
});
const audioTrack = v.strictObject({ ...placement.entries, mix, candidates: v.array(placement) });
const timeGrid = v.strictObject({
  tempo,
  tempoChanges: v.array(v.strictObject({ at: int, tempo })),
  meter,
  meterChanges: v.array(v.strictObject({ bar: int, meter })),
  keys: v.array(v.strictObject({ at: int, key: str })),
  barCount: int,
  sections: v.array(v.strictObject({ name: v.nullable(str), firstBar: int, barCount: int })),
});
const songSchema = v.strictObject({
  style: str,
  lyricLines: v.array(
    v.strictObject({ text: str, phrase: v.nullable(v.strictObject({ firstBar: int, barCount: int })) }),
  ),
  scoreMode: v.picklist(["full", "melody"]),
  seed: v.nullable(int),
  time: timeGrid,
  notationUnit: int,
  tracks: v.array(songTrack),
  chords: chordTrack,
  clips: v.array(clip),
  guideTrack: v.nullable(str),
  audioTracks: v.array(audioTrack),
  bindings: v.array(v.array(str)),
  mood: v.exactOptional(str),
  ending: v.exactOptional(v.picklist(["back-to-start", "end-here"])),
  stoppedBatches: v.exactOptional(v.array(str)),
  nextId: int,
});
const songDraftSchema = v.strictObject({
  version: v.literal(SONG_DRAFT_VERSION),
  sourceKey: str,
  sourceHash: v.pipe(str, v.regex(/^[0-9a-f]{64}$/)),
  updatedAt: v.number(),
  song: songSchema,
});

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function declaredVersion(parsed: unknown): unknown {
  return typeof parsed === "object" && parsed !== null && "version" in parsed ? parsed.version : undefined;
}

/**
 * Reads a stored text as a song draft. Version 3 is checked against the song model and returned as that model's data.
 * Versions 1 and 2 are read as draft projects: the score is parsed by `dialect` (the model ID the draft carries is not
 * read) and imported, and the draft's multitrack settings and score tracks are merged in. Any other text is no draft.
 */
export function readSongDraft(text: string, dialect: ScoreDialect): SongDraft | null {
  const parsed = parseJson(text);
  if (declaredVersion(parsed) === SONG_DRAFT_VERSION) {
    const result = v.safeParse(songDraftSchema, parsed);
    return result.success ? result.output : null;
  }
  const draft = readDraft(text);
  if (draft === null) return null;
  const read = dialect.parse(draft.project.score);
  if (read.score === null) return null;
  const { project } = draft;
  const song = songOf(
    read.score,
    { style: project.style, lyricLines: project.lyricLines, scoreMode: project.scoreMode, seed: project.seed },
    project.multitrack,
  );
  return {
    version: SONG_DRAFT_VERSION,
    sourceKey: draft.sourceKey,
    sourceHash: draft.sourceHash,
    updatedAt: draft.updatedAt,
    song: {
      ...song,
      ...(project.mood === undefined ? {} : { mood: project.mood }),
      ...(project.ending === undefined ? {} : { ending: project.ending }),
      ...(project.stoppedBatches === undefined ? {} : { stoppedBatches: project.stoppedBatches }),
    },
  };
}

/** The JSON text a host stores for a song draft. */
export function songDraftText(draft: SongDraft): string {
  return JSON.stringify(draft);
}
