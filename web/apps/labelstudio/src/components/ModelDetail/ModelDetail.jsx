import { useCallback, useEffect, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { Input, Select } from "../Form";
import "./ModelDetail.scss";
import { useProject } from "../../providers/ProjectProvider";
import { queryClient, useAPI } from "../../providers/ApiProvider";
import * as tf from "@tensorflow/tfjs";
import { EmptyModelDetail } from "./EmptyModelDetail";
import { Button } from "../Button/Button";
import { ModelStatus } from "./ModelStatus";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useModel } from "../../hooks/useModel";
import { ModelLogs } from "./ModelLogs";
import * as tfvis from "@tensorflow/tfjs-vis";

const TASK_TYPE_MAP = {
  Choices: "Object classification",
  RectangleLabels: "Object detection"
};

export const ModelDetail = props => {
  const { model: propModel, disabled, taskType, onSave } = props;
  const api = useAPI();
  const { project } = useProject();
  const [logs, setLogs] = useState([]);
  const addLog = useCallback(
    log => setLogs(prev => [...prev, { timestamp: new Date(), content: log }]),
    [setLogs]
  );
  const [status, setStatus] = useState({
    statusType: "loading",
    status: "Loading model"
  });
  const [model, setModel] = useState(propModel);
  const [baseModels, setBaseModels] = useState([]);
  const { model: tfModel, trainModel, trained, reset } = useModel({
    baseModel: model?.base_model,
    setStatus,
    disabled,
    addLog,
    visEl: document.getElementById("training-vis")
  });
  const [epochs, setEpochs] = useState(10);

  const saveModelCb = useCallback(async () => {
    setStatus({ statusType: "loading", status: "Saving model" });
    const modelResponse = await api.callApi("createNnModel", {
      body: { name: model.name, base_model: model.base_model },
      params: { pk: project.id }
    });
    const uploadResponse = await tfModel.save(
      tf.io.http(
        `http://localhost:8081/api/nn-models/${modelResponse.id}/upload?base_model=${model.base_model}`
      )
    );
    setStatus({ statusType: "ready", status: "Model ready for deployment" });
    return modelResponse;
  }, [model, tfModel, setStatus]);
  const { mutate: saveModel } = useMutation({
    mutationFn: saveModelCb,
    onSuccess: res => {
      queryClient.invalidateQueries({
        queryKey: ["projects", project.id, "nn-models"]
      });
      onSave?.(res);
    }
  });

  useEffect(() => {
    api.callApi("baseModels").then(setBaseModels);
  }, []);

  useEffect(() => {
    if (disabled)
      setStatus({ statusType: "ready", status: "Model ready for deployment" });
  }, [disabled]);

  if (!model) return <EmptyModelDetail />;

  return (
    <Block name="model-detail">
      <Elem name="container">
        <Elem name="inputs">
          <Elem tag="h2">Settings</Elem>
          <Elem tag="span">
            Task type: {TASK_TYPE_MAP[taskType] ?? "Unknown"}
          </Elem>
          <Input
            label="Name"
            disabled={disabled || status.statusType !== "ready"}
            placeholder={model.name}
            onChange={e =>
              setModel(prev => ({ ...prev, name: e.target.value }))
            }
          />
          <Select
            label="Base model"
            options={baseModels}
            disabled={disabled || trained || status.statusType !== "ready"}
            onChange={e =>
              setModel(prev => ({ ...prev, base_model: e.target.value }))
            }
            value={model.base_model}
          />
          <Input
            label="Epochs"
            disabled={disabled || trained || status.statusType !== "ready"}
            type="number"
            value={epochs}
            onChange={e => setEpochs(e.target.value)}
          />
          <Elem name="actions">
            <Button
              onClick={() => trainModel(epochs)}
              disabled={disabled || trained || status.statusType !== "ready"}
            >
              Train
            </Button>
            <Button
              primary
              disabled={disabled || !trained || status.statusType !== "ready"}
              onClick={saveModel}
            >
              Save
            </Button>
            <Button
              look="danger"
              disabled={disabled || !trained || status.statusType !== "ready"}
              onClick={reset}
            >
              Reset
            </Button>
          </Elem>
        </Elem>
        <Elem name="status">
          <Elem tag="h2">Status</Elem>
          <ModelStatus {...status} />
        </Elem>
        <Elem name="training">
          <Elem tag="h2">Training</Elem>
          <Elem name="training-vis" id="training-vis" />
        </Elem>
      </Elem>
      <ModelLogs logs={logs} />
    </Block>
  );
};
