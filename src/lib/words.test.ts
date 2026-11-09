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

test("without a daily list, day N plays solution N", () => {
  expect(getWordOfDay(0)).toBe(WORDS[0].toUpperCase());
  expect(getWordOfDay(1)).toBe(WORDS[1].toUpperCase());
});

describe("with a published daily list", () => {
  afterAll(() => setWordLists(solutionsText, read("guesses.txt")));

  test("day N plays line N, and days past the list stay on its last line", () => {
    setWordLists(solutionsText, "", "cat\ndog\n");
    expect(getWordOfDay(0)).toBe("CAT");
    expect(getDayIndex(at(2026, 11, 10))).toBe(1);
    expect(getDayIndex(at(2027, 6, 1))).toBe(1);
    expect(getWordOfDay(getDayIndex(at(2027, 6, 1)))).toBe("DOG");
  });

  test("a daily list that is empty or not solutions is refused", () => {
    expect(() => setWordLists(solutionsText, "", "")).toThrow();
    expect(() => setWordLists(solutionsText, "", "<!doctype html>")).toThrow();
  });
});

test("production loads the daily list; development does not fetch it", async () => {
  const fetched: string[] = [];
  const respond = (url: RequestInfo | URL) => {
    fetched.push(String(url));
    const body = String(url).endsWith("daily.txt") ? "dog\n" : "cat\ndog\n";
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    } as Response);
  };
  const original = window.fetch;
  window.fetch = vi.fn(respond);
  try {
    vi.stubEnv("DEV", false);
    vi.resetModules();
    const prod = await import("./words");
    await prod.loadWords();
    expect(fetched).toContain("/words/daily.txt");
    expect(prod.getWordOfDay(0)).toBe("DOG");

    fetched.length = 0;
    vi.stubEnv("DEV", true);
    vi.resetModules();
    const dev = await import("./words");
    await dev.loadWords();
    expect(fetched).not.toContain("/words/daily.txt");
    expect(dev.getWordOfDay(0)).toBe("CAT");
  } finally {
    window.fetch = original;
    vi.unstubAllEnvs();
  }
});

test("lookups are case-insensitive and cover both lists", () => {
  expect(isWordInWordList("CAT")).toBe(true);
  expect(isWordInWordList("aah")).toBe(true);
  expect(isWordInWordList("QWXZ")).toBe(false);
});

test("the length range comes from the solutions", () => {
  expect(getSolutionLengthRange()).toEqual({ shortest: 3, longest: 18 });
});
