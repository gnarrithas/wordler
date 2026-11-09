import { readFileSync } from "fs";
import { join } from "path";
import {
  getDayIndex,
  getSolutionLengthRange,
  getWordOfDay,
  isWordInWordList,
  setWordLists,
} from "./words";

const read = (name: string) =>
  readFileSync(join(__dirname, "../../public/words", name), "utf8");
const solutionsText = read("solutions.txt");
const WORDS = solutionsText.split("\n").filter(Boolean);

beforeAll(() => setWordLists(solutionsText, read("guesses.txt")));

// Local dates: the day index follows the player's calendar.
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h);

test("9 November 2026 is day 0 and each local day adds one", () => {
  expect(getDayIndex(at(2026, 11, 9, 0))).toBe(0);
  expect(getDayIndex(at(2026, 11, 9, 23))).toBe(0);
  expect(getDayIndex(at(2026, 11, 10, 0))).toBe(1);
  expect(getDayIndex(at(2027, 1, 1))).toBe(53);
  // Across a daylight-saving change the count stays whole days.
  expect(getDayIndex(at(2027, 4, 1))).toBe(143);
  expect(getDayIndex(at(2030, 2, 21))).toBe(1200);
});

test("a clock set before the first day gets day 0", () => {
  expect(getDayIndex(at(2021, 6, 1))).toBe(0);
});

test("day N plays line N of the deployed list, wrapping at the end", () => {
  expect(getWordOfDay(0)).toBe(WORDS[0].toUpperCase());
  expect(getWordOfDay(1)).toBe(WORDS[1].toUpperCase());
  expect(getWordOfDay(WORDS.length + 2)).toBe(WORDS[2].toUpperCase());
});

test("lookups are case-insensitive and cover both lists", () => {
  expect(isWordInWordList("CAT")).toBe(true);
  expect(isWordInWordList("aah")).toBe(true);
  expect(isWordInWordList("QWXZ")).toBe(false);
});

test("the length range comes from the solutions", () => {
  expect(getSolutionLengthRange()).toEqual({ shortest: 3, longest: 18 });
});
