import { type Diagnostic, linter } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { findPropertyNamePosition } from "./syntaxTreeUtils";

/**
 * Config paths that are managed by the ML service or generated from UI
 * controls. Values set at these paths in custom hyperparameters will be
 * stripped before sending to the backend.
 */
export const RESERVED_HYPERPARAMS_PATHS: Record<string, string> = {
  // ML service infrastructure — overriding these would break training
  "model.name": "Set automatically by the ML service (model identifier)",
  "model.predefined_model.name":
    "Determined automatically by the selected training type",
  "loader.params.dataset_name":
    "Generated automatically by the ML service (dataset identifier)",
  "loader.params.dataset_dir":
    "Generated automatically by the ML service (filesystem path)",
  "tracker.is_tensorboard": "Managed by the ML service",
  "tracker.is_wandb": "Managed by the ML service",
  "tracker.is_mlflow": "Managed by the ML service",
  "tracker.save_directory":
    "Generated automatically by the ML service (filesystem path)",
  "trainer.callbacks":
    "Managed by the ML service (required for training lifecycle)",
  "trainer.accelerator":
    "Set automatically by the ML service based on the platform",
  "trainer.n_workers": "Set automatically by the ML service",
  "trainer.validation_interval": "Set automatically by the ML service",
  "trainer.log_sub_losses": "Set automatically by the ML service",

  // UI-generated — should only be changed via the respective UI controls
  "trainer.epochs": "Use the Epochs field in the training form instead",
  "trainer.preprocessing.augmentations":
    "Use the Augmentations settings in the training form instead",
};

/**
 * Collect all dot-paths present in the object that match a reserved path.
 */
function collectReservedPaths(
  obj: Record<string, unknown>,
  prefix: string,
): string[] {
  const found: string[] = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (path in RESERVED_HYPERPARAMS_PATHS) {
      found.push(path);
    }
    const value = obj[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      found.push(
        ...collectReservedPaths(value as Record<string, unknown>, path),
      );
    }
  }
  return found;
}

/**
 * CodeMirror linter that underlines reserved config keys as warnings.
 */
export function createReservedKeysLinter() {
  return linter(
    (view: EditorView): Diagnostic[] => {
      const doc = view.state.doc.toString().trim();
      if (!doc) return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(doc);
      } catch {
        return [];
      }

      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      ) {
        return [];
      }

      const reserved = collectReservedPaths(
        parsed as Record<string, unknown>,
        "",
      );
      if (reserved.length === 0) return [];

      const diagnostics: Diagnostic[] = [];
      for (const path of reserved) {
        const segments = path.split(".");
        const pos = findPropertyNamePosition(view.state, segments);
        if (pos) {
          diagnostics.push({
            from: pos.from,
            to: pos.to,
            severity: "warning",
            message: `This setting will be ignored: ${RESERVED_HYPERPARAMS_PATHS[path]}`,
          });
        }
      }

      return diagnostics;
    },
    { delay: 500 },
  );
}

/**
 * Recursively remove reserved keys from a config object.
 * Returns the cleaned object and the list of paths that were removed.
 */
export function stripReservedKeys(obj: Record<string, unknown>): {
  cleaned: Record<string, unknown>;
  removed: string[];
} {
  const removed: string[] = [];

  function walk(
    current: Record<string, unknown>,
    prefix: string,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(current)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (path in RESERVED_HYPERPARAMS_PATHS) {
        removed.push(path);
        continue;
      }
      const value = current[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = walk(value as Record<string, unknown>, path);
        if (Object.keys(nested).length > 0) {
          result[key] = nested;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  const cleaned = walk(obj, "");
  return { cleaned, removed };
}
