import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import type { RowData } from "@tanstack/react-table";
import { ListFilterIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface HeaderFilterMeta {
  content: ReactNode;
  active?: boolean;
  contentClassName?: string;
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Custom (e.g. server-side) filter UI rendered inside a funnel popover in
     * the column header. Takes precedence over the built-in text ColumnFilter.
     */
    headerFilter?: HeaderFilterMeta;
  }
}

export function HeaderFilterPopover({
  content,
  active = false,
  contentClassName,
}: HeaderFilterMeta) {
  return (
    <Popover>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className={`cursor-pointer ${
          active
            ? "text-primary opacity-100"
            : "text-muted-foreground opacity-60 hover:opacity-100"
        }`}
      >
        <ListFilterIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-64 gap-0 p-1", contentClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
