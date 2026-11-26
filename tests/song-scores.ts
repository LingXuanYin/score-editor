// ABOUTME: The hand-written two-section score text the song tests read: a tie across a barline, rests, chords, a meter and key change.
// ABOUTME: Its notes, chords and grid are counted by hand in tests/song-import.test.ts; the draft tests read the same text.

/** Two sections: a 4/4 intro with a tie from the first bar into the second, a rest, and chords; then a 3/4 verse in C. */
export const SONG_ABC = [
  "X:1",
  "T:",
  "M:4/4",
  "L:1/8",
  "Q:1/4=120",
  'V: Vocal clef=treble name="Vocal Melody" snm="Vocal"',
  'V: Ins clef=treble name="Ins Melody" snm="Inst."',
  "K:G",
  "% intro",
  "V: Vocal",
  '"G"G4z2A2-|A2"Em"B2c4|',
  "V: Ins",
  "z4D2-D2|D4z4|",
  "% verse",
  "V: Vocal",
  "M:3/4",
  "K:C",
  '"C"c2e2g2|a6|',
  "V: Ins",
  "M:3/4",
  "K:C",
  "z6|E,6|",
].join("\n");
