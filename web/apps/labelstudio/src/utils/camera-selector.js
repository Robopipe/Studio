import { useEffect, useMemo, useState } from "react";
import { useAPI } from "../providers/ApiProvider";
import { useQuery } from "@tanstack/react-query";

export const useCameraSelector = autoSet => {
  const api = useAPI();
  const [camera, setCamera] = useState(null);
  const [stream, setStream] = useState(null);
  const { data: cameras } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => api.callApi("cameras")
  });
  const { data: streams } = useQuery({
    queryKey: ["cameras", camera, "streams"],
    queryFn: () => api.callApi("streams", { params: { mxid: camera } }),
    enabled: camera !== null
  });

  const wsUrl = useMemo(() => {
    if (!camera || !stream) return null;

    const url = new URL(window.APP_SETTINGS.robopipeHostname);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const hostname = url.hostname + (url.port ? `:${url.port}` : "");

    return `${protocol}//${hostname}/cameras/${camera}/streams/${stream}`;
  }, [camera, stream]);

  useEffect(() => {
    if (autoSet && cameras) {
      setCamera(cameras[0]?.mxid);
    }
  }, [autoSet, cameras]);

  useEffect(() => {
    if (autoSet && streams) {
      setStream(Object.keys(streams)[0]);
    }
  }, [autoSet, streams]);

  return { cameras, streams, camera, stream, setCamera, setStream, wsUrl };
};
