/**
 * Tracks which editor instance is "focused" so keyboard shortcuts only act on the
 * graph the user last interacted with. Multiple editors can be mounted on one page
 * (e.g. one per test-case card); without this, a window-level keydown would fire on
 * every instance at once and add/delete nodes on graphs the user can't even see.
 *
 * An instance becomes focused on a pointerdown anywhere inside its container, and
 * stays focused until another instance is interacted with. State is module-level
 * because focus is global: at most one editor is active at a time.
 */
let focusedContainer: HTMLElement | null = null;

export function focusContainer(container: HTMLElement): void {
  focusedContainer = container;
}

export function isContainerFocused(container: HTMLElement): boolean {
  return focusedContainer === container;
}

/** Clears focus if this container currently holds it (call on teardown). */
export function releaseContainerFocus(container: HTMLElement): void {
  if (focusedContainer === container) {
    focusedContainer = null;
  }
}
