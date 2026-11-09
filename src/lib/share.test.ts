import { getShareText, shareText } from "./share";

test("a win shows the day, guesses out of the limit and letters", () => {
  expect(getShareText(3, ["COT", "CAT"], "CAT", true, 6)).toBe(
    "Wordler 3 · 2/6 · 6 letters\n\n🟩⬜🟩\n🟩🟩🟩",
  );
});

test("large day numbers get thousands separators", () => {
  const guesses = [
    "ABCDEF",
    "GHIJKL",
    "MNOPQR",
    "STUVWX",
    "ABCD",
    "EFGH",
    "IJKL",
    "TENLETTERS",
  ];
  expect(guesses.join("")).toHaveLength(46);
  expect(
    getShareText(1200, guesses, "TENLETTERS", true, 11).split("\n")[0],
  ).toBe("Wordler 1,200 · 8/11 · 46 letters");
});

test("a loss shows X", () => {
  expect(getShareText(0, ["DOG"], "CAT", false, 6)).toBe(
    "Wordler 0 · X/6 · 3 letters\n\n⬜⬜⬜",
  );
});

test("a game off the daily sequence has no day number", () => {
  expect(getShareText(null, ["CAT"], "CAT", true, 6).split("\n")[0]).toBe(
    "Wordler · 1/6 · 3 letters",
  );
});

test("high contrast uses orange and blue squares", () => {
  expect(getShareText(3, ["COT", "CAT"], "CAT", true, 6, true)).toBe(
    "Wordler 3 · 2/6 · 6 letters\n\n🟧⬜🟧\n🟧🟧🟧",
  );
});

test("a single letter is singular", () => {
  expect(getShareText(0, ["A"], "CAT", false, 6).split("\n")[0]).toBe(
    "Wordler 0 · X/6 · 1 letter",
  );
});

describe("shareText", () => {
  const originalSecure = window.isSecureContext;
  afterEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: originalSecure,
    });
    delete (navigator as any).share;
    delete (navigator as any).clipboard;
    delete (document as any).execCommand;
  });

  const setSecure = (value: boolean) =>
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value,
    });

  test("uses the native share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    await expect(shareText("hi")).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "hi" });
  });

  test("uses the clipboard API in a secure context", async () => {
    setSecure(true);
    const writeText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText };
    await expect(shareText("hi")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hi");
  });

  test("falls back to execCommand over plain HTTP", async () => {
    setSecure(false);
    const execCommand = vi.fn().mockReturnValue(true);
    (document as any).execCommand = execCommand;
    await expect(shareText("hi")).resolves.toBe("copied");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
