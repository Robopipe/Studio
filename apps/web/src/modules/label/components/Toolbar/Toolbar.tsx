import { PolygonIcon, RectBboxIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Hand,
  Info,
  MousePointer2,
  Redo2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";
import { ShortcutsDialog } from "../ShortcutsDialog";
import { ToolMode } from "../../types/annotations";

export interface ToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  showCrosshair: boolean;
  onToggleCrosshair: () => void;
}

const toolButtonClass =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-muted-foreground hover:bg-black/[0.06] hover:text-black [&_svg]:size-5";

export const Toolbar = ({
  toolMode,
  onSetToolMode,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onClear,
  canUndo,
  canRedo,
  hasSelection,
  showCrosshair,
  onToggleCrosshair,
}: ToolbarProps) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const modeTools: {
    icon: React.ReactNode;
    title: string;
    mode: ToolMode;
  }[] = [
    { icon: <MousePointer2 />, title: "Select (A)", mode: ToolMode.SELECT },
    { icon: <RectBboxIcon />, title: "Draw bbox (R)", mode: ToolMode.DRAW_BBOX },
    {
      icon: <PolygonIcon />,
      title: "Draw polygon (P)",
      mode: ToolMode.DRAW_POLYGON,
    },
  ];

  const actionTools: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    disabled?: boolean;
    mode?: ToolMode;
    active?: boolean;
  }[] = [
    { icon: <Undo2 />, title: "Undo (Ctrl+Z)", onClick: onUndo, disabled: !canUndo },
    { icon: <Redo2 />, title: "Redo (Ctrl+Shift+Z)", onClick: onRedo, disabled: !canRedo },
    { icon: <ZoomIn />, title: "Zoom in", onClick: onZoomIn },
    { icon: <ZoomOut />, title: "Zoom out", onClick: onZoomOut },
    {
      icon: <Hand />,
      title: "Pan (M)",
      onClick: () => onSetToolMode(ToolMode.PAN),
      mode: ToolMode.PAN,
    },
    {
      icon: <Crosshair />,
      title: showCrosshair ? "Hide crosshair (C)" : "Show crosshair (C)",
      onClick: onToggleCrosshair,
      active: showCrosshair,
    },
  ];

  return (
    <div className="flex flex-col gap-1 border-l border-black/10 bg-black/[0.03] p-2">
      {modeTools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          className={cn(
            toolButtonClass,
            toolMode === tool.mode &&
              "bg-emerald-500/10 text-black hover:bg-emerald-500/[0.18] hover:text-black"
          )}
          title={tool.title}
          onClick={() => onSetToolMode(tool.mode)}
        >
          {tool.icon}
        </button>
      ))}
      <button
        type="button"
        className={cn(
          toolButtonClass,
          !hasSelection && "cursor-not-allowed opacity-[0.35]"
        )}
        title="Delete selected (Del)"
        onClick={onClear}
        disabled={!hasSelection}
      >
        <Trash2 />
      </button>
      <div className="my-1 h-px bg-black/10" />
      {actionTools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          className={cn(
            toolButtonClass,
            ((tool.mode && toolMode === tool.mode) || tool.active) &&
              "bg-emerald-500/10 text-black hover:bg-emerald-500/[0.18] hover:text-black",
            tool.disabled && "cursor-not-allowed opacity-[0.35]"
          )}
          title={tool.title}
          onClick={tool.onClick}
          disabled={tool.disabled}
        >
          {tool.icon}
        </button>
      ))}
      <button
        type="button"
        className={toolButtonClass}
        title="Keyboard shortcuts"
        onClick={() => setShortcutsOpen(true)}
      >
        <Info />
      </button>
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
};
