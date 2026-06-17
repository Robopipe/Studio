import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type {
  NodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import {
  canBeChildOf,
  canHaveChildren,
} from "@/modules/evaluation/graph/editor/utils/scopes";
import type { NodeEditor, NodeId } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { ScopesPlugin } from "rete-scopes-plugin";

type ScopePreset = Parameters<ScopesPlugin<Schemes>["addPreset"]>[0];

function getNodeViewBox(
  area: AreaPlugin<Schemes, AreaExtra>,
  editor: NodeEditor<Schemes>,
  nodeId: NodeId,
) {
  const node = editor.getNode(nodeId);
  const view = area.nodeViews.get(nodeId);

  if (!node || !view) return null;

  return {
    node,
    view,
    x: view.position.x,
    y: view.position.y,
    width: node.width,
    height: node.height,
  };
}

function isPointInsideBox(
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

function getCompatibleParentIds(
  editor: NodeEditor<Schemes>,
  draggedIds: NodeId[],
): Set<NodeId> {
  const draggedNodes = draggedIds
    .map((id) => editor.getNode(id))
    .filter((node): node is NodeProps => !!node);

  const compatibleParentIds = new Set<NodeId>();

  for (const candidate of editor.getNodes()) {
    if (draggedIds.includes(candidate.id)) continue;
    if (!canHaveChildren(candidate)) continue;

    const acceptsAllDraggedNodes = draggedNodes.every((child) =>
      canBeChildOf(child, candidate),
    );

    if (acceptsAllDraggedNodes) {
      compatibleParentIds.add(candidate.id);
    }
  }

  return compatibleParentIds;
}

function clearScopeClasses(
  area: AreaPlugin<Schemes, AreaExtra>,
  editor: NodeEditor<Schemes>,
) {
  for (const node of editor.getNodes()) {
    const view = area.nodeViews.get(node.id);
    const element = view?.element;

    if (!element) continue;

    element.classList.remove(
      "opacity-25",
      "transition-opacity",
      "duration-150",
    );
  }
}

function applyScopeClasses(
  area: AreaPlugin<Schemes, AreaExtra>,
  editor: NodeEditor<Schemes>,
  draggedIds: NodeId[],
) {
  clearScopeClasses(area, editor);

  const compatibleParentIds = getCompatibleParentIds(editor, draggedIds);

  for (const node of editor.getNodes()) {
    const view = area.nodeViews.get(node.id);
    const element = view?.element;

    if (!element) continue;

    if (draggedIds.includes(node.id)) continue;
    if (compatibleParentIds.has(node.id)) continue;

    element.classList.add("opacity-25", "transition-opacity", "duration-150");
  }
}

async function reassignParentWithRules(args: {
  ids: NodeId[];
  pointer: { x: number; y: number };
  area: AreaPlugin<Schemes, AreaExtra>;
  editor: NodeEditor<Schemes>;
  scopes: ScopesPlugin<Schemes>;
}) {
  const { ids, pointer, area, editor, scopes } = args;

  if (!ids.length) return;

  const movedNodes = ids
    .map((id) => editor.getNode(id))
    .filter((node): node is NodeProps => !!node);

  if (!movedNodes.length) return;

  const holderChildren = Array.from(area.area.content.holder.childNodes);

  const candidateParents = editor
    .getNodes()
    .filter((node) => !ids.includes(node.id))
    .filter((node) => canHaveChildren(node))
    .map((node) => {
      const box = getNodeViewBox(area, editor, node.id);
      if (!box) return null;
      if (!isPointInsideBox(pointer, box)) return null;

      return {
        node,
        zIndex: holderChildren.indexOf(box.view.element),
      };
    })
    .filter((item): item is { node: NodeProps; zIndex: number } => !!item)
    .sort((a, b) => b.zIndex - a.zIndex)
    .map((item) => item.node);

  const affectedParentIds = new Set<NodeId>();

  for (const child of movedNodes) {
    const previousParentId = child.parent;

    if (previousParentId) {
      affectedParentIds.add(previousParentId);
    }

    child.parent = undefined;

    const newParent = candidateParents.find((candidate) =>
      canBeChildOf(child, candidate),
    );

    if (newParent) {
      child.parent = newParent.id;
      affectedParentIds.add(newParent.id);
    }
  }

  for (const parentId of affectedParentIds) {
    await scopes.update(parentId);
  }
}

export function setupCustomScopePreset(
  scopes: ScopesPlugin<Schemes>,
  timeout = 250,
): ScopePreset {
  return (_params, context) => {
    const area = context.area as AreaPlugin<Schemes, AreaExtra>;
    const editor = context.editor as NodeEditor<Schemes>;

    let picked: { timeoutId: number } | null = null;
    let scopeCandidateIds: NodeId[] = [];

    function cancelPick() {
      if (!picked) return;

      window.clearTimeout(picked.timeoutId);
      picked = null;
    }

    function beginPick(id: NodeId) {
      cancelPick();

      const timeoutId = window.setTimeout(() => {
        const selectedIds = editor
          .getNodes()
          .filter((node) => node.selected)
          .map((node) => node.id);

        const ids = selectedIds.length ? selectedIds : [id];

        scopeCandidateIds = ids;

        applyScopeClasses(area, editor, ids);

        void scopes.emit({
          type: "scopepicked",
          data: { ids },
        });
      }, timeout);

      picked = { timeoutId };
    }

    function releasePicked(): NodeId[] {
      const ids = [...scopeCandidateIds];

      cancelPick();
      scopeCandidateIds = [];

      clearScopeClasses(area, editor);

      void scopes.emit({
        type: "scopereleased",
        data: { ids },
      });

      return ids;
    }

    area.addPipe(async (ctx) => {
      if (!ctx || typeof ctx !== "object" || !("type" in ctx)) return ctx;

      if (ctx.type === "nodepicked") {
        beginPick(ctx.data.id);
        return ctx;
      }

      if (ctx.type === "nodetranslated") {
        cancelPick();
        return ctx;
      }

      if (ctx.type === "nodedragged") {
        const ids = releasePicked();

        await reassignParentWithRules({
          ids,
          pointer: area.area.pointer,
          area,
          editor,
          scopes,
        });

        return ctx;
      }

      return ctx;
    });
  };
}
