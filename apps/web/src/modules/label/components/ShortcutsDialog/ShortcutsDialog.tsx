import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ClipboardPaste,
  Copy,
  Crosshair,
  Eye,
  EyeOff,
  FolderPlus,
  Hand,
  Keyboard,
  Maximize2,
  Move,
  MousePointer2,
  Redo2,
  Save,
  Square,
  Tag,
  Trash2,
  Undo2,
  Ungroup,
} from "lucide-react";
import { ReactNode } from "react";

export interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  icon?: ReactNode;
  label: string;
  keys: ReactNode;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const Key = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-semibold text-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]">
    {children}
  </kbd>
);

const KeyCombo = ({ keys }: { keys: string[] }) => (
  <div className="flex items-center gap-1">
    {keys.map((k, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <span className="text-[11px] text-muted-foreground">+</span>}
        <Key>{k}</Key>
      </span>
    ))}
  </div>
);

const groups: ShortcutGroup[] = [
  {
    title: "Tools",
    items: [
      {
        icon: <MousePointer2 />,
        label: "Select",
        keys: <KeyCombo keys={["A"]} />,
      },
      {
        icon: <Square />,
        label: "Draw rectangle",
        keys: <KeyCombo keys={["R"]} />,
      },
      {
        icon: <Square className="rotate-12" />,
        label: "Draw polygon",
        keys: <KeyCombo keys={["P"]} />,
      },
      { icon: <Hand />, label: "Pan", keys: <KeyCombo keys={["M"]} /> },
      {
        icon: <Crosshair />,
        label: "Toggle crosshair",
        keys: <KeyCombo keys={["C"]} />,
      },
      {
        icon: <Eye />,
        label: "Toggle toolbars",
        keys: <KeyCombo keys={["T"]} />,
      },
      {
        icon: <Maximize2 />,
        label: "Fit to screen",
        keys: <KeyCombo keys={["F"]} />,
      },
    ],
  },
  {
    title: "Actions",
    items: [
      { icon: <Save />, label: "Save", keys: <KeyCombo keys={["S"]} /> },
      {
        icon: <Undo2 />,
        label: "Undo",
        keys: <KeyCombo keys={["Ctrl", "Z"]} />,
      },
      {
        icon: <Redo2 />,
        label: "Redo",
        keys: <KeyCombo keys={["Ctrl", "Shift", "Z"]} />,
      },
      {
        icon: <Trash2 />,
        label: "Delete selected region(s)",
        keys: <KeyCombo keys={["Del"]} />,
      },
      {
        icon: <EyeOff />,
        label: "Hide all regions (while held)",
        keys: <KeyCombo keys={["H"]} />,
      },
    ],
  },
  {
    title: "Editing",
    items: [
      {
        icon: <Move />,
        label: "Nudge selection",
        keys: (
          <div className="flex items-center gap-1">
            <Key>Shift</Key>
            <span className="text-[11px] text-muted-foreground">+</span>
            <Key>↑</Key>
            <Key>↓</Key>
            <Key>←</Key>
            <Key>→</Key>
          </div>
        ),
      },
    ],
  },
  {
    title: "Selection",
    items: [
      {
        icon: <MousePointer2 />,
        label: "Add / remove from selection",
        keys: <KeyCombo keys={["Ctrl", "Click"]} />,
      },
      {
        icon: <MousePointer2 />,
        label: "Select range in sidebar",
        keys: <KeyCombo keys={["Shift", "Click"]} />,
      },
      {
        icon: <Copy />,
        label: "Copy selected region(s)",
        keys: <KeyCombo keys={["Ctrl", "C"]} />,
      },
      {
        icon: <ClipboardPaste />,
        label: "Paste (same project)",
        keys: <KeyCombo keys={["Ctrl", "V"]} />,
      },
      {
        icon: <FolderPlus />,
        label: "Group selected regions",
        keys: <KeyCombo keys={["Ctrl", "G"]} />,
      },
      {
        icon: <Ungroup />,
        label: "Ungroup selected group",
        keys: <KeyCombo keys={["Ctrl", "Shift", "G"]} />,
      },
    ],
  },
  {
    title: "Navigation",
    items: [
      {
        icon: <ArrowUp />,
        label: "Previous task (across pages)",
        keys: <KeyCombo keys={["↑"]} />,
      },
      {
        icon: <ArrowDown />,
        label: "Next task (across pages)",
        keys: <KeyCombo keys={["↓"]} />,
      },
    ],
  },
  {
    title: "Labels",
    items: [
      {
        icon: <Tag />,
        label: "Pick label by number",
        keys: <KeyCombo keys={["1"]} />,
      },
      {
        icon: <ArrowLeft />,
        label: "Previous label",
        keys: <KeyCombo keys={["←"]} />,
      },
      {
        icon: <ArrowRight />,
        label: "Next label",
        keys: <KeyCombo keys={["→"]} />,
      },
    ],
  },
];

export const ShortcutsDialog = ({
  open,
  onOpenChange,
}: ShortcutsDialogProps) => {
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
                Speed up your labeling workflow.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2 sm:flex-row">
          {[groups.filter((_, i) => i % 2 === 0), groups.filter((_, i) => i % 2 === 1)].map(
            (col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-5">
                {col.map((group) => (
                  <section key={group.title} className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">
                      {group.title}
                    </p>
                    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                      {group.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
                        >
                          {item.icon && (
                            <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
                              {item.icon}
                            </span>
                          )}
                          <span className="flex-1 text-xs text-foreground">
                            {item.label}
                          </span>
                          {item.keys}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ),
          )}
        </div>

        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          Number keys{" "}
          <Key>1</Key>–<Key>9</Key> and <Key>0</Key> pick the first ten labels.
          Shortcuts are disabled while typing in inputs.
        </p>
      </DialogContent>
    </Dialog>
  );
};
