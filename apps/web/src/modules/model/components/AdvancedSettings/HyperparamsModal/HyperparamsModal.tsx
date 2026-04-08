import { Button } from "@/modules/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { hyperparamsConfigSchema } from "@repo/schema";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { HYPERPARAMS_PRESETS } from "../presets";
import {
  RESERVED_HYPERPARAMS_PATHS,
  createReservedKeysLinter,
  stripReservedKeys,
} from "./reservedKeys";
import { useCodeMirror } from "./useCodeMirror";
import { createZodLinter } from "./zodLinter";

export interface HyperparamsModalProps {
  value: string;
  onApply: (value: string) => void;
  onClose: () => void;
}

function validateJson(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "{}" || trimmed === "{\n  \n}") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return ["Invalid JSON syntax"];
  }

  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
    return ["Must be a JSON object"];
  }

  const result = hyperparamsConfigSchema.safeParse(parsed);
  if (!result.success) {
    return result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });
  }

  return [];
}

export const HyperparamsModal = ({
  value,
  onApply,
  onClose,
}: HyperparamsModalProps) => {
  const [editorValue, setEditorValue] = useState(value.trim() || "{\n  \n}");
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [showReservedPaths, setShowReservedPaths] = useState(false);

  const zodLinterExtension = useMemo(
    () => createZodLinter(hyperparamsConfigSchema),
    [],
  );
  const reservedKeysLinterExtension = useMemo(
    () => createReservedKeysLinter(),
    [],
  );

  const { containerRef, setValue } = useCodeMirror({
    initialValue: editorValue,
    onChange: (val) => {
      setEditorValue(val);
    },
    extensions: [zodLinterExtension, reservedKeysLinterExtension],
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setErrors(validateJson(editorValue));
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [editorValue]);

  const handlePresetChange = (presetId: string | null) => {
    if (!presetId) return;

    const preset = HYPERPARAMS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const currentTrimmed = editorValue.trim();
    const isEmpty =
      !currentTrimmed ||
      currentTrimmed === "{}" ||
      currentTrimmed === "{\n  \n}";

    if (!isEmpty) {
      const confirmed = window.confirm(
        "Replace current content with the selected preset?",
      );
      if (!confirmed) return;
    }

    const json = JSON.stringify(preset.config, null, 2);
    setValue(json);
    setEditorValue(json);
    setSelectedPreset(presetId);
    setErrors([]);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(editorValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setValue(formatted);
      setEditorValue(formatted);
    } catch {
      setErrors(["Cannot format: invalid JSON"]);
    }
  };

  const handleApply = () => {
    const trimmed = editorValue.trim();
    if (!trimmed || trimmed === "{\n  \n}") {
      onApply("");
      return;
    }

    const applyErrors = validateJson(trimmed);
    if (applyErrors.length > 0) {
      setErrors(applyErrors);
      return;
    }

    const parsed = JSON.parse(trimmed);
    const { cleaned, removed } = stripReservedKeys(parsed);

    if (removed.length > 0) {
      const labels = removed.map(
        (path) => `${path}: ${RESERVED_HYPERPARAMS_PATHS[path]}`,
      );
      toast.warning("Some settings were ignored", {
        description: labels.join("\n"),
        duration: 8000,
      });
    }

    const isEmpty = Object.keys(cleaned).length === 0;
    const formatted = isEmpty ? "" : JSON.stringify(cleaned, null, 2);
    onApply(formatted);
  };

  const selectedPresetDef = HYPERPARAMS_PRESETS.find(
    (p) => p.id === selectedPreset,
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[101] flex max-h-[85vh] w-[700px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <span className="text-base font-semibold">
            Custom Training Hyperparameters
          </span>
          <button
            type="button"
            className="flex cursor-pointer items-center border-none bg-none p-1 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Preset:</span>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="min-w-[220px]">
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                {HYPERPARAMS_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPresetDef && (
              <span className="text-xs italic text-muted-foreground">
                {selectedPresetDef.description}
              </span>
            )}
          </div>

          <div
            ref={containerRef}
            className="overflow-hidden rounded-md border border-black/20 [&_.cm-editor]:h-[400px] [&_.cm-editor]:max-h-[50vh] [&_.cm-scroller]:overflow-auto"
          />

          {errors.length > 0 && (
            <ul className="m-0 list-disc pl-4 text-xs text-red-500 [&_li]:mb-1">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <span className="text-xs text-muted-foreground [&_code]:rounded-[3px] [&_code]:bg-black/[0.06] [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-emerald-700">
            Override training config with a JSON object. Supported top-level
            keys: <code>model</code>, <code>loader</code>,{" "}
            <code>trainer</code>, <code>tracker</code>. Some paths are reserved
            and will be ignored.{" "}
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap border-none bg-none p-0 text-emerald-600 hover:underline"
              onClick={() => setShowReservedPaths((prev) => !prev)}
            >
              {showReservedPaths
                ? "Hide reserved paths"
                : "View reserved paths"}
            </button>{" "}
            ·{" "}
            <a
              href="https://github.com/luxonis/luxonis-train/blob/main/configs/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap text-emerald-600 hover:underline"
            >
              View full config reference →
            </a>
          </span>

          {showReservedPaths && (
            <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto rounded-md border border-black/[0.08] bg-black/[0.03] p-3">
              <span className="text-xs font-semibold">Reserved paths</span>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 [&_code]:rounded-[3px] [&_code]:bg-black/[0.06] [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-emerald-700 [&_li]:text-[11px] [&_li]:leading-snug [&_li]:text-muted-foreground">
                {Object.entries(RESERVED_HYPERPARAMS_PATHS).map(
                  ([path, reason]) => (
                    <li key={path}>
                      <code>{path}</code>
                      <span> — {reason}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-black/[0.08] px-6 py-4">
          <Button variant="outline" onClick={handleFormat}>
            Format JSON
          </Button>
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </>
  );
};
