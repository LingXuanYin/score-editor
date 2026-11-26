// ABOUTME: The multitrack song model, the song's own form: tracks of notes, clips and their placements, chords and the time grid.
// ABOUTME: Plain immutable data with no DOM. ABC and MIDI are projections of it; no renderer or score format shapes it.
import type { AudioTrack, TrackMix } from "./multitrack";
import {
  type KeyChange,
  type LyricLine,
  type Meter,
  type Section,
  type SongEnding,
  type Tempo,
  TICKS_PER_QUARTER,
} from "./score";

/**
 * Song ticks per quarter note. A 1/1024 note is 15 of them, and a triplet or a quintuplet lands on whole ticks.
 * So do the positions of MIDI files at 96, 120, 192, 240, 384, 480 and 960 PPQ, which divide 3840 evenly.
 * Every position and length in a `Song` is in these ticks.
 */
export const SONG_PPQ = 3840;

/** Song ticks in one tick of the `Score` model, which counts 256 to the quarter note. */
export const SONG_TICKS_PER_SCORE_TICK = SONG_PPQ / TICKS_PER_QUARTER;

/** The velocity of a note that came from somewhere without one, such as a score text. */
export const DEFAULT_VELOCITY = 100;

/** The notation grid of a new song, a sixteenth note: what a projection to a score text rounds positions to. */
export const DEFAULT_NOTATION_UNIT = SONG_PPQ / 4;

/** The id of the sung track and of the instrumental track a score text's two voices become. */
export const VOCAL_TRACK_ID = "vocal";
export const INSTRUMENTAL_TRACK_ID = "ins";

/**
 * One note. Notes of a track or clip may overlap and may sit anywhere on the tick axis. `start` counts from the song's
 * start for a note on a track, and from the clip's start for a note in a clip.
 */
export interface SongNote {
  /** Unique in the song and stable while the note is edited. */
  readonly id: string;
  /** MIDI 0-127; on a drum track, the General MIDI drum note. */
  readonly pitch: number;
  readonly start: number;
  /** Greater than zero. */
  readonly duration: number;
  /** 1-127. */
  readonly velocity: number;
  /** Chance of sounding, 0-1; absent means always. */
  readonly probability?: number;
  /** Kept but silent. */
  readonly muted?: boolean;
}

/** A point of a control curve. The value holds from `at` until the next point. */
export interface CurvePoint {
  readonly at: number;
  readonly value: number;
}

/** One MIDI controller's curve: values 0-127. */
export interface ControlCurve {
  readonly controller: number;
  readonly points: ReadonlyArray<CurvePoint>;
}

export type TrackRole = "vocal" | "instrument" | "drums";

/** A track of notes. Its loose notes are in `notes`; the clips laid on it are in `placements`. */
export interface SongTrack {
  readonly id: string;
  readonly name: string;
  readonly role: TrackRole;
  /** General MIDI program 0-127; unused on a drum track. */
  readonly program: number;
  /** The synth timbre that sounds it. */
  readonly timbre: string;
  readonly mix: TrackMix;
  readonly notes: ReadonlyArray<SongNote>;
  readonly placements: ReadonlyArray<ClipPlacement>;
  /** Pitch bend curve, values -8192 to 8191. */
  readonly pitchBend: ReadonlyArray<CurvePoint>;
  /** The pitch bend range in semitones; absent means 2. */
  readonly bendRange?: number;
  readonly controls: ReadonlyArray<ControlCurve>;
}

/** A reusable run of notes for one kind of instrument. Notes start relative to the clip and lie inside its length. */
export interface Clip {
  readonly id: string;
  readonly name: string;
  readonly role: TrackRole;
  readonly program: number;
  readonly length: number;
  readonly notes: ReadonlyArray<SongNote>;
}

/**
 * A clip laid on a track. It repeats the clip `loops` times from `start`, with `trimStart` ticks cut off the front of
 * the first repeat and `trimEnd` off the end of the last, so it covers `clip.length * loops - trimStart - trimEnd`
 * ticks. Repeat `i` (from 0) puts a note at `start + i * clip.length + note.start - trimStart`. A note sounds when
 * that position lies in the covered range, and ends no later than the range does. Placements that name the same clip
 * change together when the clip changes.
 */
export interface ClipPlacement {
  readonly id: string;
  /** A clip id. */
  readonly clip: string;
  readonly start: number;
  /** At least 1. */
  readonly loops: number;
  readonly trimStart: number;
  readonly trimEnd: number;
}

/**
 * A chord symbol on the chord track. It holds until the next one. When a bar has no chord of its own and other tracks
 * sound, a projection may infer one for it.
 */
export interface SongChord {
  readonly id: string;
  readonly start: number;
  /** The name as a score writes it, such as `Am7` or `C/E`. */
  readonly name: string;
}

export interface ChordTrack {
  readonly program: number;
  readonly timbre: string;
  readonly mix: TrackMix;
  /** In `start` order, at most one per position. */
  readonly chords: ReadonlyArray<SongChord>;
}

/** The song's time grid: every bar, second and section follows from it. */
export interface TimeGrid {
  /** The opening tempo. */
  readonly tempo: Tempo;
  /** Later tempo changes, in `at` order. */
  readonly tempoChanges: ReadonlyArray<{ readonly at: number; readonly tempo: Tempo }>;
  /** The opening meter. */
  readonly meter: Meter;
  /** Later meter changes, by 0-based bar index, in order. A change holds until the next one. */
  readonly meterChanges: ReadonlyArray<{ readonly bar: number; readonly meter: Meter }>;
  /** The key timeline; the first entry is at 0. */
  readonly keys: ReadonlyArray<KeyChange>;
  readonly barCount: number;
  /** Consecutive runs of bars that cover the song, as in a score; the run before the first marker has no name. */
  readonly sections: ReadonlyArray<Section>;
}

/**
 * A song: the multitrack notes and everything kept with them. Ids of notes, chords, clips, placements and added tracks
 * are taken from `nextId` (an id is a letter followed by that number, and `nextId` then goes up by one), so replaying
 * the same edits gives the same ids.
 */
export interface Song {
  readonly style: string;
  readonly lyricLines: ReadonlyArray<LyricLine>;
  readonly scoreMode: "full" | "melody";
  readonly seed: number | null;
  readonly time: TimeGrid;
  /** Positions in a score projection are rounded to this many ticks. */
  readonly notationUnit: number;
  readonly tracks: ReadonlyArray<SongTrack>;
  readonly chords: ChordTrack;
  readonly clips: ReadonlyArray<Clip>;
  /** The id of the instrumental track the generation model follows, or null. */
  readonly guideTrack: string | null;
  readonly audioTracks: ReadonlyArray<AudioTrack>;
  /** Groups of audio track ids that are re-sung together. */
  readonly bindings: ReadonlyArray<ReadonlyArray<string>>;
  readonly mood?: string;
  readonly ending?: SongEnding;
  readonly stoppedBatches?: ReadonlyArray<string>;
  readonly nextId: number;
}

/** One bar of a time grid, in song ticks. */
export interface SongBar {
  readonly index: number;
  readonly start: number;
  readonly length: number;
  readonly meter: Meter;
}

/** The bars of a time grid, in order. */
export function songBars(time: TimeGrid): ReadonlyArray<SongBar> {
  const bars: SongBar[] = [];
  let meter = time.meter;
  let start = 0;
  for (let index = 0; index < time.barCount; index += 1) {
    meter = time.meterChanges.find((change) => change.bar === index)?.meter ?? meter;
    const length = (SONG_PPQ * 4 * meter.numerator) / meter.denominator;
    bars.push({ index, start, length, meter });
    start += length;
  }
  return bars;
}
