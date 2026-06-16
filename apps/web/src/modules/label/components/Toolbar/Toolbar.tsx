import { PolygonIcon, RectBboxIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/modules/shadcn/ui/dropdown-menu";
import { PreAnnotateModelTypeEnum } from "@repo/schema";
import {
  ChevronDown,
  Crosshair,
  FolderPlus,
  Hand,
  Info,
  Loader2,
  Maximize2,
  MousePointer2,
  Redo2,
  Settings,
  Sparkles,
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
  hasLabels: boolean;
  showCrosshair: boolean;
  onToggleCrosshair: () => void;
  onResetView: () => void;
  onPreAnnotate: (modelType: PreAnnotateModelTypeEnum) => void;
  onOpenPreAnnotateSettings: () => void;
  preAnnotateSegDisabled: boolean;
  preAnnotateDetDisabled: boolean;
  preAnnotatePending: boolean;
  preAnnotateSegDisabledReason?: string;
  preAnnotateDetDisabledReason?: string;
  preAnnotateSettingsDisabled?: boolean;
  preAnnotateSettingsDisabledReason?: string;
  canGroup?: boolean;
  onGroupSelected?: () => void;
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
  hasLabels,
  showCrosshair,
  onToggleCrosshair,
  onResetView,
  onPreAnnotate,
  onOpenPreAnnotateSettings,
  preAnnotateSegDisabled,
  preAnnotateDetDisabled,
  preAnnotatePending,
  preAnnotateSegDisabledReason,
  preAnnotateDetDisabledReason,
  preAnnotateSettingsDisabled,
  preAnnotateSettingsDisabledReason,
  canGroup = false,
  onGroupSelected,
}: ToolbarProps) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const modeTools: {
    icon: React.ReactNode;
    title: string;
    mode: ToolMode;
    disabled?: boolean;
  }[] = [
    { icon: <MousePointer2 />, title: "Select (A)", mode: ToolMode.SELECT },
    { icon: <RectBboxIcon />, title: "Draw bbox (R)", mode: ToolMode.DRAW_BBOX, disabled: !hasLabels },
    {
      icon: <PolygonIcon />,
      title: "Draw polygon (P)",
      mode: ToolMode.DRAW_POLYGON,
      disabled: !hasLabels,
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
    {
      icon: <FolderPlus />,
      title: canGroup ? "Group regions (Ctrl+G)" : "Select ≥2 same-label regions to group",
      onClick: () => onGroupSelected?.(),
      disabled: !canGroup,
    },
    { icon: <ZoomIn />, title: "Zoom in", onClick: onZoomIn },
    { icon: <ZoomOut />, title: "Zoom out", onClick: onZoomOut },
    { icon: <Maximize2 />, title: "Fit to screen (F)", onClick: onResetView },
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
    <div className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-white/95 p-2 shadow-[0_0_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
      {modeTools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          className={cn(
            toolButtonClass,
            toolMode === tool.mode &&
              "bg-emerald-500/10 text-black hover:bg-emerald-500/[0.18] hover:text-black",
            tool.disabled && "cursor-not-allowed opacity-[0.35]",
          )}
          title={tool.title}
          onClick={() => onSetToolMode(tool.mode)}
          disabled={tool.disabled}
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
      <div className="my-1 h-px bg-black/10" />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            toolButtonClass,
            "w-auto gap-0.5 px-1.5",
            preAnnotateSegDisabled && preAnnotateDetDisabled && "cursor-not-allowed opacity-[0.35]",
          )}
          title="Pre-annotate with model"
          disabled={preAnnotatePending}
        >
          {preAnnotatePending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          <ChevronDown className="!size-3 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" sideOffset={6}>
          <DropdownMenuItem
            disabled={preAnnotateSegDisabled}
            onClick={() => onPreAnnotate(PreAnnotateModelTypeEnum.SEGMENTATION)}
            title={preAnnotateSegDisabledReason}
          >
            Segmentation
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={preAnnotateDetDisabled}
            onClick={() => onPreAnnotate(PreAnnotateModelTypeEnum.DETECTION)}
            title={preAnnotateDetDisabledReason}
          >
            Detection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        className={cn(
          toolButtonClass,
          preAnnotateSettingsDisabled && "cursor-not-allowed opacity-[0.35]",
        )}
        title={preAnnotateSettingsDisabledReason ?? "Pre-annotate settings"}
        onClick={onOpenPreAnnotateSettings}
        disabled={preAnnotateSettingsDisabled}
      >
        <Settings />
      </button>
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
