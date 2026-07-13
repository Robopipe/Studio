import { isFetchBaseQueryError } from "@/core/auth/utils/authErrors";
import { getRandomHex } from "@/lib/color";
import { Button, buttonVariants } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { Label } from "@repo/schema";
import { Plus } from "lucide-react";
import { useState } from "react";

export interface CreateLabelPopoverProps {
  /** Currently loaded labels, used for the client-side duplicate-name check. */
  existingLabels: Label[];
  /** Resolves on success (popover closes); throws to keep the popover open
   *  with an inline error and the typed name preserved. */
  onCreate: (input: { name: string; color: string }) => Promise<void>;
}

const extractErrorMessage = (error: unknown): string => {
  if (isFetchBaseQueryError(error)) {
    const data = error.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (error.status === 409) {
      return "A label with this name already exists";
    }
  }
  return "Could not create label. Please try again.";
};

export const CreateLabelPopover = ({
  existingLabels,
  onCreate,
}: CreateLabelPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(getRandomHex);
  // Separate from `color` so a partially-typed hex (e.g. "#a") doesn't get
  // submitted — only a full valid hex commits to `color`, mirroring
  // ColorPicker's own hex-input validation.
  const [colorInput, setColorInput] = useState(color);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    const next = getRandomHex();
    setColor(next);
    setColorInput(next);
    setError(null);
  };

  const handleNativeColorChange = (next: string) => {
    setColor(next);
    setColorInput(next);
  };

  const handleHexInputChange = (next: string) => {
    setColorInput(next);
    if (/^#[0-9A-Fa-f]{6}$/.test(next)) {
      setColor(next);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a label name");
      return;
    }
    if (existingLabels.some((l) => l.name === trimmed)) {
      setError("A label with this name already exists");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ name: trimmed, color });
      setOpen(false);
      reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label="Create label"
        className={buttonVariants({ variant: "outline", size: "icon-sm" })}
      >
        <Plus />
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64">
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Label name"
            value={name}
            className="h-8 text-xs"
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => handleNativeColorChange(e.target.value)}
              className="h-8 w-10 shrink-0 cursor-pointer rounded-md border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
            />
            <Input
              value={colorInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              className="h-8 font-mono text-xs"
              maxLength={7}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-fit"
          >
            Create
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
