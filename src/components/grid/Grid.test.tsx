import { render, screen } from "@testing-library/react";
import { Grid } from "./Grid";

const renderGrid = (guessCount: number, maxGuesses: number) =>
  render(
    <Grid
      guesses={Array(guessCount).fill("ABCDEFG")}
      currentGuess=""
      solution="ZYXWVUT"
      maxGuesses={maxGuesses}
      isGameWon={false}
      isGameOver={false}
    />,
  );

const rows = () => Array.from(screen.getByTestId("board").children);
const isDashedRow = (row: Element) =>
  row.children.length > 0 &&
  Array.from(row.children).every((c) => c.classList.contains("border-dashed"));

const renderOver = () =>
  render(
    <Grid
      guesses={Array(8).fill("ABCDEFG")}
      currentGuess=""
      solution="ZYXWVUT"
      maxGuesses={8}
      isGameWon={false}
      isGameOver
    />,
  );

// The board is six rows plus the dashed row until guesses outgrow it.
test.each([
  [0, 8, 7],
  [4, 8, 7],
  [5, 8, 7],
  [6, 8, 8],
  [7, 8, 9],
  [5, 6, 7],
])(
  "%i guesses of %i: %i rows, exactly one dashed, at the bottom",
  (guessCount, maxGuesses, rowCount) => {
    renderGrid(guessCount, maxGuesses);
    expect(rows()).toHaveLength(rowCount);
    expect(rows().filter(isDashedRow)).toHaveLength(1);
    expect(isDashedRow(rows()[rowCount - 1])).toBe(true);
  },
);

test("the dashed row stays once the game is over", () => {
  renderOver();
  expect(rows()).toHaveLength(9);
  expect(isDashedRow(rows()[8])).toBe(true);
});
