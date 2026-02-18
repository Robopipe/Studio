import { useCameraApiUrl } from "@/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { NNDetections } from "../types/detections";

export interface UseDetectionsOptions {
  selectedMxid: string;
  selectedSensorName: string;
  onDetections?: (detections: NNDetections) => void;
  enabled?: boolean;
}

export interface UseDetectionsReturn {
  detections: NNDetections;
  isConnected: boolean;
  error: string | null;
}

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useDetections = ({
  selectedMxid,
  selectedSensorName,
  onDetections,
  enabled = true,
}: UseDetectionsOptions): UseDetectionsReturn => {
  const apiHost = useCameraApiUrl();
  const [detections, setDetections] = useState<NNDetections>({
    detections: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setDetections({ detections: [] });
  }, []);

  useEffect(() => {
    if (!enabled || !selectedMxid || !selectedSensorName || !apiHost) {
      cleanup();
      setError(null);
      return;
    }

    const connect = () => {
      // Convert http(s) to ws(s)
      const wsUrl = apiHost
        .replace(/^https:\/\//, "wss://")
        .replace(/^http:\/\//, "ws://");

      const endpoint = `${wsUrl}/cameras/${selectedMxid}/streams/${selectedSensorName}/nn`;

      try {
        const ws = new WebSocket(endpoint);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const parsed: NNDetections = Array.isArray(data)
              ? { detections: data }
              : data;
            setDetections(parsed);
            onDetections?.(parsed);
          } catch {}
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;

          // Auto-reconnect with backoff
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(
              connect,
              RECONNECT_DELAY_MS,
            );
          } else {
            setError("Connection lost. Max reconnect attempts reached.");
          }
        };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to connect to NN stream",
        );
      }
    };

    connect();

    return cleanup;
  }, [enabled, selectedMxid, selectedSensorName, apiHost, cleanup]);

  return { detections, isConnected, error };
};
