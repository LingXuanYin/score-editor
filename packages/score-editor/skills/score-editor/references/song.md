# Song model

A song can be held as tracks of notes, clips and chords on one time grid. It is plain data with no DOM and no dialect in it: a score text is one way to read a song in. Use this layer to import a score a dialect parsed, or to read a stored song draft. Every name is listed in [api.md](api.md).

The mounted editor, its drafts and its score files still work on the song project described in [drafts.md](drafts.md) and [mount.md](mount.md); nothing in `mount` reads the song model yet.

```ts
import { songBars, songDraftText, songFromScore, readSongDraft } from "@anti_entropy/score-editor";
import { yue2Dialect } from "@anti_entropy/score-dialect-yue2";

const { score } = yue2Dialect.parse(text);
if (score !== null) {
  const song = songFromScore(score, { style: "warm pop", lyricLines: [], scoreMode: "full", seed: 7 });
  const bars = songBars(song.time); // each bar's index, start, length and meter, in song ticks
}

const draft = readSongDraft(storedText, yue2Dialect); // a version 3, 2 or 1 draft, or null
const version3Text = draft === null ? null : songDraftText(draft); // what the host stores from now on
```

## The model

A `Song` holds `style`, `lyricLines`, `scoreMode`, `seed`, the `time` grid (a `TimeGrid`), `notationUnit`, `tracks`, `chords`, `clips`, `guideTrack`, `audioTracks`, `bindings` and `nextId`. Each of `tracks` is a `SongTrack` with its `SongNote`s, its `ClipPlacement`s of `Clip`s, its `CurvePoint` pitch bend and its `ControlCurve`s, and a `TrackRole` of `vocal`, `instrument` or `drums`. The chord track holds `SongChord`s in a `ChordTrack`. `songBars(time)` lists the bars of a grid as `SongBar`s.

- Every position and length is in song ticks: `SONG_PPQ` (3840) to the quarter note. A score counts 256 to the quarter, and `SONG_TICKS_PER_SCORE_TICK` (15) is the factor between the two.
- An id is a letter and a number. A song takes its numbers from `nextId`, from 1 upward, and `nextId` goes up by one with each id taken. Notes start with `n` and chords with `c`, so the same import gives the same ids.

## Importing a score

`songFromScore(score, fields)` reads a `Score` by these rules:

- `Vocal` becomes the track whose id is `VOCAL_TRACK_ID` (`"vocal"`, role `vocal`, program 52, timbre `lead`). `Ins`, when the score has it, becomes the track whose id is `INSTRUMENTAL_TRACK_ID` (`"ins"`, role `instrument`, program 80, timbre `square-lead`), and `guideTrack` names it. Without `Ins`, `guideTrack` is `null`.
- A tie joins the notes of its voice into one note, from the first start to the end of the last. Rests are dropped. Every note has the velocity `DEFAULT_VELOCITY` (100).
- The chord symbols become the chord track (program 88, timbre `pad`), one chord per position. Where several share a position, the last one is in force.
- The bars become the `time` grid: the opening tempo and meter, later meter changes by bar index, the key timeline, the bar count and the sections. `notationUnit` is the score's written unit in song ticks, or `DEFAULT_NOTATION_UNIT` (a sixteenth note) when the score states none.
- Every track's mixer settings are the default `{ volumeDb: 0, pan: 0, mute: false, solo: false }`.

## Song drafts

`SONG_DRAFT_VERSION` is 3. `songDraftText(draft)` writes a `SongDraft`: the version, the source key, the source hash, the update time and the `song` itself. `readSongDraft(text, dialect)`:

- returns the `SongDraft` for a version 3 text whose shape the song model has, and `null` when the shape is wrong;
- reads a version 1 or 2 draft by parsing its score with the `dialect` the host passes, and importing that score. The model ID an old draft carries is not read. Its timbres and mixes go to the voice tracks and the chord track; its score tracks become tracks (role `drums` for a drum track, otherwise `instrument`, program 0, notes in song ticks at the default velocity); its audio tracks, bindings, lyric lines, mood, ending and stopped batches are kept. Its handoff hash, change records, base take and time map are not carried over. An old draft's instrumental timbre and mix apply only when its score has an `Ins` voice;
- returns `null` for any other text, and for an old draft whose score does not read.
