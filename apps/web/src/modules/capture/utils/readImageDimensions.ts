/**
 * Measure a blob's pixel dimensions without decoding + painting. Cheap enough
 * to do inline with interval capture (one bitmap decode per image).
 */
export const readImageDimensions = async (
  blob: Blob,
): Promise<{ width: number; height: number }> => {
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  return { width, height };
};
