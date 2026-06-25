import { cn } from "@/lib/utils";
import type { LabelControl } from "@/modules/evaluation/graph/editor/controls/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useSyncExternalStore } from "react";

type Props = {
  data: LabelControl;
};

export const LabelControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);
  const selected = data.options.find((label) => String(label.id) === value);

  return (
    <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
      <Select
        value={value ?? "__NONE__"}
        onValueChange={(next) =>
          data.setValue(next === "__NONE__" ? null : next)
        }
      >
        <SelectTrigger
          size="sm"
          title={selected?.name}
          className={cn(
            "w-full min-w-0 bg-white",
            // Match the name control: a chosen label uses the default text colour,
            // only the placeholder stays muted.
            selected ? "text-foreground" : "text-zinc-400",
            "[&>span]:block [&>span]:truncate",
            data.hasValidationErrors && "border-red-500 focus:ring-red-500",
          )}
        >
          <SelectValue placeholder="Select label">
            <span className="block truncate">
              {selected?.name ?? (value === null ? "Select label" : undefined)}
            </span>
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="text-zinc-400">
          {!data.required && <SelectItem value="__NONE__">No label</SelectItem>}
          {data.options.map((label) => (
            <SelectItem key={label.id} value={String(label.id)}>
              {label.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
