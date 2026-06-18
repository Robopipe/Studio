/**
 * Single source of truth for the editor's keyboard shortcuts.
 *
 * Both the key handler (`setupKeyListeners.ts`) and the help dialog
 * (`GraphKeybindsDialog.tsx`) are derived from this list, so a binding and its
 * documentation can never drift apart — add or change a shortcut here only.
 */

export type ShortcutAction =
  | "selectAll"
  | "copy"
  | "paste"
  | "cut"
  | "deleteSelection"
  | "deselect"
  | "undo"
  | "redo"
  | "addAnd"
  | "addOr"
  | "addLimit"
  | "addResult"
  | "addCount"
  | "addArea"
  | "addPosition"
  | "save"
  | "toggleFullscreen";

export type ShortcutGroup =
  | "Selection & clipboard"
  | "History"
  | "Add node at cursor"
  | "Actions";

export type ShortcutDefinition = {
  action: ShortcutAction;
  /** Canonical `event.key`. Single letters are stored lowercase and matched case-insensitively. */
  key: string;
  /** Requires Ctrl (Windows/Linux) or Cmd (macOS). */
  mod?: boolean;
  /**
   * When defined, Shift must be held (`true`) or absent (`false`) for a match.
   * Used to disambiguate undo (Cmd+Z) from redo (Cmd+Shift+Z). When omitted,
   * Shift is ignored (so e.g. both "q" and "Q" trigger add-And).
   */
  shift?: boolean;
  group: ShortcutGroup;
  description: string;
};

export const GROUP_ORDER: ShortcutGroup[] = [
  "Add node at cursor",
  "Selection & clipboard",
  "History",
  "Actions",
];

export const SHORTCUTS: ShortcutDefinition[] = [
  // Selection & clipboard
  {
    action: "selectAll",
    key: "a",
    mod: true,
    group: "Selection & clipboard",
    description: "Select all nodes",
  },
  {
    action: "copy",
    key: "c",
    mod: true,
    group: "Selection & clipboard",
    description: "Copy selected nodes",
  },
  {
    action: "paste",
    key: "v",
    mod: true,
    group: "Selection & clipboard",
    description: "Paste at cursor",
  },
  {
    action: "cut",
    key: "x",
    mod: true,
    group: "Selection & clipboard",
    description: "Cut",
  },
  {
    action: "deleteSelection",
    key: "Backspace",
    group: "Selection & clipboard",
    description: "Delete selected nodes",
  },
  {
    action: "deselect",
    key: "Escape",
    group: "Selection & clipboard",
    description: "Deselect / cancel pending connection",
  },

  // History
  {
    action: "undo",
    key: "z",
    mod: true,
    shift: false,
    group: "History",
    description: "Undo",
  },
  {
    action: "redo",
    key: "z",
    mod: true,
    shift: true,
    group: "History",
    description: "Redo",
  },

  // Add node at cursor
  {
    action: "addAnd",
    key: "a",
    group: "Add node at cursor",
    description: "And",
  },
  { action: "addOr", key: "o", group: "Add node at cursor", description: "Or" },
  {
    action: "addLimit",
    key: "l",
    group: "Add node at cursor",
    description: "Limit",
  },
  {
    action: "addResult",
    key: "r",
    group: "Add node at cursor",
    description: "Result",
  },
  {
    action: "addCount",
    key: "1",
    group: "Add node at cursor",
    description: "Count",
  },
  {
    action: "addArea",
    key: "2",
    group: "Add node at cursor",
    description: "Area",
  },
  {
    action: "addPosition",
    key: "3",
    group: "Add node at cursor",
    description: "Position",
  },

  // Actions
  {
    action: "save",
    key: "s",
    mod: true,
    group: "Actions",
    description: "Save test case",
  },
  {
    action: "toggleFullscreen",
    key: "f",
    group: "Actions",
    description: "Toggle full screen",
  },
];

/** True when a keyboard event satisfies a shortcut definition. */
export function matchesShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey">,
  definition: ShortcutDefinition,
): boolean {
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (eventKey !== definition.key) return false;

  const mod = event.ctrlKey || event.metaKey;
  if (Boolean(definition.mod) !== mod) return false;

  if (definition.shift !== undefined && definition.shift !== event.shiftKey) {
    return false;
  }

  return true;
}

/** Finds the shortcut a keyboard event triggers, if any. */
export function findShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey">,
): ShortcutDefinition | undefined {
  return SHORTCUTS.find((definition) => matchesShortcut(event, definition));
}

const KEY_LABELS: Record<string, string> = {
  Escape: "Esc",
  Backspace: "Backspace",
};

/**
 * Renders a shortcut's keys for display, e.g. `["⌘", "Shift", "Z"]`.
 * `mod` resolves to the platform modifier symbol passed in.
 */
export function formatShortcutKeys(
  definition: ShortcutDefinition,
  modLabel: string,
): string[] {
  const keys: string[] = [];
  if (definition.mod) keys.push(modLabel);
  if (definition.shift) keys.push("Shift");
  keys.push(KEY_LABELS[definition.key] ?? definition.key.toUpperCase());
  return keys;
}
