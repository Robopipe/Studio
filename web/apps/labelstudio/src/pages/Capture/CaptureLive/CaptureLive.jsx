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
import { useCameraSelector } from "apps/labelstudio/src/utils/camera-selector";
import { NoCamera } from "apps/labelstudio/src/components/NoCamera/NoCamera";
import { useCamera } from "apps/labelstudio/src/providers/CameraProvider";
import { useCameraControls } from "apps/labelstudio/src/hooks/useCameraControls";

export const CaptureLivePage = () => {
  const api = useAPI();
  const { project } = useProject();
  const {
    cameras,
    streams,
    camera,
    stream,
    setCamera,
    setStream,
    wsUrl
  } = useCamera();
  const { captureStill } = useCameraControls();
  const { capturedImages, setCapturedImages } = useCapture();
  const [namePattern, setNamePattern] = useState("");
  const [autoCapture, setAutoCapture] = useState({
    total: 10,
    capturing: false,
    interval: 1.0,
    enabled: false
  });
  const captureImage = useCallback(async () => {
    const response = await (
      await fetch(
        `${window.APP_SETTINGS.robopipeHostname}/cameras/${camera.mxid}/streams/${stream.name}/still?format=jpeg`
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
  }, [camera, stream, namePattern]);

  useEffect(() => {
    console.log(cameras);
  }, [cameras]);

  if (cameras && cameras.length === 0) {
    return <NoCamera />;
  }

  return (
    <Block name="capture-live">
      <Elem tag="h1" name="heading">
        Capture images live
      </Elem>
      <Elem name="controls-container">
        <Elem name="camera-selector">
          <Select
            label="Camera"
            onChange={setCamera}
            options={cameras?.map(cam => cam.mxid) ?? []}
          />
          <Select
            label="Stream"
            onChange={setStream}
            options={streams?.map(stream => stream.name) ?? []}
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
        <VideoPlayer
          src={wsUrl && `${wsUrl}/video`}
          key={wsUrl}
          onCapture={captureImage}
          autoCapture={{ ...autoCapture }}
          onStopAutoCapture={() =>
            setAutoCapture(prev => ({ ...prev, capturing: false }))
          }
        />
        <Elem name="camera-controls">
          <CameraControls
            apiUrl={`${window.APP_SETTINGS.robopipeHostname}/cameras/${camera}/streams/${stream}`}
          />
        </Elem>
      </Elem>
    </Block>
  );
};

CaptureLivePage.title = "Live";
CaptureLivePage.path = "/live";
CaptureLivePage.exact = true;
