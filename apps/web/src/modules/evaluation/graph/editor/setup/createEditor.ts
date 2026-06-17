import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { NodeEditor } from "rete";
import { AreaExtensions, AreaPlugin } from "rete-area-plugin";
import { type ContextMenuExtra } from "rete-context-menu-plugin";
import { HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { type ReactArea2D } from "rete-react-plugin";
import { setupArrange } from "./setupArrange";
import { setupBackground } from "./setupBackground";
import { setupConnection } from "./setupConnections";
import { setupContextMenu } from "./setupContextMenu";
import { setupKeyListeners } from "./setupKeyListeners";
import { setupRender } from "./setupRender";
import { setupScopes } from "./setupScopes";
import { setupSelector } from "./setupSelector";
import { setupValidation } from "./setupValidation";

export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra;

/**
 * Bootstraps the Rete editor inside the given DOM container.
 *
 * Rete separates data from rendering:
 *   NodeEditor  — pure data graph (nodes, connections, no DOM)
 *   AreaPlugin  — visual canvas (pan, zoom, drag, renders nodes into the DOM)
 *
 * Sub-plugins attach to the area, not the editor, because they deal with the visual layer.
 *
 * Plugins must be fully configured (presets, pipes) before being used via .use(),
 * otherwise early events may be missed.
 */
export type CreateEditorOptions = {
  /** Toggles the host's full-screen state; bound to the `f` keyboard shortcut. */
  toggleFullscreen?: () => void;
  /**
   * Returns the current selectable label options for Limit nodes. Read lazily
   * (not snapshotted) so async-loaded project labels are picked up without
   * recreating the editor.
   */
  getLabels?: () => LabelOption[];
};

export async function createEditor(
  container: HTMLElement,
  log: (text: string, type: "info" | "error") => void,
  options: CreateEditorOptions = {},
) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const history = new HistoryPlugin<Schemes>();

  const getLabels = options.getLabels ?? (() => []);

  const connection = setupConnection({ editor, area, log });
  const render = setupRender({ editor, area });
  const scopes = setupScopes({ editor, area });
  const validation = setupValidation({ editor, area });
  const arrange = setupArrange({ editor, area, scopes });
  const contextMenu = setupContextMenu({
    editor,
    area,
    render,
    history,
    getLabels,
  });

  history.addPreset(HistoryPresets.classic.setup());

  editor.use(area);
  area.use(contextMenu);
  area.use(scopes);
  area.use(connection);
  area.use(render);
  area.use(history);
  area.use(arrange.plugin);

  AreaExtensions.restrictor(area, {
    scaling: {
      min: 0.4,
      max: 1,
    },
    translation: false,
  });

  AreaExtensions.showInputControl(area);
  AreaExtensions.snapGrid(area, { size: GRID });

  const { selectableNodes } = setupSelector({ editor, area });

  const keyListeners = setupKeyListeners({
    editor,
    area,
    container,
    selectableNodes,
    history,
    connection,
    getLabels,
    toggleFullscreen: options.toggleFullscreen,
  });

  window.addEventListener("keydown", keyListeners.handler);

  setupBackground(area);

  return {
    editor,
    area,
    validation,
    arrange,
    selectableNodes,
    destroy: () => {
      window.removeEventListener("keydown", keyListeners.handler);
      keyListeners.dispose();
      validation.destroy();
      area.destroy();
    },
  };
}
