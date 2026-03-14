import { Input } from "@/modules/shadcn/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { type Column } from "@tanstack/react-table";
import { ListFilterIcon, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

interface ColumnFilterProps<T> {
  column: Column<T, unknown>;
}

export function ColumnFilter<T>({ column }: ColumnFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const columnFilterValue = column.getFilterValue() as string | undefined;
  const [value, setValue] = useState(columnFilterValue ?? "");

  useEffect(() => {
    setValue(columnFilterValue ?? "");
  }, [columnFilterValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      column.setFilterValue(value || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, column]);

  const isActive = !!columnFilterValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className={`cursor-pointer ${
          isActive
            ? "text-primary opacity-100"
            : "text-muted-foreground opacity-60 hover:opacity-100"
        }`}
      >
        <ListFilterIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-48 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Filter..."
          autoFocus
          className="h-8 text-xs"
        />
      </PopoverContent>
    </Popover>
  );
}
