import type { ModelLog } from "@repo/schema";
import { useEffect, useState } from "react";

export interface EpochSliderState {
  /** Index into the `logs` array that is currently selected. */
  safeIndex: number;
  /** The log at the currently selected index (or undefined if no logs). */
  selectedLog: ModelLog | undefined;
  /** Epoch number of the selected log. */
  selectedEpoch: number;
  /** Epoch number of the last (most recent) log. */
  lastEpoch: number;
  /** Max valid index — `max(logs.length - 1, 0)`. */
  max: number;
  /** Slider change handler accepting base-ui's `number | readonly number[]` shape. */
  handleChange: (v: number | readonly number[]) => void;
}

/**
 * Picks an epoch out of a list of logs that have data of interest, keeping the
 * slider auto-pinned to the latest entry until the user scrubs off the end.
 * Designed to be shared by any card that needs to scrub through epoch-indexed
 * log data (per-class metrics, confusion matrix, etc.).
 */
export const useEpochSlider = (logs: ModelLog[]): EpochSliderState => {
  const [index, setIndex] = useState(Math.max(0, logs.length - 1));
  const [stuckToLatest, setStuckToLatest] = useState(true);

  useEffect(() => {
    if (stuckToLatest && logs.length > 0) {
      setIndex(logs.length - 1);
    }
  }, [stuckToLatest, logs.length]);

  const max = Math.max(logs.length - 1, 0);
  const safeIndex = Math.min(Math.max(index, 0), max);
  const selectedLog = logs[safeIndex];

  const handleChange = (v: number | readonly number[]) => {
    const next = typeof v === "number" ? v : v[0] ?? 0;
    setIndex(next);
    setStuckToLatest(next === logs.length - 1);
  };

  return {
    safeIndex,
    selectedLog,
    selectedEpoch: selectedLog?.epoch ?? 0,
    lastEpoch: logs[logs.length - 1]?.epoch ?? 0,
    max,
    handleChange,
  };
};
