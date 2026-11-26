// ABOUTME: Writer support for section markers: it tells the writer when an edit changed the section list.
// ABOUTME: A changed section list needs the bar-grid writer, which writes every marker from the model.
import type { Score } from "@anti_entropy/score-editor";
import type { Yue2Source } from "./parser";

function sameSections(left: Score["sections"], right: Score["sections"]): boolean {
  return (
    left.length === right.length &&
    left.every((section, index) => {
      const other = right[index] as Score["sections"][number];
      return section.name === other.name && section.firstBar === other.firstBar && section.barCount === other.barCount;
    })
  );
}

/** True when the score's sections still match the text they were read from. */
export function sectionsMatchSource(score: Score, source: Yue2Source): boolean {
  return sameSections(score.sections, source.sections);
}
