import { Button, Stack, Text, TextInput } from "@repo/ui";
import clsx from "clsx";
import { useState } from "react";
import { useParams } from "react-router";
import { DashboardConfiguration } from "@repo/schema";
import {
  useGetDashboardConfigsQuery,
  useCreateDashboardConfigMutation,
  useUpdateDashboardConfigMutation,
  useDeleteDashboardConfigMutation,
} from "../../services/dashboardConfigApi";
import { DashboardConfigPage } from "../DashboardConfigPage";
import { EvaluationPage } from "../EvaluationPage";

import styles from "./DashboardPage.module.scss";
import { DashboardRuntimePage } from "../DashboardRuntimePage";
import { TestCasesOverviewPage } from "@/modules/evaluation";

type RightPanelTab = "custom" | "configuration" | "evaluation" | "test-cases";

export const DashboardPage = () => {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightPanelTab>("configuration");
  const [isCreating, setIsCreating] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [editingConfig, setEditingConfig] = useState<DashboardConfiguration | null>(null);
  const [editName, setEditName] = useState("");

  const { data: configs = [] } = useGetDashboardConfigsQuery({ projectId });
  const [createConfig] = useCreateDashboardConfigMutation();
  const [updateConfig] = useUpdateDashboardConfigMutation();
  const [deleteConfig] = useDeleteDashboardConfigMutation();

  const handleCreateConfig = async () => {
    if (!newConfigName.trim()) return;
    const result = await createConfig({ projectId, name: newConfigName.trim() }).unwrap();
    setNewConfigName("");
    setIsCreating(false);
    setSelectedConfigId(result.id);
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig || !editName.trim()) return;
    await updateConfig({ projectId, configId: editingConfig.id, name: editName.trim() }).unwrap();
    setEditingConfig(null);
    setEditName("");
  };

  const handleDeleteConfig = async (configId: number) => {
    await deleteConfig({ projectId, configId }).unwrap();
    if (selectedConfigId === configId) {
      setSelectedConfigId(null);
    }
  };

  const startEditing = (config: DashboardConfiguration) => {
    setEditingConfig(config);
    setEditName(config.name);
  };

  return (
    <Stack className={styles.pageWrapper} gap={0}>
      <div className={styles.twoPanel}>
        {/* Left panel - configuration list */}
        <div className={styles.leftPanel}>
          <Stack gap={12}>
            <Stack direction="row" justify="space-between" align="center">
              <Text weight="700" variant="text-14">Configurations</Text>
              <Button size="sm" onClick={() => setIsCreating(true)}>+ New</Button>
            </Stack>

            {isCreating && (
              <Stack gap={8} className={styles.createForm}>
                <TextInput
                  label="Name"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="Configuration name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateConfig();
                    if (e.key === "Escape") { setIsCreating(false); setNewConfigName(""); }
                  }}
                  autoFocus
                />
                <Stack direction="row" gap={8} justify="end">
                  <Button size="sm" variant="outlined" onClick={() => { setIsCreating(false); setNewConfigName(""); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateConfig} disabled={!newConfigName.trim()}>
                    Create
                  </Button>
                </Stack>
              </Stack>
            )}

            <div className={styles.configList}>
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={clsx(
                    styles.configItem,
                    selectedConfigId === config.id && styles.selected,
                  )}
                  onClick={() => setSelectedConfigId(config.id)}
                >
                  {editingConfig?.id === config.id ? (
                    <Stack gap={8} onClick={(e) => e.stopPropagation()}>
                      <TextInput
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateConfig();
                          if (e.key === "Escape") { setEditingConfig(null); setEditName(""); }
                        }}
                        autoFocus
                      />
                      <Stack direction="row" gap={8} justify="end">
                        <Button size="sm" variant="outlined" onClick={() => { setEditingConfig(null); setEditName(""); }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateConfig} disabled={!editName.trim()}>
                          Save
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack direction="row" justify="space-between" align="center">
                      <Text variant="text-14" className={styles.configName}>{config.name}</Text>
                      <Stack direction="row" gap={8} className={styles.configActions}>
                        <button
                          className={styles.configAction}
                          onClick={(e) => { e.stopPropagation(); startEditing(config); }}
                        >
                          Edit
                        </button>
                        <button
                          className={clsx(styles.configAction, styles.deleteAction)}
                          onClick={(e) => { e.stopPropagation(); handleDeleteConfig(config.id); }}
                        >
                          Delete
                        </button>
                      </Stack>
                    </Stack>
                  )}
                </div>
              ))}
              {configs.length === 0 && !isCreating && (
                <Text variant="text-14" className={styles.placeholderText}>
                  No configurations yet.
                </Text>
              )}
            </div>
          </Stack>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          {selectedConfigId ? (
            <Stack gap={0} className={styles.rightPanelInner}>
              {/* Right panel tabs */}
              <div className={styles.rightPanelTabs}>
                <Stack direction="row" align="center" gap={24}>
                  <button
                    className={clsx(styles.tab, rightTab === "custom" && styles.active)}
                    onClick={() => setRightTab("custom")}
                  >
                    <Text variant="text-14" weight="500">Custom dashboard</Text>
                  </button>
                  <button
                    className={clsx(styles.tab, rightTab === "configuration" && styles.active)}
                    onClick={() => setRightTab("configuration")}
                  >
                    <Text variant="text-14" weight="500">Configuration</Text>
                  </button>
                  <button
                    className={clsx(styles.tab, rightTab === "test-cases" && styles.active)}
                    onClick={() => setRightTab("test-cases")}
                  >
                    <Text variant="text-14" weight="500">Test cases</Text>
                  </button>
                  <button
                    className={clsx(styles.tab, rightTab === "evaluation" && styles.active)}
                    onClick={() => setRightTab("evaluation")}
                  >
                    <Text variant="text-14" weight="500">Evaluation</Text>
                  </button>
                </Stack>
              </div>

              {/* Right panel content */}
              <div className={styles.rightPanelContent}>
                {rightTab === "custom" && (
                  <DashboardRuntimePage configId={selectedConfigId} />
                )}
                {rightTab === "configuration" && (
                  <DashboardConfigPage projectId={projectId} configId={selectedConfigId} />
                )}
                {rightTab === "evaluation" && (
                  <EvaluationPage projectId={projectId} configId={selectedConfigId} />
                )}
                {rightTab === "test-cases" && (
                  <TestCasesOverviewPage projectId={projectId} />
                )}
              </div>
            </Stack>
          ) : (
            <Stack fullWidth align="center" justify="center" className={styles.placeholder}>
              <Text variant="text-14" className={styles.placeholderText}>
                Select a configuration to view its details.
              </Text>
            </Stack>
          )}
        </div>
      </div>
    </Stack>
  );
};
