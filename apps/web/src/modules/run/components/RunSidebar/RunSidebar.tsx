import {
  useDeployNNMutation,
  useListCamerasQuery,
  useListStreamsQuery,
  useRemoveNNMutation,
} from "@/core/cameraApi";
import {
  useGetModelOutputsQuery,
  useGetModelsQuery,
} from "@/modules/model/services/modelApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  AiPowerIcon,
  Button,
  CameraIcon,
  DeleteIcon,
  OutputIcon,
  RunIcon,
  SensorIcon,
  Stack,
  Text,
} from "@repo/ui";
import { Select } from "@repo/ui/components/Select/Select";
import { DetectionsDisplay } from "../DetectionsDisplay";
import styles from "./RunSidebar.module.scss";

export interface RunSidebarProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedModelId: string | null;
  selectedOutputId: string | null;
  onSelectCamera: (mxid: string | null) => void;
  onSelectStream: (streamName: string | null) => void;
  onSelectModel: (modelId: string | null) => void;
  onSelectOutput: (outputId: string | null) => void;
}

export const RunSidebar = ({
  selectedCamera,
  selectedStream,
  selectedModelId,
  selectedOutputId,
  onSelectCamera,
  onSelectStream,
  onSelectModel,
  onSelectOutput,
}: RunSidebarProps) => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const { data: cameras } = useListCamerasQuery();

  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });

  const { data: models } = useGetModelsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const { data: modelOutputs } = useGetModelOutputsQuery(
    { projectId: projectId!, modelId: Number(selectedModelId) },
    { skip: !projectId || !selectedModelId },
  );

  const [deployNNMut] = useDeployNNMutation();
  const deployNN = async () => {
    if (
      !selectedCamera ||
      !selectedStream ||
      !selectedModelId ||
      !selectedOutputId
    ) {
      return;
    }

    const modelUrl = modelOutputs?.find(
      (output) => String(output.id) === String(selectedOutputId),
    )?.filePath;
    const model = await fetch(modelUrl!).then((res) => res.arrayBuffer());
    const camera = selectedCamera;
    const stream = selectedStream;
    onSelectCamera(null);
    onSelectStream(null);
    await deployNNMut({
      mxid: selectedCamera,
      streamName: selectedStream,
      model: new File([model], "model.tar.xz"),
      config: {
        type: "Generic",
        model_id: Number(selectedModelId),
        nn_config: {}
      }
    }).unwrap();
    onSelectCamera(camera);
    onSelectStream(stream);
  };
  const [removeNNMut] = useRemoveNNMutation();
  const removeNN = async () => {
    if (!selectedCamera || !selectedStream) {
      return;
    }
    const camera = selectedCamera;
    const stream = selectedStream;
    onSelectCamera(null);
    onSelectStream(null);
    await removeNNMut({
      mxid: selectedCamera,
      streamName: selectedStream,
    }).unwrap();
    onSelectCamera(camera);
    onSelectStream(stream);
  };

  return (
    <Stack className={styles.sidebar}>
      {/* Camera */}
      <div className={styles.fieldRow}>
        <Text variant="text-14" weight="500" className={styles.fieldLabel}>
          Camera
        </Text>
        <Select<string>
          placeholder="Select camera"
          items={
            cameras?.map((camera) => ({
              label: (
                <span className={styles.selectItem}>
                  <CameraIcon />
                  {camera.camera_name}
                </span>
              ),
              value: camera.mxid,
            })) || []
          }
          value={selectedCamera}
          onValueChange={(value) => {
            onSelectCamera(value);
            onSelectStream(null);
          }}
        />
      </div>

      {/* Sensor */}
      <div className={styles.fieldRow}>
        <Text variant="text-14" weight="500" className={styles.fieldLabel}>
          Sensor
        </Text>
        <Select<string>
          placeholder="Select sensor"
          items={
            streams?.map((stream) => ({
              label: (
                <span className={styles.selectItem}>
                  <SensorIcon />
                  {stream.name}
                </span>
              ),
              value: stream.name,
            })) || []
          }
          value={selectedStream}
          onValueChange={(value) => onSelectStream(value)}
          disabled={!selectedCamera}
        />
      </div>

      {/* Model */}
      <div className={styles.fieldRow}>
        <Text variant="text-14" weight="500" className={styles.fieldLabel}>
          Model
        </Text>
        <Select<string>
          placeholder="Select model"
          items={
            models?.map((model) => ({
              label: (
                <span className={styles.selectItem}>
                  <AiPowerIcon />
                  {model.name}
                </span>
              ),
              value: String(model.id),
            })) || []
          }
          value={selectedModelId}
          onValueChange={(value) => {
            onSelectModel(value);
            onSelectOutput(null);
          }}
        />
      </div>

      {/* Model Output */}
      <div className={styles.fieldRow}>
        <Text variant="text-14" weight="500" className={styles.fieldLabel}>
          Output
        </Text>
        <Select<string>
          placeholder="Select output"
          items={
            modelOutputs?.map((output) => ({
              label: (
                <span className={styles.selectItem}>
                  <OutputIcon />
                  {output.type}
                </span>
              ),
              value: String(output.id),
            })) || []
          }
          value={selectedOutputId}
          onValueChange={(value) => onSelectOutput(value)}
          disabled={!selectedModelId}
        />
      </div>

      {/* Deploy Button */}
      <Stack direction="row" justify="center">
        <Button
          variant="outlined"
          onClick={removeNN}
          disabled={!selectedCamera || !selectedStream}
          className={styles.deployButton}
        >
          <DeleteIcon />
          Remove NN
        </Button>
        <Button
          variant="filled"
          className={styles.deployButton}
          onClick={deployNN}
          disabled={
            !selectedCamera ||
            !selectedStream ||
            !selectedModelId ||
            !selectedOutputId
          }
        >
          <RunIcon />
          Deploy
        </Button>
      </Stack>
      <DetectionsDisplay
        selectedMxid={selectedCamera}
        selectedSensorName={selectedStream}
        selectedModelId={selectedModelId}
      />
    </Stack>
  );
};
