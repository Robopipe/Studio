import type {
  ConnProps,
  NodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";

export class ValidationGraph {
  readonly nodes: NodeProps[];
  readonly connections: ConnProps[];

  private nodeById = new Map<string, NodeProps>();
  private childrenByParent = new Map<string, NodeProps[]>();
  private incomingByNode = new Map<string, ConnProps[]>();
  private outgoingByNode = new Map<string, ConnProps[]>();

  constructor(editor: NodeEditor<Schemes>) {
    this.nodes = editor.getNodes();
    this.connections = editor.getConnections();

    for (const node of this.nodes) {
      this.nodeById.set(node.id, node);

      if (node.parent) {
        const children = this.childrenByParent.get(node.parent) ?? [];
        children.push(node);
        this.childrenByParent.set(node.parent, children);
      }
    }

    for (const connection of this.connections) {
      const incoming = this.incomingByNode.get(connection.target) ?? [];
      incoming.push(connection);
      this.incomingByNode.set(connection.target, incoming);

      const outgoing = this.outgoingByNode.get(connection.source) ?? [];
      outgoing.push(connection);
      this.outgoingByNode.set(connection.source, outgoing);
    }
  }

  getNode(id: string) {
    return this.nodeById.get(id);
  }

  getChildren(parentId: string) {
    return this.childrenByParent.get(parentId) ?? [];
  }

  getIncoming(nodeId: string) {
    return this.incomingByNode.get(nodeId) ?? [];
  }

  getOutgoing(nodeId: string) {
    return this.outgoingByNode.get(nodeId) ?? [];
  }

  haveSameScope(a: NodeProps, b: NodeProps) {
    return a.parent === b.parent;
  }
}
