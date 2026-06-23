import { ValidatableControl } from "@/modules/evaluation/graph/editor/controls/core/validatableControl";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { ValidationResult } from "@/modules/evaluation/graph/editor/validation/types";
import { validateGraph } from "@/modules/evaluation/graph/editor/validation/validateGraph";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { AreaExtra } from "./createEditor";

type ValidationController = {
  runValidation: () => Promise<ValidationResult>;
  validateNow: () => Promise<ValidationResult>;
  enableLiveValidation: () => void;
  disableLiveValidation: () => void;
  isLiveValidationEnabled: () => boolean;
  clearValidation: () => Promise<void>;
  destroy: () => void;
};

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
};

type SubscribableControl = {
  subscribe: (listener: () => void) => () => void;
};

function isSubscribableControl(
  control: unknown,
): control is SubscribableControl {
  return (
    typeof control === "object" &&
    control !== null &&
    "subscribe" in control &&
    typeof control.subscribe === "function"
  );
}

/**
 * Sets up graph validation and returns a controller to drive it externally.
 *
 * Validation runs are coalesced: if a run is already in progress when a new
 * trigger arrives, it is queued and executed immediately after the current run
 * finishes. This prevents redundant re-renders when many nodes/connections
 * change at once (e.g. during layout or deserialization).
 *
 * Live validation (opt-in via `enableLiveValidation`) runs automatically on
 * graph structure changes and control value changes. It is off by default so
 * bulk operations can suppress noisy intermediate error states.
 */
export function setupValidation(props: Props): ValidationController {
  const { editor, area } = props;

  let liveValidationEnabled = false;

  let validationQueued = false;
  let runningPromise: Promise<ValidationResult> | null = null;

  let unsubscribeControlChanges: Array<() => void> = [];

  async function runOnce(): Promise<ValidationResult> {
    const result = validateGraph(editor);
    const nodes = editor.getNodes();

    for (const node of nodes) {
      node.setIssues(result.nodeIssues.get(node.id) ?? []);

      for (const [controlKey, control] of Object.entries(node.controls)) {
        if (control instanceof ValidatableControl) {
          control.setValidationIssues(
            result.controlIssues.get(node.id)?.[controlKey] ?? [],
          );
        }
      }
    }

    await Promise.all(nodes.map((node) => area.update("node", node.id)));

    return result;
  }

  function runValidation(): Promise<ValidationResult> {
    if (runningPromise) {
      validationQueued = true;
      return runningPromise;
    }

    runningPromise = (async () => {
      let latest!: ValidationResult;
      do {
        validationQueued = false;
        latest = await runOnce();
      } while (validationQueued);
      return latest;
    })();

    return runningPromise.finally(() => {
      runningPromise = null;
    });
  }

  function validateNow() {
    return runValidation();
  }

  function requestValidation() {
    if (!liveValidationEnabled) return;

    void runValidation();
  }

  function unsubscribeFromControlChanges() {
    for (const unsubscribe of unsubscribeControlChanges) {
      unsubscribe();
    }

    unsubscribeControlChanges = [];
  }

  function subscribeToControlChanges() {
    unsubscribeFromControlChanges();

    for (const node of editor.getNodes()) {
      for (const control of Object.values(node.controls)) {
        if (!isSubscribableControl(control)) continue;

        const unsubscribe = control.subscribe(() => {
          requestValidation();
        });

        unsubscribeControlChanges.push(unsubscribe);
      }
    }
  }

  function refreshControlSubscriptions() {
    subscribeToControlChanges();
  }

  function enableLiveValidation() {
    liveValidationEnabled = true;
    refreshControlSubscriptions();
  }

  function disableLiveValidation() {
    liveValidationEnabled = false;
    unsubscribeFromControlChanges();
  }

  function isLiveValidationEnabled() {
    return liveValidationEnabled;
  }

  async function clearValidation() {
    const nodes = editor.getNodes();

    for (const node of nodes) {
      node.clearIssues();

      for (const control of Object.values(node.controls)) {
        if (control instanceof ValidatableControl) {
          control.clearValidationIssues();
        }
      }
    }

    await Promise.all(nodes.map((node) => area.update("node", node.id)));
  }

  function destroy() {
    unsubscribeFromControlChanges();
  }

  area.addPipe((context) => {
    if (
      liveValidationEnabled &&
      (context.type === "nodecreated" || context.type === "noderemoved")
    ) {
      refreshControlSubscriptions();
    }

    if (!liveValidationEnabled) return context;

    if (
      context.type === "nodecreated" ||
      context.type === "noderemoved" ||
      context.type === "connectioncreated" ||
      context.type === "connectionremoved"
    ) {
      void runValidation();
    }

    if (context.type === "nodedragged") {
      // nodedragged fires before the final position is committed; defer by one
      // tick so position-dependent rules see the settled coordinates.
      setTimeout(() => {
        void runValidation();
      }, 0);
    }

    return context;
  });

  subscribeToControlChanges();

  return {
    runValidation,
    validateNow,
    enableLiveValidation,
    disableLiveValidation,
    isLiveValidationEnabled,
    clearValidation,
    destroy,
  };
}
