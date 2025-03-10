import { useCallback, useEffect, useMemo, useState } from "react";
import { Input, Select } from "../../components/Form";
import { Block, Elem } from "../../utils/bem";
import "./Infere.scss";
import { VideoPlayer } from "../../components/VideoPlayer/VideoPlayer";
import { useCameraSelector } from "../../utils/camera-selector";
import { useProject } from "../../providers/ProjectProvider";
import { useAPI } from "../../providers/ApiProvider";
import { useQuery } from "@tanstack/react-query";
import { ca } from "date-fns/locale";
import { useLabelConfig } from "../../utils/label-config";
import { Button } from "../../components";
import { ModelLogs } from "../../components/ModelDetail/ModelLogs";
import { useLogs } from "../../hooks/useLogs";

const classificationCb = (labels, elId, addLog) => ({ data }) => {
  addLog?.(data);
  const detections = JSON.parse(data).detections;
  const el = document.getElementById(elId);
  const maxDetectionIdx = detections.reduce(
    (maxIdx, detection, idx) => (detection > detections[maxIdx] ? idx : maxIdx),
    0
  );
  el.innerText = `Class: ${labels[maxDetectionIdx]}. Confidence: ${Math.floor(
    detections[maxDetectionIdx] * 100
  )}%`;
};

const detectionCb = (labels, elId, addLog) => {
  const canvas = document.getElementById(elId);
  const videoEl = document.getElementById("video-player");
  const ctx = canvas.getContext("2d");
  const colors = Array(labels.length)
    .fill(0)
    .map((_, i) => `hsl(${(i * 360) / labels.length}, 100%, 50%)`);

  canvas.width = videoEl.clientWidth;
  canvas.height = videoEl.clientHeight;
  videoEl.addEventListener("resize", () => {
    canvas.width = videoEl.clientWidth;
    canvas.height = videoEl.clientHeight;
  });

  return ({ data }) => {
    addLog?.(data);
    const detections = JSON.parse(data).detections;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detections.forEach(detection => {
      const [xMin, yMin, xMax, yMax] = detection.coords;
      const [x, y, w, h] = [xMin, yMin, xMax - xMin, yMax - yMin];
      const [canvasW, canvasH] = [canvas.width, canvas.height];
      ctx.strokeStyle = colors[detection.label];
      ctx.strokeRect(x * canvasW, y * canvasH, w * canvasW, h * canvasH);
      ctx.fillStyle = colors[detection.label];
      ctx.fillText(
        `${labels[detection.label]}: ${Math.floor(
          detection.confidence * 100
        )}%`,
        x * canvasW,
        y * canvasH - 5
      );
    });
  };
};

export const InferePage = () => {
  const { project } = useProject();
  const api = useAPI();
  const {
    cameras,
    streams,
    setCamera,
    setStream,
    wsUrl,
    camera,
    stream
  } = useCameraSelector(true);
  const { subscribe, unsubscribe, addLog } = useLogs();
  const { data: models, status: modelsStatus } = useQuery({
    queryKey: ["projects", project.id, "nn-models"],
    queryFn: () => api.callApi("nnModels", { params: { pk: project.id } }),
    enabled: !!project?.id
  });
  const { data: nnConfig, refetch: refetchNnConfig } = useQuery({
    queryKey: ["cameras", camera, "streams", stream, "nn"],
    queryFn: () =>
      api.callApi("streamNn", { params: { mxid: camera, stream } }),
    enabled: !!camera && !!stream
  });
  const [model, setModel] = useState(null);
  const [modelConfig, setModelConfig] = useState({ confidence: 0.5, iou: 0.5 });
  const [loading, setLoading] = useState(false);
  const { numClasses, labelList } = useLabelConfig();
  const openInference = useCallback(() => {
    if (!wsUrl || !nnConfig) return;
    const ws = new WebSocket(`${wsUrl}/nn`);
    if (nnConfig.type === "Generic")
      ws.onmessage = classificationCb(labelList, "inference-text", addLog);
    else ws.onmessage = detectionCb(labelList, "inference-renderer", addLog);

    return ws;
  }, [wsUrl, nnConfig, labelList, addLog]);

  const uploadModel = useCallback(async () => {
    setLoading(true);
    addLog("fetchiong model from backend");
    const modelBlob = await (
      await fetch(`/data/model/${model.model_path}`)
    ).blob();
    const formData = new FormData();
    const config = { type: model.model_type };

    if (config.type === "YOLO") {
      config.nn_config = {
        num_classes: numClasses,
        coordinate_size: 4,
        confidence_threshold: modelConfig.confidence,
        iou_threshold: modelConfig.iou
      };
    }

    formData.append("model", modelBlob, model.model_path);
    formData.append("config", JSON.stringify(config));
    addLog(`uploading mode to camera ${camera} stream ${stream}`);
    addLog(`model config: ${JSON.stringify(config)}`);

    await fetch(
      `${window.APP_SETTINGS.robopipeHostname}/cameras/${camera}/streams/${stream}/nn`,
      {
        method: "POST",
        body: formData
      }
    );
    await refetchNnConfig();
    setLoading(false);
  }, [model, camera, stream, openInference, numClasses, addLog, modelConfig]);

  const stopModel = useCallback(async () => {
    setLoading(true);
    await fetch(
      `${window.APP_SETTINGS.robopipeHostname}/cameras/${camera}/streams/${stream}/nn`,
      {
        method: "DELETE"
      }
    );
    await refetchNnConfig();
    setLoading(false);
  }, [camera, stream, refetchNnConfig]);

  useEffect(() => {
    if (nnConfig) {
      const ws = openInference();

      return () => {
        ws.close();
      };
    }
  }, [nnConfig, openInference]);

  useEffect(() => {
    if (models) setModel(models[0]);
  }, [models]);

  return (
    <Block name="infere-page">
      <Elem name="list-sidebar">
        <Elem name="settings">
          <Elem name="title">Settings</Elem>
          {nnConfig && (
            <Elem>
              <Elem>Inference running</Elem>
            </Elem>
          )}
          <Select
            options={(cameras ?? []).map(cam => cam.mxid)}
            onChange={e => setCamera(e.target.value)}
            label="Camera"
          />
          <Select
            options={Object.keys(streams ?? {})}
            onChange={e => setStream(e.target.value)}
            label="Stream"
          />
          <Select
            options={(models ?? []).map(model => model.name)}
            onChange={e =>
              setModel(models.find(model => model.name === e.target.value))
            }
            label="Model"
          />
          {model?.model_type === "YOLO" && (
            <>
              <Input
                label="Confidence threshold"
                type="number"
                step={0.01}
                defaultValue={0.5}
                disabled={loading}
              />
              <Input
                label="IoU threshold"
                type="number"
                step={0.01}
                defaultValue={0.5}
                disabled={loading}
              />
            </>
          )}
          <Button
            tag="button"
            disabled={loading}
            mod={{ primary: true }}
            onClick={uploadModel}
          >
            Upload
          </Button>
          <Button look="danger" disabled={loading} onClick={stopModel}>
            Stop
          </Button>
        </Elem>
      </Elem>
      <Elem name="content">
        <Elem name="video-wrapper">
          <VideoPlayer
            key={wsUrl}
            src={!loading && wsUrl && `${wsUrl}/video`}
          />
          <Elem
            tag="canvas"
            name="inference-renderer"
            id="inference-renderer"
          />
          <Elem name="inference-text" id="inference-text" />
        </Elem>
        <ModelLogs subscribe={subscribe} unsubscribe={unsubscribe} />
      </Elem>
    </Block>
  );
};

InferePage.title = "Inference";
InferePage.path = "/infere";
