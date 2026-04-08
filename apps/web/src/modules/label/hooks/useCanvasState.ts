import { useCallback, useState } from "react";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.15;

interface CanvasState {
  scale: number;
  position: { x: number; y: number };
}

export const useCanvasState = () => {
  const [state, setState] = useState<CanvasState>({
    scale: 1,
    position: { x: 0, y: 0 },
  });

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: clampScale(prev.scale * ZOOM_FACTOR),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: clampScale(prev.scale / ZOOM_FACTOR),
    }));
  }, []);

  const zoomAtPoint = useCallback(
    (pointer: { x: number; y: number }, factor: number) => {
      setState((prev) => {
        const newScale = clampScale(prev.scale * factor);
        const ratio = newScale / prev.scale;
        return {
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
      const newScale = Math.min(scaleX, scaleY, 1);
      setState({
        scale: newScale,
        position: {
          x: (containerWidth - imageWidth * newScale) / 2,
          y: (containerHeight - imageHeight * newScale) / 2,
        },
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
