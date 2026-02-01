import {
  CursorIcon,
  HandIcon,
  RedoIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RectBboxIcon,
  PolygonIcon,
  DeleteIcon,
} from "@repo/ui";
import { ToolMode } from "../../types/annotations";
import styles from "./Toolbar.module.scss";

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
}

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
}: ToolbarProps) => {
  const modeTools: { icon: React.ReactNode; title: string; mode: ToolMode; onClick?: () => void }[] = [
    { icon: <CursorIcon />, title: "Select", mode: ToolMode.SELECT },
    { icon: <RectBboxIcon />, title: "Draw bbox", mode: ToolMode.DRAW_BBOX },
    { icon: <PolygonIcon />, title: "Draw polygon", mode: ToolMode.DRAW_POLYGON },
  ];

  const actionTools: { icon: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; mode?: ToolMode }[] = [
    { icon: <UndoIcon />, title: "Undo", onClick: onUndo, disabled: !canUndo },
    { icon: <RedoIcon />, title: "Redo", onClick: onRedo, disabled: !canRedo },
    { icon: <ZoomInIcon />, title: "Zoom in", onClick: onZoomIn },
    { icon: <ZoomOutIcon />, title: "Zoom out", onClick: onZoomOut },
    { icon: <HandIcon />, title: "Pan", onClick: () => onSetToolMode(ToolMode.PAN), mode: ToolMode.PAN },
  ];

  return (
    <div className={styles.toolbar}>
      {modeTools.map((tool) => (
        <button
          key={tool.title}
          className={`${styles.toolButton} ${toolMode === tool.mode ? styles.active : ""}`}
          title={tool.title}
          onClick={tool.onClick ?? (() => onSetToolMode(tool.mode))}
        >
          {tool.icon}
        </button>
      ))}
      <button
        className={`${styles.toolButton} ${!hasSelection ? styles.disabled : ""}`}
        title="Clear"
        onClick={onClear}
        disabled={!hasSelection}
      >
        <DeleteIcon />
      </button>
      <div className={styles.divider} />
      {actionTools.map((tool) => (
        <button
          key={tool.title}
          className={`${styles.toolButton} ${tool.mode && toolMode === tool.mode ? styles.active : ""} ${tool.disabled ? styles.disabled : ""}`}
          title={tool.title}
          onClick={tool.onClick}
          disabled={tool.disabled}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};
