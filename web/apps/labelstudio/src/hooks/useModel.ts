import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  buildClassificationModel,
  buildDetectionModel,
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
  const [dataset, setDataset] = useState<{
    data: tf.Tensor;
    labels: tf.Tensor;
  } | null>(null);

  const loadDataset = useCallback(async () => {
    if (!backbone || !project) return;

    setStatus?.({ statusType: "loading", status: "Loading dataset" });
    addLog?.("loading dataset");

    const { tasks } = (await api.callApi("tasks", {
      params: { project: project.id, fields: "all" }
    })) as any;
    const labelMap: { [k in string]: number } = {};
    const dataFeatures = [];
    const dataLabels: number[] = [];

    (project?.parsed_label_config as any)?.["choice"].labels?.forEach(
      (label: string, i: number) => (labelMap[label] = i)
    );

    addLog?.("label map created");
    addLog?.(`label map: ${JSON.stringify(labelMap, null, 2)}`);

    setStatus?.({ statusType: "loading", status: "Extracting features" });
    addLog?.("extracting features");

    for (const task of tasks) {
      if (!task?.annotations?.[0]?.result?.[0]) continue;

      const features = await getImgFeatures(
        backbone,
        `http://localhost:8081/${task.data.image}`
      );

      dataFeatures.push(features);
      dataLabels.push(labelMap[task.annotations[0].result[0].value.choices[0]]);
    }

    addLog?.("features extracted");
    setStatus?.({ statusType: "loading", status: "Encoding dataset" });

    tf.util.shuffleCombo(dataFeatures, dataLabels);
    const encodedLabels = tf.oneHot(
      tf.tensor1d(dataLabels, "int32"),
      Object.keys(labelMap).length
    );

    const loadedDataset = {
      data: tf.stack(dataFeatures),
      labels: encodedLabels
    };

    setDataset(loadedDataset);
    setStatus?.({ statusType: "ready", status: "Dataset loaded" });
    addLog?.("dataset loaded");

    return loadedDataset;
  }, [backbone, project, api, getImgFeatures]);

  useEffect(
    () => () => {
      setDataset(null);
    },
    [backbone]
  );

  useEffect(
    () => () => {
      dataset?.data.dispose();
      dataset?.labels.dispose();
    },
    [dataset]
  );

  return { loadDataset, dataset };
};

export type TrainModelOptions = CommonModelOptions & {
  backbone?: tf.GraphModel | null;
  model?: tf.LayersModel | tf.Sequential | null;
  visEl?: tfvis.Drawable;
};

export const useTrainModel = ({
  backbone,
  model,
  setStatus,
  addLog,
  visEl
}: TrainModelOptions) => {
  const [trained, setTrained] = useState(false);
  const { loadDataset, dataset } = useLoadDataset({
    backbone,
    setStatus,
    addLog
  });

  const trainModel = useCallback(
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

  useEffect(() => {
    setTrained(false);
  }, [model]);

  return { model, trained, trainModel };
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
  const labelConfig = useLabelConfig();
  const { backbone } = useBackbone({
    modelName: baseModel,
    setStatus,
    disabled,
    addLog
  });
  const [model, setModel] = useState<tf.LayersModel | tf.Sequential | null>(
    null
  );
  const { trainModel, trained } = useTrainModel({
    backbone,
    model,
    setStatus,
    addLog,
    visEl
  });

  const reset = useCallback(() => {
    if (model) addLog?.("disposing model");

    if (!project || !backbone) return;

    addLog?.(`building ${labelConfig.taskType} model`);
    setStatus?.({ statusType: "loading", status: "Building model" });

    const backboneOutputShape = getBackboneOutputShape(backbone);
    const buildModel =
      labelConfig.taskType === "classification"
        ? buildClassificationModel
        : buildDetectionModel;

    setModel(buildModel(labelConfig.numClasses!, backboneOutputShape));

    addLog?.("model built");
    setStatus?.({ statusType: "ready", status: "Ready for training" });
  }, [model, project, backbone, labelConfig]);

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
