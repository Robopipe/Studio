import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState
} from "react";
import {
  buildClassificationModel,
  getBackboneOutputShape,
  getImgFeatures,
  loadBackbone
} from "../utils/tf";
import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import { useAPI } from "../providers/ApiProvider";
import { useProject } from "../providers/ProjectProvider";
import { useLabelConfig } from "../utils/label-config";

type Status = {
  statusType: string;
  status: string;
};

type CommonModelOptions = {
  setStatus?: Dispatch<SetStateAction<Status>>;
  addLog?: (log: string) => void;
};

export type BackboneOptions = CommonModelOptions & {
  modelName?: string;
  disabled?: boolean;
};

export const useBackbone = ({
  modelName,
  disabled,
  setStatus,
  addLog
}: BackboneOptions) => {
  const [backbone, setBackbone] = useState<tf.GraphModel | null>(null);

  useEffect(() => {
    if (disabled || !modelName) return;
    addLog?.(`loading base model - ${modelName}`);
    setStatus?.({ statusType: "loading", status: "Loading base model" });

    loadBackbone(modelName)
      .then(setBackbone)
      .then(() => {
        addLog?.("loaded base model");
        setStatus?.({ statusType: "ready", status: "Ready for training" });
      });
  }, [modelName, disabled, setStatus]);

  useEffect(
    () => () => {
      backbone?.dispose();
    },
    [backbone]
  );

  return { backbone };
};

export type DatasetOptions = CommonModelOptions & {
  backbone?: tf.GraphModel | null;
};

export const useLoadDataset = ({
  backbone,
  setStatus,
  addLog
}: DatasetOptions) => {
  const api = useAPI();
  const { project } = useProject();
  const labelConfig = useLabelConfig();
  const [dataset, setDataset] = useState<{
    data: tf.Tensor;
    labels: tf.Tensor | tf.Tensor[];
  } | null>(null);

  const loadCls = useCallback(
    async (tasks: any) => {
      if (!backbone || !labelConfig.labelMap) return;

      const dataFeatures = [];
      const dataLabels: number[] = [];

      for (const task of tasks) {
        if (!task?.annotations?.[0]?.result?.[0]) continue;

        const features = (
          await getImgFeatures(backbone, `${task.data.image}`)
        )[0].squeeze();

        dataFeatures.push(features);
        dataLabels.push(
          labelConfig.labelMap![task.annotations[0].result[0].value.choices[0]]
        );
      }

      return {
        data: tf.stack(dataFeatures),
        labels: tf.oneHot(
          tf.tensor1d(dataLabels, "int32"),
          Object.keys(labelConfig.labelMap ?? {}).length
        )
      };
    },
    [getImgFeatures, labelConfig, backbone]
  );

  const loadDataset = useCallback(async () => {
    if (!backbone || !project) return;

    setStatus?.({ statusType: "loading", status: "Loading dataset" });
    addLog?.("loading dataset");

    const { tasks } = (await api.callApi("tasks", {
      params: { project: project.id, fields: "all" }
    })) as any;

    addLog?.("label map created");
    addLog?.(`label map: ${JSON.stringify(labelConfig.labelMap, null, 2)}`);

    setStatus?.({ statusType: "loading", status: "Extracting features" });
    addLog?.("extracting features");

    const loadedDataset = await loadCls(tasks);

    if (!loadedDataset) return;

    setDataset(loadedDataset);
    setStatus?.({ statusType: "ready", status: "Dataset loaded" });
    addLog?.("dataset loaded");

    return loadedDataset;
  }, [backbone, project, api, getImgFeatures, labelConfig, loadCls]);

  useEffect(
    () => () => {
      setDataset(null);
    },
    [backbone]
  );

  useEffect(
    () => () => {
      dataset?.data.dispose();

      if (Array.isArray(dataset?.labels))
        dataset?.labels.forEach((l: tf.Tensor) => l.dispose());
      else dataset?.labels.dispose();
    },
    [dataset]
  );

  return { loadDataset, dataset };
};

export type TrainModelOptions = CommonModelOptions & {
  baseModel?: string;
  backbone?: tf.GraphModel | null;
  model?: tf.LayersModel | tf.Sequential | null;
  visEl?: tfvis.Drawable;
};

export const useTrainModel = ({
  baseModel,
  backbone,
  model,
  setStatus,
  addLog,
  visEl
}: TrainModelOptions) => {
  const { project } = useProject();
  const api = useAPI();
  const [trained, setTrained] = useState(false);
  const { taskType } = useLabelConfig();
  const { loadDataset, dataset } = useLoadDataset({
    backbone,
    setStatus,
    addLog
  });

  const trainModelCls = useCallback(
    async (epochs?: number) => {
      if (trained) return;

      const loadedDataset = dataset ?? (await loadDataset());

      if (!model || !loadedDataset) return;

      const { data, labels } = loadedDataset;

      setStatus?.({ statusType: "loading", status: "Training model" });
      let visCallbacks: any = {};

      if (visEl)
        visCallbacks = tfvis.show.fitCallbacks(visEl, ["loss", "acc"], {
          callbacks: ["onEpochEnd"],
          zoomToFit: true,
          seriesColors: ["#0f6d41"]
        });

      await model.fit(data, labels, {
        epochs: epochs ?? 10,
        callbacks: {
          ...visCallbacks,
          onTrainBegin: () => addLog?.("model training begin"),
          onTrainEnd: () => addLog?.("model training end"),
          onEpochEnd: (epoch, logs) => {
            addLog?.(`epoch ${epoch + 1}: ${JSON.stringify(logs, null, 2)}`);
            visCallbacks.onEpochEnd?.(epoch, logs);
          }
        }
      });

      setTrained(true);
      setStatus?.({ statusType: "ready", status: "Model trained" });
    },
    [model, dataset, loadDataset, addLog, trained]
  );

  const trainModelDet = useCallback(
    async (name: string, imgsz?: string, epochs?: number) => {
      let onEpochEnd = (epoch: any, logs: any) => {};
      if (visEl)
        onEpochEnd = tfvis.show.fitCallbacks(visEl, ["box_loss", "cls_loss"], {
          callbacks: ["onEpochEnd"],
          zoomToFit: true,
          seriesColors: ["#0f6d41"]
        }).onEpochEnd;
      const trainData = {
        model_name: name,
        epochs,
        imgsz: imgsz,
        base_model: baseModel
      };
      const parseData = (data: string) => {
        if (data.includes("}{")) {
          const messages = [];
          const splitData = data.split("}{");

          for (let i = 0; i < splitData.length; i++) {
            if (i % 2 === 0) messages.push(JSON.parse(splitData[i] + "}"));
            else messages.push(JSON.parse("{" + splitData[i]));
          }

          return messages;
        } else return [JSON.parse(data)];
      };

      return fetch(
        `${window.APP_SETTINGS.hostname}/api/projects/${project.id}/nn-models/train`,
        {
          method: "POST",
          body: JSON.stringify(trainData),
          headers: { "Content-Type": "application/json" }
        }
      ).then(async res => {
        const reader = res.body!.getReader();

        while (true) {
          const { value, done } = await reader!.read();
          const messages = parseData(new TextDecoder().decode(value!));

          for (const msg of messages) {
            if ("result" in msg) return msg.result;

            if ("log" in msg) addLog?.(msg.log);

            if ("status_type" in msg)
              setStatus?.({ statusType: msg.status_type, status: msg.log });

            if ("data" in msg)
              onEpochEnd(msg.data.epoch, {
                box_loss: msg.data.metrics["val/box_loss"],
                cls_loss: msg.data.metrics["val/cls_loss"]
              });
          }

          if (done) break;
        }
      });
    },
    [api, project, setStatus, addLog, visEl, baseModel]
  );

  useEffect(() => {
    setTrained(false);
  }, [model]);

  return {
    model,
    trained,
    trainModel: taskType === "classification" ? trainModelCls : trainModelDet
  };
};

export type ModelOptions = CommonModelOptions & {
  baseModel?: string;
  disabled?: boolean;
  visEl?: tfvis.Drawable;
};

export const useModel = ({
  baseModel,
  setStatus,
  disabled,
  addLog,
  visEl
}: ModelOptions) => {
  const { project } = useProject();
  const { taskType, numClasses } = useLabelConfig();
  const { backbone } = useBackbone({
    modelName: baseModel,
    setStatus,
    disabled: disabled || !taskType || taskType === "detection",
    addLog
  });
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const { trainModel, trained } = useTrainModel({
    baseModel,
    backbone,
    model,
    setStatus,
    addLog,
    visEl
  });

  const reset = useCallback(() => {
    if (model) addLog?.("disposing model");
    if (taskType === "detection")
      setStatus?.({ statusType: "ready", status: "Ready for training" });

    if (!project || !backbone) return;

    addLog?.(`building ${taskType} model`);
    setStatus?.({ statusType: "loading", status: "Building model" });

    if (taskType === "classification") {
      const backboneOutputShape = getBackboneOutputShape(backbone);
      setModel(buildClassificationModel(numClasses!, backboneOutputShape));
    }

    addLog?.("model built");
    setStatus?.({ statusType: "ready", status: "Ready for training" });
  }, [model, project, backbone, taskType, numClasses]);

  useEffect(() => {
    if (!model) reset();
  }, [reset, model]);

  useEffect(
    () => () => {
      setModel(null);
    },
    [backbone]
  );

  useEffect(
    () => () => {
      model?.dispose();
    },
    [model]
  );

  return { model, trainModel, trained, reset };
};
