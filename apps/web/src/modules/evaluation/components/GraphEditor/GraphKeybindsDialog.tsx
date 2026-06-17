import {
  formatShortcutKeys,
  GROUP_ORDER,
  SHORTCUTS,
  type ShortcutGroup,
} from "@/modules/evaluation/graph/editor/setup/shortcuts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import type { ReactNode } from "react";

type DialogRootProps = Parameters<typeof Dialog>[0];

type Props = Pick<DialogRootProps, "open" | "onOpenChange">;

const isMac =
  typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

// Derived from the shared shortcut list so this dialog can never drift from the
// bindings in setupKeyListeners.ts.
const SECTIONS = GROUP_ORDER.map((group: ShortcutGroup) => ({
  title: group,
  shortcuts: SHORTCUTS.filter((shortcut) => shortcut.group === group).map(
    (shortcut) => ({
      keys: formatShortcutKeys(shortcut, mod),
      label: shortcut.description,
    }),
  ),
})).filter((section) => section.shortcuts.length > 0);

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-xs">
      {children}
    </kbd>
  );
}

function ShortcutRow({
  shortcut,
}: {
  shortcut: { keys: string[]; label: string };
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-foreground">{shortcut.label}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

export function GraphKeybindsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts are ignored while typing in an input.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h3>
              <div className="flex flex-col divide-y divide-border/50">
                {section.shortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.label} shortcut={shortcut} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
