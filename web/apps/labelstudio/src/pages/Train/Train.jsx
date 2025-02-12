import * as tf from "@tensorflow/tfjs";
import { useCallback, useEffect, useState } from "react";
import { load } from "@tensorflow-models/mobilenet";
import { absoluteURL } from "../../utils/helpers";
import { useProject } from "../../providers/ProjectProvider";
import { useAPI } from "../../providers/ApiProvider";
import { Block, Elem } from "../../utils/bem";
import "./Train.scss";
import { ModelDetail } from "../../components/ModelDetail/ModelDetail";

export const TrainPage = () => {
  const defaultModel = {
    id: null,
    name: "",
    created_at: null,
    base_model: "mobilenet_v3"
  };

  const { project } = useProject();
  const api = useAPI();
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const switchModel = useCallback(
    newModel => {
      if (model !== null && model.id === null) return;

      setModel(newModel);
    },
    [model, setModel]
  );

  const setModelName = useCallback(
    name => {
      setModel(prev => ({ ...prev, name }));
    },
    [setModel]
  );

  useEffect(() => {
    if (!project.id) return;

    (async () => {
      const models = await api.callApi("nnModels", {
        params: { pk: project.id }
      });

      setModels(models);
    })();
  }, [project.id, api]);

  useEffect(() => {
    console.log(model);
  }, [model]);

  return (
    <Block name="train">
      <Elem name="content">
        <Elem name="sidebar">
          <Elem name="title">Versions</Elem>
          <Elem
            tag="button"
            name="create-new"
            disabled={model !== null && !model.id}
            onClick={() => setModel(defaultModel)}
          >
            Create new version
          </Elem>
          <Elem name="list">
            {[...(model !== null && !model.id ? [model] : []), ...models].map(
              (currModel, i, arr) => (
                <Elem
                  name="model"
                  key={currModel.id}
                  onClick={() => switchModel(currModel)}
                  className={`${model?.id === currModel.id ? "active" : ""} ${
                    model?.id === null && i !== 0 ? "disabled" : ""
                  }`}
                >
                  <Elem name="version">v{arr.length - i}</Elem>
                  <Elem name="name">{currModel.name}</Elem>
                  <Elem name="status">{currModel.updated_at}</Elem>
                </Elem>
              )
            )}
          </Elem>
        </Elem>
        <Elem name="main">
          <ModelDetail
            model={model}
            disabled={model?.id !== null}
            taskType={
              project?.parsed_label_config?.label?.type ??
              project?.parsed_label_config?.choice?.type
            }
            onSave={model => {
              setModels(prev => [model, ...prev]);
              setModel(model);
            }}
          />
        </Elem>
      </Elem>
    </Block>
  );
};

TrainPage.title = "Train";
TrainPage.path = "/train";
TrainPage.exact = true;
