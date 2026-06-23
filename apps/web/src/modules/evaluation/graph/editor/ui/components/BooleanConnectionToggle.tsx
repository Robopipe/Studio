import { Button } from "@/modules/shadcn/ui/button";

type Props = {
  x: number;
  y: number;
  label: string;
  onToggle: () => void;
};

export function BooleanConnectionToggle(props: Props) {
  const { x, y, label, onToggle } = props;

  return (
    <div
      className="pointer-events-none absolute z-[9999] -translate-x-1/2 -translate-y-1/2"
      style={{
        left: x,
        top: y,
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
