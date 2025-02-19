import { useEffect, useState } from "react";
import { useProject } from "../providers/ProjectProvider";

export type LabelConfig = {
  taskType: "classification" | "detection";
  labelMap: { [k in string]: number };
  labelList: string[];
  numClasses: number;
};

export const getLabelConfig = (project: APIProject): LabelConfig => {
  const taskType =
    "choice" in (project.parsed_label_config as any)
      ? "classification"
      : "detection";
  const labelMap: { [k in string]: number } = {};
  const labelList: string[] = [];

  (project.parsed_label_config! as any)[
    taskType === "classification" ? "choice" : "label"
  ].labels.forEach((label: string, i: number) => {
    labelMap[label] = i;
    labelList.push(label);
  });

  return { taskType, labelMap, labelList, numClasses: labelList.length };
};

export const useLabelConfig = () => {
  const { project } = useProject();
  const [labelConfig, setLabelConfig] = useState<Partial<LabelConfig>>({});

  useEffect(() => {
    if (!project.id) return;
    setLabelConfig(getLabelConfig(project as APIProject));
  }, [project]);

  return labelConfig;
};
