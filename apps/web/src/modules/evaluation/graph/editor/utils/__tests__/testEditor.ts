import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";

export function createTestEditor(): NodeEditor<Schemes> {
  return new NodeEditor<Schemes>();
}

/**
 * Minimal AreaPlugin stub for headless tests. The deserializer calls
 * area.translate / area.update purely for visual updates; in tests we just
 * need them to be awaitable no-ops.
 */
export function createTestArea(): AreaPlugin<Schemes, AreaExtra> {
  const stub = {
    translate: async () => {},
    update: async () => {},
  };

  return stub as unknown as AreaPlugin<Schemes, AreaExtra>;
}
