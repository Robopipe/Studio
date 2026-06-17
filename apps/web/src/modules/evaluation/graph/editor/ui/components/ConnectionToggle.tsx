// FIX(naming): file is named ConnectionToggle.tsx but exports BooleanConnectionToggle, and the component is not boolean-specific — it renders any two-state label toggle (also used for AND/OR limit-item connections via ToggleConnectionView) — fix: rename the export to ConnectionToggle to match the filename and its generic usage; why: the "Boolean" prefix misleads readers about where this component applies and breaks file/export symmetry used elsewhere in this folder.
import { Button } from "@/modules/shadcn/ui/button";

type Props = {
  x: number;
  y: number;
  label: string;
  onToggle: () => void;
};

export function BooleanConnectionToggle(props: Props) {
  const { x, y, label, onToggle } = props;

  // FIX(duplication): the centering offsets (x - 24, y - 12) hardcode half of the h-6/w-12 dimensions that are themselves duplicated in both the wrapper div and the Button className — fix: define the size once (e.g. const W = 48, H = 24, or -translate-x-1/2 -translate-y-1/2 instead of manual offsets) and derive everything from it; why: resizing the toggle requires editing four places that must stay in sync or the button drifts off the connection midpoint.
  return (
    <div
      className="pointer-events-none absolute z-[9999] h-6 w-12"
      style={{
        left: x - 24,
        top: y - 12,
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="pointer-events-auto h-6 w-12 rounded-full border-2 border-zinc-300 bg-white px-0 text-[11px] font-semibold text-zinc-400 shadow-sm hover:border-zinc-400"
      >
        {label.toUpperCase()}
      </Button>
    </div>
  );
}
