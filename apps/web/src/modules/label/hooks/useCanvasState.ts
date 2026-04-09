import { useCallback, useState } from "react";

const ABSOLUTE_MIN_SCALE = 0.05;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.15;
/**
 * How far below the fit-to-container scale the user can zoom out, expressed
 * as a multiplier of the fit scale. 0.8 = image can shrink to 80% of its
 * fitted size, exposing white space around it (so users can label edges that
 * sit under the floating overlays).
 */
const MIN_SCALE_FIT_RATIO = 0.8;

interface CanvasState {
  scale: number;
  position: { x: number; y: number };
  /** Lower bound for `scale`, computed each time fitImage runs. */
  minScale: number;
}

export const useCanvasState = () => {
  const [state, setState] = useState<CanvasState>({
    scale: 1,
    position: { x: 0, y: 0 },
    minScale: ABSOLUTE_MIN_SCALE,
  });

  const clampScale = (s: number, minScale: number) =>
    Math.min(MAX_SCALE, Math.max(minScale, s));

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: clampScale(prev.scale * ZOOM_FACTOR, prev.minScale),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: clampScale(prev.scale / ZOOM_FACTOR, prev.minScale),
    }));
  }, []);

  const zoomAtPoint = useCallback(
    (pointer: { x: number; y: number }, factor: number) => {
      setState((prev) => {
        const newScale = clampScale(prev.scale * factor, prev.minScale);
        const ratio = newScale / prev.scale;
        return {
          ...prev,
          scale: newScale,
          position: {
            x: pointer.x - (pointer.x - prev.position.x) * ratio,
            y: pointer.y - (pointer.y - prev.position.y) * ratio,
          },
        };
      });
    },
    [],
  );

  const setPosition = useCallback((pos: { x: number; y: number }) => {
    setState((prev) => ({ ...prev, position: pos }));
  }, []);

  const fitImage = useCallback(
    (imageWidth: number, imageHeight: number, containerWidth: number, containerHeight: number) => {
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const fitScale = Math.min(scaleX, scaleY, 1);
      const minScale = Math.max(
        ABSOLUTE_MIN_SCALE,
        fitScale * MIN_SCALE_FIT_RATIO,
      );
      setState({
        scale: fitScale,
        position: {
          x: (containerWidth - imageWidth * fitScale) / 2,
          y: (containerHeight - imageHeight * fitScale) / 2,
        },
        minScale,
      });
    },
    [],
  );

  /** Convert percentage coords (0-100) to screen pixels */
  const pctToScreen = useCallback(
    (pctX: number, pctY: number, imageWidth: number, imageHeight: number) => ({
      x: (pctX / 100) * imageWidth * state.scale + state.position.x,
      y: (pctY / 100) * imageHeight * state.scale + state.position.y,
    }),
    [state.scale, state.position],
  );

  /** Convert screen pixels to percentage coords (0-100) */
  const screenToPct = useCallback(
    (screenX: number, screenY: number, imageWidth: number, imageHeight: number) => ({
      x: ((screenX - state.position.x) / (imageWidth * state.scale)) * 100,
      y: ((screenY - state.position.y) / (imageHeight * state.scale)) * 100,
    }),
    [state.scale, state.position],
  );

  return {
    scale: state.scale,
    position: state.position,
    zoomIn,
    zoomOut,
    zoomAtPoint,
    setPosition,
    fitImage,
    pctToScreen,
    screenToPct,
  };
};
