import { Label } from "@repo/schema";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ClassSelectProps {
  labels: Label[];
  activeLabelId: number | null;
  onSelectLabel: (labelId: number) => void;
  onOpenSettings?: () => void;
  isLoadingLabels?: boolean;
}

export const ClassSelect = ({
  labels,
  activeLabelId,
  onSelectLabel,
  onOpenSettings,
  isLoadingLabels,
}: ClassSelectProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [labels]);

  // Keep the active label in view when it changes (e.g. arrow-key cycling).
  useEffect(() => {
    if (activeLabelId === null) return;
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(
      `[data-label-id="${activeLabelId}"]`,
    );
    if (!active) return;
    active.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeLabelId]);

  const scrollByAmount = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (labels.length === 0 && !isLoadingLabels) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/95 px-4 py-2 shadow-[0_0_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <span className="text-xs text-muted-foreground">
          Create labels in{" "}
          <button
            type="button"
            className="cursor-pointer font-medium underline hover:text-foreground"
            onClick={onOpenSettings}
          >
            project settings
          </button>
          {" "}before annotating.
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex max-w-full items-center rounded-2xl border border-black/10 bg-white/95 p-2 shadow-[0_0_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          WebkitMaskImage: makeMask(canScrollLeft, canScrollRight),
          maskImage: makeMask(canScrollLeft, canScrollRight),
        }}
      >
        {labels.map((label, index) => {
          const isActive = activeLabelId === label.id;
          const shortcut =
            index < 9 ? String(index + 1) : index === 9 ? "0" : null;
          return (
            <button
              key={label.id}
              data-label-id={label.id}
              type="button"
              onClick={() => onSelectLabel(label.id)}
              title={shortcut ? `${label.name} (${shortcut})` : label.name}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border p-1 transition-all",
                isActive
                  ? "border-current"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
              style={{
                background: isActive
                  ? `color-mix(in oklab, ${label.color}, transparent 85%)`
                  : `color-mix(in oklab, ${label.color}, transparent 90%)`,
                color: isActive ? label.color : undefined,
              }}
            >
              <span
                className="h-6 w-2 shrink-0 rounded-[4px]"
                style={{ background: label.color }}
              />
              <span
                className={cn(
                  "px-1 text-xs leading-4 text-foreground/90",
                  isActive && "font-bold",
                )}
              >
                {label.name}
              </span>
              {shortcut && (
                <kbd className="mr-1 flex h-4 min-w-4 items-center justify-center rounded border border-black/10 bg-white/60 px-1 text-[10px] font-semibold leading-none text-foreground/60">
                  {shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount(-160)}
          className="absolute left-1 top-1/2 z-10 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount(160)}
          className="absolute right-1 top-1/2 z-10 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
};

/** Build a horizontal fade mask that only fades the edges that can scroll. */
const makeMask = (left: boolean, right: boolean) => {
  if (!left && !right) return "none";
  const leftStop = left ? "transparent 0, #000 32px" : "#000 0";
  const rightStop = right
    ? "#000 calc(100% - 32px), transparent 100%"
    : "#000 100%";
  return `linear-gradient(to right, ${leftStop}, ${rightStop})`;
};
