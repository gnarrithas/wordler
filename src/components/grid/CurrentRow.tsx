import { MAX_WORD_LENGTH, MIN_ROW_CELLS } from "../../constants/settings";
import { Cell } from "./Cell";

type Props = {
  guess: string;
  // Faded letters for the boxes not typed yet, by position.
  hint?: string;
};

export const CurrentRow = ({ guess, hint = "" }: Props) => {
  const splitGuess = guess.split("");
  // Always keep one empty box after the last letter (up to the maximum word
  // length), so typing past five letters visibly grows the row.
  // A hint also stretches the row to its full length.
  const emptyCount = Math.max(
    MIN_ROW_CELLS - splitGuess.length,
    splitGuess.length < MAX_WORD_LENGTH ? 1 : 0,
    hint.length - splitGuess.length,
  );
  const emptyCells = Array.from(Array(emptyCount));

  return (
    <div className="flex mb-1" role="group" aria-label="Current guess">
      {splitGuess.map((letter, i) => (
        <Cell key={i} value={letter} />
      ))}
      {emptyCells.map((_, i) => (
        <Cell
          key={`empty-${i}`}
          isDashed={splitGuess.length >= MIN_ROW_CELLS}
          hint={hint[splitGuess.length + i]}
        />
      ))}
    </div>
  );
};
