import {
  MAGNETIC_SNAP_DISTANCE,
  MAGNETIC_SNAP_SOCKET_OFFSET,
} from "@/modules/evaluation/graph/editor/constants";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset, type NodeEditor } from "rete";
import type { Area2D, AreaPlugin } from "rete-area-plugin";
import {
  type SocketData,
  createPseudoconnection,
} from "rete-connection-plugin";
import { validateConnection } from "./connectionRules";
import type { AreaExtra } from "./createEditor";

type Point = { x: number; y: number };

function nearest<T extends Point>(
  points: T[],
  target: Point,
  max: number,
): T | null {
  let best: { point: T; dist: number } | null = null;
  for (const point of points) {
    const dist = Math.hypot(point.x - target.x, point.y - target.y);
    if (dist > max) continue;
    if (!best || dist < best.dist) best = { point, dist };
  }
  return best?.point ?? null;
}

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
};

/**
 * Magnetic connections — snap a new connection to the nearest compatible socket
 * within DISTANCE so the user doesn't have to aim precisely.
 *
 * Deliberately does NOT add a pipe to the connection plugin: rete's re-pick flow
 * (PickedExisting) finishes setting itself up in an async microtask after the
 * connectionpick emit, and any extra connection pipe shifts that timing enough
 * to break re-pick.
 */
export function setupMagneticConnection(props: Props): { dispose: () => void } {
  const { editor, area } = props;

  const sockets = new Map<HTMLElement, SocketData>();
  const pseudo = createPseudoconnection<Schemes, Area2D<Schemes>>({
    isMagnetic: true,
  } as Partial<Schemes["Connection"]>);
  const pseudoArea = area as unknown as AreaPlugin<Schemes, Area2D<Schemes>>;

  let picked: SocketData | null = null;
  let target: (SocketData & Point) | null = null;
  let cancelled = false;

  function inputConnection(socket: SocketData) {
    if (socket.side !== "input") return null;
    return (
      editor
        .getConnections()
        .find(
          (conn) =>
            conn.target === socket.nodeId &&
            String(conn.targetInput) === socket.key,
        ) ?? null
    );
  }

  function findSocketData(
    nodeId: string,
    side: SocketData["side"],
    key: string,
  ): SocketData | null {
    for (const data of sockets.values()) {
      if (data.nodeId === nodeId && data.side === side && data.key === key) {
        return data;
      }
    }
    return null;
  }

  function clientToContent(clientX: number, clientY: number): Point {
    const box = area.container.getBoundingClientRect();
    const { x, y, k } = area.area.transform;
    return { x: (clientX - box.left - x) / k, y: (clientY - box.top - y) / k };
  }

  function socketContentCenter(element: HTMLElement): Point {
    const rect = element.getBoundingClientRect();
    return clientToContent(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
  }

  function socketAt(clientX: number, clientY: number): SocketData | null {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      const data = sockets.get(element as HTMLElement);
      if (data) return data;
    }
    return null;
  }

  function asSourceTarget(from: SocketData, to: SocketData) {
    if (from.side === to.side) return null;
    const [source, target] = from.side === "output" ? [from, to] : [to, from];
    return {
      source: { nodeId: source.nodeId, key: source.key },
      target: { nodeId: target.nodeId, key: target.key },
    };
  }

  function canConnect(from: SocketData, to: SocketData): boolean {
    const ordered = asSourceTarget(from, to);
    return ordered ? validateConnection(editor, ordered.source, ordered.target).ok : false;
  }

  function clearPreview() {
    target = null;
    if (pseudo.isMounted()) pseudo.unmount(pseudoArea);
  }

  function reset() {
    picked = null;
    cancelled = false;
    clearPreview();
  }

  function refreshMagnet(clientX: number, clientY: number) {
    if (!picked) return;
    const source = picked;
    const point = clientToContent(clientX, clientY);

    const candidates: (SocketData & Point)[] = [];
    for (const [element, socket] of sockets) {
      if (socket.side === source.side || socket.nodeId === source.nodeId) {
        continue;
      }
      const center = socketContentCenter(element);
      candidates.push({ ...socket, x: center.x, y: center.y });
    }

    const found = nearest(candidates, point, MAGNETIC_SNAP_DISTANCE);
    target = found && canConnect(source, found) ? found : null;

    if (target) {
      if (!pseudo.isMounted()) pseudo.mount(pseudoArea);
      pseudo.render(
        pseudoArea,
        {
          x:
            target.x +
            (target.side === "input"
              ? -MAGNETIC_SNAP_SOCKET_OFFSET
              : MAGNETIC_SNAP_SOCKET_OFFSET),
          y: target.y,
        },
        source,
      );
    } else if (pseudo.isMounted()) {
      pseudo.unmount(pseudoArea);
    }
  }

  function commit() {
    if (!picked || !target) return;
    const ordered = asSourceTarget(picked, target);
    if (!ordered) return;

    const sourceNode = editor.getNode(ordered.source.nodeId);
    const targetNode = editor.getNode(ordered.target.nodeId);
    if (
      !sourceNode ||
      !targetNode ||
      !validateConnection(editor, ordered.source, ordered.target).ok
    ) {
      return;
    }

    void editor.addConnection(
      new ClassicPreset.Connection(
        sourceNode as ClassicPreset.Node,
        ordered.source.key,
        targetNode as ClassicPreset.Node,
        ordered.target.key,
      ) as unknown as Schemes["Connection"],
    );
  }

  function onPointerDown(event: PointerEvent) {
    reset();
    const socket = socketAt(event.clientX, event.clientY);
    if (!socket) return;

    const existing = inputConnection(socket);
    if (existing) {
      picked = findSocketData(
        existing.source,
        "output",
        String(existing.sourceOutput),
      );
      return;
    }

    picked = socket;
  }

  function onPointerMove(event: PointerEvent) {
    if (!picked) return;
    if (event.buttons === 0) {
      reset();
      return;
    }
    refreshMagnet(event.clientX, event.clientY);
  }

  function onPointerUp(event: PointerEvent) {
    if (picked && target && !cancelled && !socketAt(event.clientX, event.clientY)) commit();
    reset();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && picked) cancelled = true;
  }

  area.addPipe((context) => {
    if (!context || typeof context !== "object" || !("type" in context)) {
      return context;
    }
    if (context.type === "render" && context.data.type === "socket") {
      const data = context.data as unknown as SocketData;
      sockets.set(data.element, data);
    } else if (context.type === "unmount") {
      sockets.delete(context.data.element);
    }
    return context;
  });

  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("keydown", onKeyDown, true);

  return {
    dispose() {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("keydown", onKeyDown, true);
      if (pseudo.isMounted()) pseudo.unmount(pseudoArea);
    },
  };
}
