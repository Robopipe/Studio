/** Generates a random 6-digit hex color, e.g. "#a3c1f2". Used to seed new
 * label colors before the user picks one explicitly. */
export const getRandomHex = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex.padStart(6, "0")}`;
};
