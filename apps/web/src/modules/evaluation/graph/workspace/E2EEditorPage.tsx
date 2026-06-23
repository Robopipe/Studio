import { createEditor } from "@/modules/evaluation/graph/editor/setup/createEditor";
import { focusContainer } from "@/modules/evaluation/graph/editor/setup/focusManager";
import { installTestHook } from "@/modules/evaluation/graph/workspace/testHook";
import { useCallback, useEffect, useRef } from "react";
import { useRete } from "rete-react-plugin";

/**
 * Standalone editor host used only in E2E mode (VITE_E2E). It mounts the graph
 * editor with no project data, backend calls, or auth, exposes the live editor
 * on window.__editor through the test hook, and renders the canvas the Playwright
 * specs drive. It is wired into the router only when VITE_E2E is set and is never
 * reachable in dev or production builds.
 */
export const E2EEditorPage = () => {
  const disposeHookRef = useRef<(() => void) | undefined>(undefined);

  const create = useCallback((el: HTMLElement) => {
    const instance = createEditor(el, () => {});
    Promise.resolve(instance).then((result) => {
      disposeHookRef.current = installTestHook({
        editor: result.editor,
        area: result.area,
      });
      // Single editor in E2E: focus it on mount so keyboard shortcuts work
      // without first clicking the canvas (the specs press shortcuts directly).
      focusContainer(el);
    });
    return instance;
  }, []);

  const [ref] = useRete(create);
  useEffect(() => () => disposeHookRef.current?.(), []);

  return (
    <div className="h-screen w-screen">
      <div ref={ref} className="h-full w-full" data-testid="editor-canvas" />
    </div>
  );
};
