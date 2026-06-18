import { describe, expect, it } from "vitest";
import { findShortcut, formatShortcutKeys, SHORTCUTS } from "../shortcuts";

type KeyEventInit = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

const event = (init: KeyEventInit) => ({
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...init,
});

describe("findShortcut", () => {
  it("matches mod-based shortcuts (Cmd/Ctrl)", () => {
    expect(findShortcut(event({ key: "a", metaKey: true }))?.action).toBe(
      "selectAll",
    );
    expect(findShortcut(event({ key: "c", ctrlKey: true }))?.action).toBe(
      "copy",
    );
    expect(findShortcut(event({ key: "s", metaKey: true }))?.action).toBe(
      "save",
    );
  });

  it("disambiguates undo and redo by Shift", () => {
    expect(findShortcut(event({ key: "z", metaKey: true }))?.action).toBe(
      "undo",
    );
    expect(
      findShortcut(event({ key: "z", metaKey: true, shiftKey: true }))?.action,
    ).toBe("redo");
  });

  it("matches plain letter shortcuts case-insensitively and ignores Shift", () => {
    expect(findShortcut(event({ key: "o" }))?.action).toBe("addOr");
    expect(findShortcut(event({ key: "O", shiftKey: true }))?.action).toBe(
      "addOr",
    );
    expect(findShortcut(event({ key: "f" }))?.action).toBe("toggleFullscreen");
  });

  it("does not match mod-requiring shortcuts without the modifier", () => {
    // "c" (copy) and "s" (save) require the modifier and have no plain counterpart.
    expect(findShortcut(event({ key: "c" }))).toBeUndefined();
    expect(findShortcut(event({ key: "s" }))).toBeUndefined();
  });

  it("does not hijack browser combos like Ctrl/Cmd+R", () => {
    // addResult is "r" without a modifier; Cmd+R must not trigger it.
    expect(findShortcut(event({ key: "r", metaKey: true }))).toBeUndefined();
  });

  it("matches special keys", () => {
    expect(findShortcut(event({ key: "Backspace" }))?.action).toBe(
      "deleteSelection",
    );
    expect(findShortcut(event({ key: "Escape" }))?.action).toBe("deselect");
  });
});

describe("shortcut definitions", () => {
  it("has a unique action per entry", () => {
    const actions = SHORTCUTS.map((shortcut) => shortcut.action);
    expect(new Set(actions).size).toBe(actions.length);
  });
});

describe("formatShortcutKeys", () => {
  it("renders modifier, shift and the key label in order", () => {
    const redo = SHORTCUTS.find((shortcut) => shortcut.action === "redo")!;
    expect(formatShortcutKeys(redo, "⌘")).toEqual(["⌘", "Shift", "Z"]);
  });

  it("maps Escape to Esc", () => {
    const deselect = SHORTCUTS.find(
      (shortcut) => shortcut.action === "deselect",
    )!;
    expect(formatShortcutKeys(deselect, "Ctrl")).toEqual(["Esc"]);
  });
});
