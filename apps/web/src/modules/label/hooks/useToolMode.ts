import { useCallback, useState } from "react";
import { ToolMode } from "../types/annotations";

export const useToolMode = () => {
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);

  const selectTool = useCallback((mode: ToolMode) => {
    setToolMode(mode);
  }, []);

  return { toolMode, setToolMode: selectTool };
};
