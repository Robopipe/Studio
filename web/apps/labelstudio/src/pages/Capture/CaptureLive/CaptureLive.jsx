import { Input } from "apps/labelstudio/src/components/Input/Input";
import { Select } from "apps/labelstudio/src/components/Select/Select";
import { Toggle } from "apps/labelstudio/src/components/Toggle/Toggle";
import { VideoPlayer } from "apps/labelstudio/src/components/VideoPlayer/VideoPlayer";
import { useAPI } from "apps/labelstudio/src/providers/ApiProvider";
import { useCapture } from "apps/labelstudio/src/providers/CaptureProvider";
import { useProject } from "apps/labelstudio/src/providers/ProjectProvider";
import { formattedDT } from "apps/labelstudio/src/utils/helpers";
import { Block, Elem } from "libs/editor/src/utils/bem";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./CaptureLive.scss";
import { CameraControls } from "apps/labelstudio/src/components/CameraControls/CameraControls";

export const CaptureLivePage = () => {
  const { project } = useProject();
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");
  const [cameras, setCameras] = useState([]);
  const [streams, setStreams] = useState([]);
  const [source, setSource] = useState({ camera: null, stream: null });
  const wsUrl = useMemo(() => {
    if (!source.camera || !source.stream) return null;

    const url = new URL(apiUrl);

    return `${url.protocol === "http:" ? "ws:" : "wss:"}//${url.hostname}${
      url.port ? ":" + url.port : ""
    }/cameras/${source.camera}/streams/${source.stream}/video`;
  }, [apiUrl, source]);
  const api = useAPI();
  const [namePattern, setNamePattern] = useState("");
  const { capturedImages, setCapturedImages } = useCapture();
  const [imageUrl, setImageUrl] = useState();
  const [autoCapture, setAutoCapture] = useState({
    total: 10,
    capturing: false,
    interval: 1.0,
    enabled: false
  });
  const captureImage = useCallback(async () => {
    const response = await (
      await fetch(
        `${apiUrl}/cameras/${source.camera}/streams/${source.stream}/still?format=jpeg`
      )
    ).blob();
    const createdDT = new Date();
    const filename = `${namePattern ? namePattern + "-" : ""}${formattedDT(
      createdDT
    )}.jpeg`;
    const imageUrl = URL.createObjectURL(response);
    const formData = new FormData();
    formData.append("file", response, filename);
    const uploadResponse = await api.callApi("importFiles", {
      params: { pk: project.id },
      body: formData,
      headers: { "Content-Type": "multipart/form-data" }
    });

    const capturedImage = {
      url: imageUrl,
      uploadId: uploadResponse.file_upload_ids[0],
      taskId: uploadResponse.task_map[`${uploadResponse.file_upload_ids[0]}`],
      timestamp: createdDT,
      filename
    };
    setCapturedImages(prev => [capturedImage, ...prev]);
  }, [apiUrl, source, namePattern]);

  useEffect(() => {
    if (!apiUrl) return;

    (async () => {
      const fetchedCameras = await (await fetch(`${apiUrl}/cameras`)).json();
      setCameras(fetchedCameras.map(camera => camera.mxid));

      if (fetchedCameras.length > 0)
        setSource({ stream: null, camera: fetchedCameras[0].mxid });
    })();
  }, [apiUrl]);

  useEffect(() => {
    if (cameras.length <= 0) return;

    (async () => {
      const fetchedStreams = await (
        await fetch(`${apiUrl}/cameras/${source.camera}/streams`)
      ).json();
      const streamNames = Object.keys(fetchedStreams);
      setStreams(streamNames);

      if (streamNames.length > 0)
        setSource(src => ({ ...src, stream: streamNames[0] }));
    })();
  }, [apiUrl, source.camera]);

  return (
    <Block name="capture-live">
      <Elem tag="h1" name="heading">
        Capture images live
      </Elem>
      <Elem name="controls-container">
        <Elem name="camera-selector">
          <Select
            label="Camera"
            onChange={camera => setSource(src => ({ ...src, camera }))}
            options={cameras.map(cam => ({ value: cam, label: cam }))}
          />
          <Select
            label="Stream"
            onChange={stream => setSource(src => ({ ...src, stream }))}
            options={streams.map(stream => ({
              value: stream,
              label: stream
            }))}
          />
          <Input
            label="Name pattern"
            textAfter="-date-time.jpeg"
            placeholder="name"
            value={namePattern}
            onChange={setNamePattern}
          />
          <Toggle
            label="Use interval shooting"
            onChange={e => setAutoCapture(prev => ({ ...prev, enabled: e }))}
            disabled={autoCapture.capturing}
          />
          {autoCapture.enabled && (
            <Elem name="interval-settings">
              <Input
                label="Total"
                value={autoCapture.total}
                onChange={total => {
                  if (total === "" || !isNaN(parseInt(total)))
                    setAutoCapture(prev => ({ ...prev, total: total || 0 }));
                }}
                disabled={autoCapture.capturing}
              />
              <Input
                label="Interval"
                value={autoCapture.interval}
                onChange={interval => {
                  if (interval === "" || !isNaN(parseInt(interval)))
                    setAutoCapture(prev => ({
                      ...prev,
                      interval: interval || 0
                    }));
                }}
                textAfter="seconds"
                disabled={autoCapture.capturing}
              />
              <Elem
                tag="button"
                name="start-capture"
                onClick={() =>
                  setAutoCapture(prev => ({ ...prev, capturing: true }))
                }
              >
                Start capturing
              </Elem>
            </Elem>
          )}
        </Elem>
        {wsUrl ? (
          <VideoPlayer
            src={wsUrl}
            key={`${source.stream}@${source.camera}`}
            onCapture={captureImage}
            autoCapture={{ ...autoCapture }}
            onStopAutoCapture={() =>
              setAutoCapture(prev => ({ ...prev, capturing: false }))
            }
          />
        ) : (
          <Elem>Loading...</Elem>
        )}
        <Elem name="camera-controls">
          <CameraControls
            apiUrl={`${apiUrl}/cameras/${source.camera}/streams/${source.stream}`}
          />
        </Elem>
      </Elem>
    </Block>
  );
};

CaptureLivePage.title = "Live";
CaptureLivePage.path = "/live";
CaptureLivePage.exact = true;
