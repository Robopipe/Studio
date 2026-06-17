import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { BaseSchemes } from "rete";
import type { AreaPlugin } from "rete-area-plugin";

// Uses a real DOM element instead of a CSS background on the container so the
// dot pattern pans and zooms together with the Rete area transform.
export function setupBackground<S extends BaseSchemes, K>(
  area: AreaPlugin<S, K>,
) {
  const background = document.createElement("div");

  Object.assign(background.style, {
    display: "table",
    zIndex: "-1",
    position: "absolute",
    top: "-200000px",
    left: "-200000px",
    width: "400000px",
    height: "500000px",
    opacity: "1",
    backgroundImage:
      "radial-gradient(var(--color-zinc-200) 1px, transparent 1px)",
    backgroundSize: `${GRID}px ${GRID}px`,
  });

  area.area.content.add(background);
}
