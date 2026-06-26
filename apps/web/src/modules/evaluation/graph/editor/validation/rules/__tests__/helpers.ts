import type {
  ConnProps,
  NodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { ValidationContext } from "@/modules/evaluation/graph/editor/validation/types";
import { ValidationGraph } from "@/modules/evaluation/graph/editor/validation/validationGraph";
import { NodeEditor } from "rete";

export function makeContext(
  nodes: NodeProps[],
  connections: ConnProps[] = [],
): ValidationContext {
  const editor = {
    getNodes: () => nodes,
    getConnections: () => connections,
  };

  const graph = new ValidationGraph(editor as unknown as NodeEditor<Schemes>);

  return {
    graph,
    nodeIssues: new Map(),
    controlIssues: new Map(),
    graphIssues: [],
  };
}

export function conn(source: string, target: string): ConnProps {
  return { id: `${source}->${target}`, source, target } as unknown as ConnProps;
}
