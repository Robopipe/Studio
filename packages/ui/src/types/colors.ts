export type ColorLevel =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;
export type ColorShade =
  | "pear"
  | "emerald"
  | "neon"
  | "blue"
  | "violet"
  | "red"
  | "gray";

export type PaletteColor = `${ColorShade}-${ColorLevel}`;

export type SemanticColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "disabled";

export type TextColor =
  | PaletteColor
  | SemanticColor
  | "text-primary"
  | "text-secondary"
  | "text-disabled"
  | "text-white-primary"
  | "text-white-secondary"
  | "text-white-disabled";
