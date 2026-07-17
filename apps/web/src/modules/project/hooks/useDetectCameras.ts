import { deviceInfoSchema, type DeviceInfo } from "@/core/cameraApi/schemas";
import { useCallback, useEffect, useRef, useState } from "react";
import z from "zod";

const DETECT_DEBOUNCE_MS = 500;
const DETECT_TIMEOUT_MS = 5000;

export interface UseDetectCamerasResult {
  /** null until a successful detection for the current URL. */
  cameras: DeviceInfo[] | null;
  isLoading: boolean;
  isError: boolean;
  /** Re-run detection against the current URL, skipping the debounce. */
  retry: () => void;
}

/**
 * Fetches the camera list from an arbitrary (possibly unsaved) camera API URL.
 * Deliberately NOT the cameraApi RTK slice — its baseQuery resolves the URL
 * from the active project, which is wrong while the URL is still being typed
 * in the create/edit project modal.
 */
export const useDetectCameras = (
  url: string | null,
): UseDetectCamerasResult => {
  const [cameras, setCameras] = useState<DeviceInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const skipDebounceRef = useRef(false);

  useEffect(() => {
    setCameras(null);
    setIsError(false);
    if (!url) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const delay = skipDebounceRef.current ? 0 : DETECT_DEBOUNCE_MS;
    skipDebounceRef.current = false;

    setIsLoading(true);
    const debounceId = setTimeout(async () => {
      timeoutId = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);
      try {
        const res = await fetch(`${url.replace(/\/+$/, "")}/cameras/`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const parsed = z.array(deviceInfoSchema).parse(await res.json());
        if (!cancelled) {
          setCameras(parsed);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [url, retryNonce]);

  const retry = useCallback(() => {
    skipDebounceRef.current = true;
    setRetryNonce((n) => n + 1);
  }, []);

  return { cameras, isLoading, isError, retry };
};
