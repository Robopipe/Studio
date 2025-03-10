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
import { useLogs } from "../../hooks/useLogs";

const TASK_TYPE_MAP = {
  classification: "Object classification",
  detection: "Bounding box detection"
};

export const ModelDetail = props => {
  const { model: propModel, disabled, taskType, onSave } = props;
  const api = useAPI();
  const { project } = useProject();
  const { subscribe, unsubscribe, addLog } = useLogs();
  const [status, setStatus] = useState({
    statusType: "loading",
    status: "Loading model"
  });
  const [model, setModel] = useState(propModel);
  const [imageSize, setImageSize] = useState("");
  const [baseModels, setBaseModels] = useState([]);
  const { model: tfModel, trainModel, trained, reset } = useModel({
    baseModel: model?.base_model,
    setStatus,
    disabled: disabled,
    addLog,
    visEl: document.getElementById("training-vis")
  });
  const [epochs, setEpochs] = useState(10);

  const trainCb = useCallback(async () => {
    if (taskType === "classification") return trainModel(epochs);

    const createdModel = await trainModel(
      model.name,
      imageSize || undefined,
      epochs
    );
    queryClient.invalidateQueries({
      queryKey: ["projects", project.id, "nn-models"]
    });
    onSave?.(createdModel);
  }, [trainModel, epochs, model, project.id, onSave, imageSize]);

  const saveModelCb = useCallback(async () => {
    setStatus({ statusType: "loading", status: "Saving model" });
    const modelResponse = await api.callApi("createNnModel", {
      body: {
        name: model.name,
        base_model: model.base_model,
        model_type: "Generic"
      },
      params: { pk: project.id }
    });
    const uploadResponse = await tfModel.save(
      tf.io.http(
        `http://localhost:8081/api/nn-models/${modelResponse.id}/upload?base_model=${model.base_model}`,
        {
          requestInit: {
            headers: imageSize ? { "X-imgsz": imageSize } : undefined
          }
        }
      )
    );
    setStatus({ statusType: "ready", status: "Model ready for deployment" });
    return modelResponse;
  }, [model, tfModel, setStatus, imageSize]);
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
    api.callApi("baseModels", { params: { task: taskType } }).then(r => {
      if (r.length > 0) setModel(prev => ({ ...prev, base_model: r[0] }));
      setBaseModels(r);
    });
  }, [taskType]);

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
          <Input
            label="Image size WxH (optional)"
            disabled={disabled || status.statusType !== "ready"}
            onChange={e => setImageSize(e.target.value)}
          />
          <Elem name="actions">
            <Button
              onClick={trainCb}
              disabled={disabled || trained || status.statusType !== "ready"}
            >
              Train{taskType === "detection" ? " & Save" : ""}
            </Button>
            {taskType === "classification" && (
              <>
                <Button
                  primary
                  disabled={
                    disabled || !trained || status.statusType !== "ready"
                  }
                  onClick={saveModel}
                >
                  Save
                </Button>
                <Button
                  look="danger"
                  disabled={
                    disabled || !trained || status.statusType !== "ready"
                  }
                  onClick={reset}
                >
                  Reset
                </Button>
              </>
            )}
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
      <ModelLogs subscribe={subscribe} unsubscribe={unsubscribe} />
    </Block>
  );
};
