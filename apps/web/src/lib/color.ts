/** Generates a random 6-digit hex color, e.g. "#a3c1f2". Used to seed new
 * label colors before the user picks one explicitly. */
export const getRandomHex = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex.padStart(6, "0")}`;
};

/** Picks black or white text for a given background color so user-chosen
 * label colors stay readable. */
export function getContrastTextColor(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "var(--foreground)"; // color is unvalidated at the API level
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#000000" : "#ffffff";
}
