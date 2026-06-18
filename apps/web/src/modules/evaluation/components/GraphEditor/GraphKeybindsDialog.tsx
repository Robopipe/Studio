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
import { Keyboard } from "lucide-react";
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

// Split the sections into two balanced columns (even indices left, odd right).
const COLUMNS = [
  SECTIONS.filter((_, i) => i % 2 === 0),
  SECTIONS.filter((_, i) => i % 2 === 1),
];

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-semibold text-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]">
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
    <div className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
      <span className="flex-1 text-xs text-foreground">{shortcut.label}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[11px] text-muted-foreground">+</span>
            )}
            <Key>{key}</Key>
          </span>
        ))}
      </div>
    </div>
  );
}

export function GraphKeybindsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
              <Keyboard />
            </span>
            <div>
              <DialogTitle className="text-base">
                Keyboard shortcuts
              </DialogTitle>
              <DialogDescription className="text-xs">
                Speed up building your test-case logic.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2 sm:flex-row">
          {COLUMNS.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-5">
              {col.map((section) => (
                <section key={section.title} className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                    {section.shortcuts.map((shortcut) => (
                      <ShortcutRow key={shortcut.label} shortcut={shortcut} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ))}
        </div>

        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          Shortcuts are disabled while typing in inputs.
        </p>
      </DialogContent>
    </Dialog>
  );
}
