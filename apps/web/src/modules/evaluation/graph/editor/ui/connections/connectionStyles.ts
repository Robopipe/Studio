// Shared Tailwind classes for connection rendering, used by both
// CustomConnectionView (plain connections) and ToggleConnectionView (toggleable
// ones), so the svg canvas and the marching-ants path stay in sync. The
// `dash` keyframes referenced by the animation utility live in global.css.

export const CONNECTION_SVG_CLASS =
  "pointer-events-none absolute z-0 h-[9999px] w-[9999px] overflow-visible";

export const CONNECTION_PATH_CLASS =
  "pointer-events-auto fill-none stroke-[5] stroke-zinc-400 [stroke-dasharray:10_5] [stroke-dashoffset:45] [animation:dash_1s_linear_infinite]";
  
export const MAGNETIC_CONNECTION_PATH_CLASS =
  "pointer-events-none fill-none stroke-[5] stroke-zinc-400 [stroke-dasharray:10_5] [stroke-dashoffset:45] [animation:dash_1s_linear_infinite]";
