import {
  BooleanConnection,
  type BooleanOperator,
} from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type {
  LimitItemProps,
  BooleanNodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { EvalLimitItemOperatorEnum } from "@repo/schema";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";

export type TestHookHandle = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  addBooleanConnection: (
    sourceId: string,
    targetId: string,
    operator?: BooleanOperator,
  ) => Promise<void>;
  addLimitItemConnection: (
    sourceId: string,
    targetId: string,
    operator: EvalLimitItemOperatorEnum,
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
}): (() => void) | undefined {
  if (!import.meta.env.VITE_E2E) return;
  const { editor } = handle;

  const requireNode = (id: string) => {
    const node = editor.getNode(id);
    if (!node) throw new Error(`Test hook: node "${id}" not found.`);
    return node;
  };

  const hook: TestHookHandle = {
    ...handle,
    addBooleanConnection: async (sourceId, targetId, operator = "TRUE") => {
      const source = requireNode(sourceId) as BooleanNodeProps;
      const target = requireNode(targetId) as BooleanNodeProps;
      await editor.addConnection(
        new BooleanConnection(source, "out", target, "in", operator),
      );
    },
    addLimitItemConnection: async (sourceId, targetId, operator) => {
      const source = requireNode(sourceId) as LimitItemProps;
      const target = requireNode(targetId) as LimitItemProps;
      await editor.addConnection(
        new LimitItemConnection(source, "out", target, "in", operator),
      );
    },
  };

  window.__editor = hook;

  return () => {
    if (window.__editor === hook) delete window.__editor;
  };
}
