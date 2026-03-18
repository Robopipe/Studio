import { buttonVariants } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexInputChange = (v: string) => {
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v);
    }
  };

  const handleNativeColorChange = (v: string) => {
    onChange(v);
    setHexInput(v);
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 w-full justify-start gap-2 px-2 text-xs font-normal",
        )}
      >
        <span
          className="size-4 rounded-sm border"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono">{value.toUpperCase()}</span>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="flex flex-col gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => handleNativeColorChange(e.target.value)}
            className="h-28 w-full cursor-pointer rounded-md border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
          />
          <div className="flex items-center gap-2">
            <span
              className="size-5 shrink-0 rounded-sm border"
              style={{ backgroundColor: value }}
            />
            <Input
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              className="h-7 font-mono text-xs"
              maxLength={7}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
