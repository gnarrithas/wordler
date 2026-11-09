import { getShareText, getSiteUrl, shareText } from "./share";

test("day index 0 is Wordler 1; the header has only the letter count", () => {
  expect(getShareText(0, ["COT", "CAT"], "CAT")).toBe(
    "Wordler 1 · 6 letters\n\n🟩⬜🟩\n🟩🟩🟩",
  );
});

test("large numbers get thousands separators", () => {
  expect(getShareText(1199, ["CAT"], "CAT").split("\n")[0]).toBe(
    "Wordler 1,200 · 3 letters",
  );
});

test("a loss shows its rows the same way", () => {
  expect(getShareText(2, ["DOG"], "CAT")).toBe(
    "Wordler 3 · 3 letters\n\n⬜⬜⬜",
  );
});

test("a game off the daily sequence has no number", () => {
  expect(getShareText(null, ["CAT"], "CAT").split("\n")[0]).toBe(
    "Wordler · 3 letters",
  );
});

test("high contrast uses orange and blue squares", () => {
  expect(getShareText(0, ["COT", "CAT"], "CAT", true)).toBe(
    "Wordler 1 · 6 letters\n\n🟧⬜🟧\n🟧🟧🟧",
  );
});

test("a single letter is singular", () => {
  expect(getShareText(0, ["A"], "CAT").split("\n")[0]).toBe(
    "Wordler 1 · 1 letter",
  );
});

test("a link, when given, is the last line after a blank one", () => {
  expect(
    getShareText(0, ["CAT"], "CAT", false, "https://example.com/wordler/"),
  ).toBe("Wordler 1 · 3 letters\n\n🟩🟩🟩\n\nhttps://example.com/wordler/");
});

test("the site link is the origin plus the base path", () => {
  expect(getSiteUrl()).toBe(
    new URL(import.meta.env.BASE_URL, window.location.origin).href,
  );
  expect(getSiteUrl()).toMatch(/^https?:\/\/[^/]+\/(.+\/)?$/);
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
