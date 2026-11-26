// ABOUTME: Imports a score a dialect read as a song: Vocal and Ins become tracks, the chord symbols the chord track, the bars the time grid.
// ABOUTME: Ticks go from the score's 256 to the song's 3840 per quarter; a tie chain is one note, and rests are dropped.
import { DEFAULT_MULTITRACK, type MultitrackPart, type ScoreTrack } from "./multitrack";
import type { Meter, Score } from "./score";
import {
  DEFAULT_NOTATION_UNIT,
  DEFAULT_VELOCITY,
  INSTRUMENTAL_TRACK_ID,
  SONG_TICKS_PER_SCORE_TICK,
  type Song,
  type SongChord,
  type SongNote,
  type SongTrack,
  type TimeGrid,
  VOCAL_TRACK_ID,
} from "./song";
import { tieChains } from "./tie-chains";

/** The song fields that come from the draft or project, not from the score. */
type SongFields = Pick<Song, "style" | "lyricLines" | "scoreMode" | "seed">;

/** The General MIDI programs the tracks of an imported song sound with. */
const VOCAL_PROGRAM = 52;
const INSTRUMENTAL_PROGRAM = 80;
const CHORD_PROGRAM = 88;

/** The letters ids start with: an id is its letter and the number taken from the song's `nextId`. */
const NOTE_LETTER = "n";
const CHORD_LETTER = "c";

interface IdCounter {
  /** Takes the next id with this letter; the number is `nextId`, which then goes up by one. */
  take(letter: string): string;
  readonly nextId: number;
}

function idCounter(nextId: number): IdCounter {
  let next = nextId;
  return {
    take(letter) {
      const id = `${letter}${next}`;
      next += 1;
      return id;
    },
    get nextId() {
      return next;
    },
  };
}

function sameMeter(left: Meter, right: Meter): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function timeOf(score: Score): TimeGrid {
  const opening = score.bars[0];
  if (opening === undefined) throw new Error("A score read from text has at least one bar");
  const meterChanges: { bar: number; meter: Meter }[] = [];
  let previous = opening.meter;
  for (const [index, bar] of score.bars.entries()) {
    if (!sameMeter(previous, bar.meter)) meterChanges.push({ bar: index, meter: bar.meter });
    previous = bar.meter;
  }
  return {
    tempo: score.tempo,
    tempoChanges: (score.tempoChanges ?? []).map((change) => ({
      at: change.at * SONG_TICKS_PER_SCORE_TICK,
      tempo: change.tempo,
    })),
    meter: opening.meter,
    meterChanges,
    keys: score.keys.map((key) => ({ at: key.at * SONG_TICKS_PER_SCORE_TICK, key: key.key })),
    barCount: score.bars.length,
    sections: score.sections,
  };
}

function trackOf(track: Pick<SongTrack, "id" | "name" | "role" | "program" | "timbre" | "mix" | "notes">): SongTrack {
  return { ...track, placements: [], pitchBend: [], controls: [] };
}

/** The notes of one voice in time order; each tie chain becomes one note from its first start to its last end. */
function notesOf(score: Score, voice: string, ids: IdCounter): SongNote[] {
  const notes: SongNote[] = [];
  for (const chain of tieChains(score.notes.filter((note) => note.voice === voice))) {
    const [head] = chain;
    // A rest ends a chain, so the head of one is pitched; the check is there for the type.
    if (head === undefined || head.midi === null) continue;
    const end = Math.max(...chain.map((note) => note.start + note.duration));
    notes.push({
      id: ids.take(NOTE_LETTER),
      pitch: head.midi,
      start: head.start * SONG_TICKS_PER_SCORE_TICK,
      duration: (end - head.start) * SONG_TICKS_PER_SCORE_TICK,
      velocity: DEFAULT_VELOCITY,
    });
  }
  return notes;
}

/** The chords at their positions; where several share one, the last is the one in force, as the score reads them. */
function chordsOf(score: Score, ids: IdCounter): SongChord[] {
  return score.chords
    .filter((chord, index) => score.chords[index + 1]?.start !== chord.start)
    .map((chord) => ({ id: ids.take(CHORD_LETTER), start: chord.start * SONG_TICKS_PER_SCORE_TICK, name: chord.name }));
}

function scoreTrackOf(track: ScoreTrack, ids: IdCounter): SongTrack {
  return trackOf({
    id: track.id,
    name: track.name,
    role: track.drum ? "drums" : "instrument",
    program: 0,
    timbre: track.timbre,
    mix: track.mix,
    notes: track.notes.map((note) => ({
      id: ids.take(NOTE_LETTER),
      pitch: note.midi,
      start: note.start * SONG_TICKS_PER_SCORE_TICK,
      duration: note.duration * SONG_TICKS_PER_SCORE_TICK,
      velocity: DEFAULT_VELOCITY,
    })),
  });
}

/**
 * The song a score makes with the multitrack part it comes with. Ids are taken in this order: the Vocal notes, the Ins
 * notes, the chords, then the added score tracks' notes.
 */
export function songOf(score: Score, fields: SongFields, multitrack: MultitrackPart): Song {
  const ids = idCounter(1);
  const time = timeOf(score);
  const vocal = trackOf({
    id: VOCAL_TRACK_ID,
    name: "Vocal",
    role: "vocal",
    program: VOCAL_PROGRAM,
    timbre: multitrack.vocal.timbre,
    mix: multitrack.vocal.mix,
    notes: notesOf(score, "Vocal", ids),
  });
  const hasIns = score.voices.includes("Ins");
  const ins = hasIns
    ? [
        trackOf({
          id: INSTRUMENTAL_TRACK_ID,
          name: "Ins",
          role: "instrument",
          program: INSTRUMENTAL_PROGRAM,
          timbre: multitrack.instrumental.timbre,
          mix: multitrack.instrumental.mix,
          notes: notesOf(score, "Ins", ids),
        }),
      ]
    : [];
  const chords = chordsOf(score, ids);
  const scoreTracks = multitrack.scoreTracks.map((track) => scoreTrackOf(track, ids));
  return {
    style: fields.style,
    lyricLines: fields.lyricLines,
    scoreMode: fields.scoreMode,
    seed: fields.seed,
    time,
    notationUnit: score.unitTicks === undefined ? DEFAULT_NOTATION_UNIT : score.unitTicks * SONG_TICKS_PER_SCORE_TICK,
    tracks: [vocal, ...ins, ...scoreTracks],
    chords: { program: CHORD_PROGRAM, timbre: multitrack.chords.timbre, mix: multitrack.chords.mix, chords },
    clips: [],
    guideTrack: hasIns ? INSTRUMENTAL_TRACK_ID : null,
    audioTracks: multitrack.audioTracks,
    bindings: multitrack.bindings,
    nextId: ids.nextId,
  };
}

/** The song a score reads as: its Vocal and Ins voices as tracks, its chords, and its bars as the time grid. */
export function songFromScore(score: Score, fields: SongFields): Song {
  return songOf(score, fields, DEFAULT_MULTITRACK);
}
