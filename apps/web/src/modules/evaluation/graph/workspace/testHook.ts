import {
  BooleanConnection,
  type BooleanOperator,
} from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type { EvalLimitItemOperator } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type {
  LimitItemProps,
  LogicalProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";

export type TestHookHandle = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  /**
   *  Programmatically create a connection - bypasses UI drag for tests that
   *  need a pre-built graph as a fixture.
   */
  addBooleanConnection: (
    sourceId: string,
    targetId: string,
    operator?: BooleanOperator,
  ) => Promise<void>;
  addLimitItemConnection: (
    sourceId: string,
    targetId: string,
    operator: EvalLimitItemOperator,
  ) => Promise<void>;
};

declare global {
  interface Window {
    __editor?: TestHookHandle;
  }
}

/**
 * Exposes the live editor + area on `window.__editor` so Playwright tests can
 * make state-level assertions while still driving the UI through real gestures.
 *
 * Gated on the VITE_E2E env flag - set only by playwright.config.ts.
 * Normal dev and production builds receive an undefined `__editor`.
 */
export function installTestHook(handle: {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
}) {
  if (!import.meta.env.VITE_E2E) return;
  const { editor } = handle;
  // FIX(structure): the hook is installed on window but never uninstalled — fix: return a cleanup that deletes window.__editor and invoke it from the editor's destroy path in Workspace; why: after unmount (or the StrictMode double-mount) the global can reference a destroyed editor, making e2e assertions read stale state.
  window.__editor = {
    ...handle,
    addBooleanConnection: async (sourceId, targetId, operator = "TRUE") => {
      // FIX(error-handling): getNode may return undefined and the cast hides it (same in addLimitItemConnection below), so a wrong fixture id fails deep inside the connection constructor with a cryptic error — fix: throw new Error(`node ${sourceId} not found`) when the lookup fails; why: e2e failures should point at the bad id, not at rete internals.
      const source = editor.getNode(sourceId) as LogicalProps;
      const target = editor.getNode(targetId) as LogicalProps;
      await editor.addConnection(
        new BooleanConnection(source, "out", target, "in", operator),
      );
    },
    addLimitItemConnection: async (sourceId, targetId, operator) => {
      const source = editor.getNode(sourceId) as LimitItemProps;
      const target = editor.getNode(targetId) as LimitItemProps;
      await editor.addConnection(
        new LimitItemConnection(source, "out", target, "in", operator),
      );
    },
  };
}
