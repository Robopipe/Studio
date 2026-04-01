import { hyperparamsConfigSchema } from "@repo/schema";
import { Button, CloseIcon, Text } from "@repo/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { HYPERPARAMS_PRESETS } from "../presets";
import styles from "./HyperparamsModal.module.scss";
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

  const zodLinterExtension = useMemo(
    () => createZodLinter(hyperparamsConfigSchema),
    [],
  );

  const { containerRef, setValue } = useCodeMirror({
    initialValue: editorValue,
    onChange: (val) => {
      setEditorValue(val);
    },
    extensions: [zodLinterExtension],
  });

  // Debounced validation for the error list below the editor
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setErrors(validateJson(editorValue));
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [editorValue]);

  const handlePresetChange = (presetId: string) => {
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
    const formatted = JSON.stringify(parsed, null, 2);
    onApply(formatted);
  };

  const selectedPresetDef = HYPERPARAMS_PRESETS.find(
    (p) => p.id === selectedPreset,
  );

  return (
    <>
      <div className={styles.dialogBackdrop} onClick={onClose} />
      <div className={styles.dialogPopup}>
        <div className={styles.dialogHeader}>
          <Text weight="600" variant="text-16">
            Custom Training Hyperparameters
          </Text>
          <button className={styles.dialogClose} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.dialogBody}>
          <div className={styles.presetRow}>
            <Text variant="text-14" weight="500">
              Preset:
            </Text>
            <select
              className={styles.presetSelect}
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="">Select a preset...</option>
              {HYPERPARAMS_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            {selectedPresetDef && (
              <span className={styles.presetDescription}>
                {selectedPresetDef.description}
              </span>
            )}
          </div>

          <div ref={containerRef} className={styles.editorContainer} />

          {errors.length > 0 && (
            <ul className={styles.errorList}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <Text variant="text-12" color="text-secondary" className={styles.infoText}>
            Override training config with a JSON object. Supported top-level
            keys: <code>model</code>, <code>loader</code>, <code>trainer</code>,{" "}
            <code>tracker</code>.{" "}
            <a
              href="https://github.com/luxonis/luxonis-train/blob/main/configs/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docsLink}
            >
              View full config reference →
            </a>
          </Text>
        </div>

        <div className={styles.dialogFooter}>
          <Button variant="outlined" onClick={handleFormat}>
            Format JSON
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Go Back
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </>
  );
};
