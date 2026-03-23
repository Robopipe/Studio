import {
  useDeployDashboardMutation,
  useGetNNQuery,
  useListCamerasQuery,
  useListStreamsQuery,
} from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import {
  useGetEvalTestCasesQuery,
  useGetEvalThresholdsQuery,
  useLazyGetEvalLimitQuery,
  useLazyGetEvalTestCaseQuery,
} from "@/modules/evaluation/api/evaluationApi";
import { useGetModelQuery } from "@/modules/model/services";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button, Select, Stack } from "@repo/ui";
import { useState } from "react";
import { useGetDashboardConfigQuery } from "../../services";
import styles from "./DashboardRuntimePage.module.scss";

export interface DashboardRuntimePageProps {
  configId: number;
}

export const DashboardRuntimePage = ({
  configId,
}: DashboardRuntimePageProps) => {
  const [activeProject] = useActiveProject();
  const { data: cameras } = useListCamerasQuery();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });
  const cameraApiUrl = useCameraApiUrl();
  const { data: currentNn } = useGetNNQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );
  const { data: modelData } = useGetModelQuery(
    { projectId: activeProject!.id, modelId: currentNn?.model_id! },
    { skip: !currentNn?.model_id },
  );
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const { data: dashboardConfig } = useGetDashboardConfigQuery(
    { projectId: activeProject!.id, configId },
    { skip: !activeProject },
  );
  const { data: evalTestCases } = useGetEvalTestCasesQuery(
    { projectId: activeProject!.id },
    { skip: !activeProject },
  );
  const { data: evalThresholds } = useGetEvalThresholdsQuery(
    { projectId: activeProject!.id },
    { skip: !activeProject },
  );
  const [getEvalTestCase] = useLazyGetEvalTestCaseQuery();
  const [getEvalLimit] = useLazyGetEvalLimitQuery();
  const [deployDashboard] = useDeployDashboardMutation();
  const deploy = async () => {
    if (
      !selectedCamera ||
      !selectedStream ||
      !currentNn?.model_id ||
      !modelData ||
      !dashboardConfig
    )
      return;

    const testCases = (evalTestCases ?? []).map(async (tc) => {
      const thresholdData = evalThresholds?.find((t) => t.id === tc.id);
      return {
        id: tc.id,
        name: tc.name,
        type: tc.type,
        severity: tc.severity,
        limits: await Promise.all(
          tc.limits.map(async (limit) => {
            const limitDetail = await getEvalLimit({
              projectId: activeProject!.id,
              testCaseId: tc.id,
              limitId: limit.id,
            }).unwrap();
            return limitDetail;
          }),
        ),
        logicNodes: await getEvalTestCase({
          projectId: activeProject!.id,
          testCaseId: tc.id,
        })
          .unwrap()
          .then((data) => data.logicNodes)
          .catch(() => []),
        thresholds: (thresholdData?.thresholds ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          value: t.value,
          testCaseId: tc.id,
        })),
      };
    });

    const { dashboard_url } = await deployDashboard({
      mxid: selectedCamera,
      streamName: selectedStream,
      dashboardConfig: {
        id: dashboardConfig.id,
        name: dashboardConfig.name,
        lineDirection: dashboardConfig.lineDirection,
        linePosition: dashboardConfig.linePosition,
        lineFlow: dashboardConfig.lineFlow,
        testCases: await Promise.all(testCases),
        labels: modelData.labels,
        remoteBackendUrl: null,
      },
    }).unwrap();
    setDashboardUrl(`${cameraApiUrl}${dashboard_url}`);
  };

  return (
    <>
      {dashboardUrl ? (
        <iframe src={dashboardUrl} className={styles.dashboardFrame} />
      ) : (
        <Stack align="start">
          <Select<string>
            items={
              cameras?.map((camera) => ({
                label: camera.camera_name,
                value: camera.mxid,
              })) || []
            }
            placeholder="Select Camera"
            value={selectedCamera}
            onValueChange={(value) => {
              setSelectedCamera(value);
              setSelectedStream(null);
            }}
          />
          <Select<string>
            items={
              streams?.map((stream) => ({
                label: stream.name,
                value: stream.name,
              })) || []
            }
            value={selectedStream}
            placeholder="Select Stream"
            disabled={!selectedCamera}
            onValueChange={(value) => setSelectedStream(value)}
          />
          <Button
            onClick={deploy}
            disabled={
              !selectedCamera || !selectedStream || !currentNn?.model_id
            }
          >
            {!currentNn ? "Deploy NN first" : "Deploy Dashboard"}
          </Button>
        </Stack>
      )}
    </>
  );
};
