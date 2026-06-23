import type { IntegerRangeControl } from "@/modules/evaluation/graph/editor/controls/integerRange";
import { Button } from "@/modules/shadcn/ui/button";
import { ButtonGroup } from "@/modules/shadcn/ui/button-group";
import { Input } from "@/modules/shadcn/ui/input";
import { useEffect, useState, useSyncExternalStore } from "react";

type Props = {
  data: IntegerRangeControl;
};

export const IntegerRangeControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);

  const [limitFromDraft, setLimitFromDraft] = useState(
    formatNullableNumber(value.limitFrom),
  );
  const [limitToDraft, setLimitToDraft] = useState(
    formatNullableNumber(value.limitTo),
  );

  useEffect(() => {
    setLimitFromDraft(formatNullableNumber(value.limitFrom));
    setLimitToDraft(formatNullableNumber(value.limitTo));
  }, [value.limitFrom, value.limitTo]);

  // FIX(bug): when the committed input normalizes to the value already stored, IntegerRangeControl.setValue early-returns without emitting, so the resync effect never fires and the input keeps showing the stale raw text (e.g. value is 6, user types "5.7" -> control rounds to 6 -> no emit -> field still shows "5.7"; same for "-3" when value is 0) — fix: after commit, re-read the snapshot and setLimitFromDraft/setLimitToDraft unconditionally (or resync in onBlur); why: the UI displays a number that differs from the actual committed model value.
  const commitLimitFrom = (raw: string) => {
    data.setLimitFrom(parseNullableNumber(raw));
  };

  const commitLimitTo = (raw: string) => {
    data.setLimitTo(parseNullableNumber(raw));
  };

  return (
    <div
      className="flex w-full gap-1"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ButtonGroup className="min-w-0 flex-1">
        <Input
          className="h-9 px-2.5 text-sm bg-white"
          type="number"
          inputMode="numeric"
          min={data.min}
          step={data.step}
          value={limitFromDraft}
          onChange={(event) => setLimitFromDraft(event.target.value)}
          onBlur={(event) => commitLimitFrom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitLimitFrom(event.currentTarget.value);
            }
          }}
        />

        <Button
          type="button"
          variant="outline"
          className="w-9 px-1.5 pointer-events-none"
          tabIndex={-1}
        >
          <span className="text-xs text-zinc-400">min</span>
        </Button>
      </ButtonGroup>

      <ButtonGroup className="min-w-0 flex-1">
        <Input
          className="h-9 px-2.5 text-sm bg-white"
          type="number"
          inputMode="numeric"
          min={data.min}
          step={data.step}
          value={limitToDraft}
          onChange={(event) => setLimitToDraft(event.target.value)}
          onBlur={(event) => commitLimitTo(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitLimitTo(event.currentTarget.value);
            }
          }}
        />

        <Button
          type="button"
          variant="outline"
          className="w-9 px-1.5 pointer-events-none"
          tabIndex={-1}
        >
          <span className="text-xs text-zinc-400">max</span>
        </Button>
      </ButtonGroup>
    </div>
  );
};

function formatNullableNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function parseNullableNumber(raw: string) {
  if (raw.trim() === "") return null;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}
