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

// Six rows plus the dashed row until guesses outgrow them.
test.each([
  [0, 8, 7],
  [4, 8, 7],
  [5, 8, 7],
  [6, 8, 8],
  [0, 6, 7],
  [4, 6, 7],
])(
  "%i guesses of %i: %i rows, exactly one dashed, at the bottom",
  (guessCount, maxGuesses, rowCount) => {
    renderGrid(guessCount, maxGuesses);
    expect(rows()).toHaveLength(rowCount);
    expect(rows().filter(isDashedRow)).toHaveLength(1);
    expect(isDashedRow(rows()[rowCount - 1])).toBe(true);
  },
);

test.each([
  [7, 8],
  [5, 6],
])("no dashed row on the last allowed guess (%i of %i)", (count, max) => {
  renderGrid(count, max);
  expect(rows()).toHaveLength(max);
  expect(rows().some(isDashedRow)).toBe(false);
});

test("no dashed row once the game is over", () => {
  renderOver();
  expect(rows()).toHaveLength(8);
  expect(rows().some(isDashedRow)).toBe(false);
});
