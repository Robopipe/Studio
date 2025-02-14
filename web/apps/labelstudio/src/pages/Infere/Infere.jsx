import { useCallback, useEffect, useMemo, useState } from "react";
import { Select } from "../../components/Form";
import { Block, Elem } from "../../utils/bem";
import "./Infere.scss";
import { VideoPlayer } from "../../components/VideoPlayer/VideoPlayer";
import { useCameraSelector } from "../../utils/camera-selector";
import { useProject } from "../../providers/ProjectProvider";
import { useAPI } from "../../providers/ApiProvider";

export const InferePage = () => {
  const apiUrl = "http://localhost:8080";
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
  } = useCameraSelector(apiUrl);
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);

  const openInference = useCallback(() => {
    const ws = new WebSocket(`${wsUrl}/nn`);
    ws.onmessage = ({ data }) => {
      const logEl = document.getElementById("inference-log");
      const textEl = document.getElementById("inference-text");
      logEl.textContent = data;
      const detections = JSON.parse(data).detections;
      const argMax = detections.reduce(
        (acc, val, i, arr) => (val > arr[acc] ? i : acc),
        0
      );
      textEl.textContent = `Class: ${
        project.parsed_label_config.choice.labels[argMax]
      }, confidence: ${Math.floor(detections[argMax] * 100)}%`;
    };
  }, [wsUrl]);

  const uploadModel = useCallback(async () => {
    setLoading(true);
    const modelBlob = await (
      await fetch(`http://localhost:8081/data/model/${model.model_path}`)
    ).blob();
    const formData = new FormData();
    formData.append("model", modelBlob, model.model_path);
    formData.append("nn_config", JSON.stringify({ type: "Generic" }));

    await fetch(`${apiUrl}/cameras/${camera}/streams/${stream}/nn`, {
      method: "POST",
      body: formData
    });
    openInference();
    setLoading(false);
  }, [model, camera, stream, openInference]);

  useEffect(() => {
    if (!project?.id) return;

    api.callApi("nnModels", { params: { pk: project.id } }).then(data => {
      setModels(data);

      if (data.length > 0) setModel(data[0]);
    });
  }, [api, project]);

  return (
    <Block name="infere-page">
      <Elem name="sidebar">
        <Elem name="settings">
          <Elem name="title">Settings</Elem>
          <Select
            options={cameras.map(cam => cam.mxid)}
            onChange={e => setCamera(e.target.value)}
            label="Camera"
          />
          <Select
            options={streams}
            onChange={e => setStream(e.target.value)}
            label="Stream"
          />
          <Select
            options={models.map(model => model.name)}
            onChange={e =>
              setModel(models.find(model => model.name === e.target.value))
            }
            label="Model"
          />
          <Elem
            tag="button"
            name="upload-btn"
            disabled={loading}
            onClick={uploadModel}
          >
            Upload
          </Elem>
        </Elem>
      </Elem>
      <Elem name="content">
        <VideoPlayer key={wsUrl} src={wsUrl && `${wsUrl}/video`} />
        {/* <Elem tag="canvas" name="inference-renderer" id="inference-renderer" /> */}
        <h2 id="inference-text"></h2>
        <pre id="inference-log"></pre>
      </Elem>
    </Block>
  );
};

InferePage.title = "Inference";
InferePage.path = "/infere";
