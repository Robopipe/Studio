import { useEffect, useMemo, useState } from "react";

export const useCameraSelector = apiUrl => {
  const [cameras, setCameras] = useState([]);
  const [streams, setStreams] = useState([]);
  const [camera, setCamera] = useState(null);
  const [stream, setStream] = useState(null);

  const wsUrl = useMemo(() => {
    if (!camera || !stream) return null;

    const url = new URL(apiUrl);
    const protocol = url.protocol === "https:" ? "wss" : "ws";
    const hostname = url.hostname + (url.port ? `:${url.port}` : "");

    return `${protocol}://${hostname}/cameras/${camera}/streams/${stream}`;
  }, [apiUrl, camera, stream]);

  useEffect(() => {
    fetch(`${apiUrl}/cameras`)
      .then(response => response.json())
      .then(data => {
        setCameras(data);
        if (data.length > 0) setCamera(data[0].mxid);
      });
  }, [apiUrl]);

  useEffect(() => {
    if (!camera) return;

    fetch(`${apiUrl}/cameras/${camera}/streams`)
      .then(response => response.json())
      .then(data => {
        const streamNames = Object.keys(data);
        setStreams(streamNames);
        if (streamNames.length > 0) setStream(streamNames[0]);
      });
  }, [camera]);

  return { cameras, streams, camera, stream, setCamera, setStream, wsUrl };
};
