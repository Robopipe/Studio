import { useGetProjectQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { cn } from "@/lib/utils";
import { DashboardConfiguration } from "@repo/schema";
import { Link } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router";
import {
  useCreateDashboardConfigMutation,
  useDeleteDashboardConfigMutation,
  useGetDashboardConfigsQuery,
  useUpdateDashboardConfigMutation,
} from "../../services/dashboardConfigApi";

import { EvaluationThresholdsPage } from "@/modules/evaluation";
import { TestCasesOverviewPage } from "@/modules/evaluation";
import { ReportsPage } from "@/modules/reports";
import { DashboardRuntimePage } from "../DashboardRuntimePage";

type RightPanelTab = "custom" | "evaluation" | "test-cases" | "reports";

export interface DashboardPageProps {
  dashboardUrl: string | null;
  onConfigChange: (configId: number | null) => void;
}

export const DashboardPage = ({
  dashboardUrl,
  onConfigChange,
}: DashboardPageProps) => {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightPanelTab>("custom");
  const [isCreating, setIsCreating] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [editingConfig, setEditingConfig] =
    useState<DashboardConfiguration | null>(null);
  const [editName, setEditName] = useState("");

  const { data: project } = useGetProjectQuery({ projectId });
  const { data: configs = [] } = useGetDashboardConfigsQuery({ projectId });
  const [createConfig] = useCreateDashboardConfigMutation();
  const [updateConfig] = useUpdateDashboardConfigMutation();
  const [deleteConfig] = useDeleteDashboardConfigMutation();

  const showMultipleConfigs = project?.multipleDashboardConfigs ?? false;

  // Auto-select the first config when multiple configs is off, or when no config is selected yet
  useEffect(() => {
    if (configs.length > 0 && selectedConfigId === null) {
      setSelectedConfigId(configs[0].id);
    }
  }, [configs, selectedConfigId]);

  const activeConfigId = showMultipleConfigs
    ? selectedConfigId
    : configs[0]?.id ?? null;

  // Notify parent of active config changes
  useEffect(() => {
    onConfigChange(activeConfigId);
  }, [activeConfigId, onConfigChange]);

  const handleCreateConfig = async () => {
    if (!newConfigName.trim()) return;
    const result = await createConfig({
      projectId,
      name: newConfigName.trim(),
    }).unwrap();
    setNewConfigName("");
    setIsCreating(false);
    setSelectedConfigId(result.id);
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig || !editName.trim()) return;
    await updateConfig({
      projectId,
      configId: editingConfig.id,
      name: editName.trim(),
    }).unwrap();
    setEditingConfig(null);
    setEditName("");
  };

  const handleDeleteConfig = async (configId: number) => {
    await deleteConfig({ projectId, configId }).unwrap();
    if (selectedConfigId === configId) {
      setSelectedConfigId(configs.find((c) => c.id !== configId)?.id ?? null);
    }
  };

  const startEditing = (config: DashboardConfiguration) => {
    setEditingConfig(config);
    setEditName(config.name);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="flex h-full min-h-0 flex-1">
        {/* Left panel - configuration list (only when multiple configs enabled) */}
        {showMultipleConfigs && (
          <div className="w-[280px] min-w-[280px] overflow-y-auto border-r border-black/10 bg-gray-50 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center justify-between">
                <span className="text-sm font-bold">Configurations</span>
                <Button size="sm" onClick={() => setIsCreating(true)}>
                  + New
                </Button>
              </div>

              {isCreating && (
                <div className="flex flex-col gap-2 rounded-md border border-black/10 bg-gray-100 p-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="newConfigName">Name</Label>
                    <Input
                      id="newConfigName"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                      placeholder="Configuration name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateConfig();
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewConfigName("");
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-row justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewConfigName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateConfig}
                      disabled={!newConfigName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-0.5">
                {configs.map((config) => {
                  const isSelected = selectedConfigId === config.id;
                  const isEditing = editingConfig?.id === config.id;
                  return (
                    <div
                      key={config.id}
                      className={cn(
                        "group cursor-pointer rounded-md px-3 py-2.5 transition-colors hover:bg-gray-100",
                        isSelected && "border border-emerald-200 bg-emerald-50"
                      )}
                      onClick={() => setSelectedConfigId(config.id)}
                    >
                      {isEditing ? (
                        <div
                          className="flex flex-col gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`editName-${config.id}`}>
                              Name
                            </Label>
                            <Input
                              id={`editName-${config.id}`}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateConfig();
                                if (e.key === "Escape") {
                                  setEditingConfig(null);
                                  setEditName("");
                                }
                              }}
                              autoFocus
                            />
                          </div>
                          <div className="flex flex-row justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingConfig(null);
                                setEditName("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateConfig}
                              disabled={!editName.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row items-center justify-between">
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                            {config.name}
                          </span>
                          <div
                            className={cn(
                              "flex shrink-0 flex-row gap-2 opacity-0 transition-opacity group-hover:opacity-100",
                              isSelected && "opacity-100"
                            )}
                          >
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-none p-0 text-xs text-emerald-600 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(config);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-none p-0 text-xs text-red-500 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfig(config.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {configs.length === 0 && !isCreating && (
                  <span className="text-sm text-gray-500">
                    No configurations yet.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right panel */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50">
          {activeConfigId ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Right panel tabs */}
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-black/10 bg-gray-50 px-6">
                <div className="flex flex-row items-center gap-6">
                  {(
                    [
                      { key: "custom", label: "Custom dashboard" },
                      { key: "test-cases", label: "Test cases" },
                      { key: "evaluation", label: "Evaluation" },
                      { key: "reports", label: "Reports" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={cn(
                        "relative cursor-pointer border-none bg-none px-0 py-3 text-gray-500 hover:text-gray-700",
                        rightTab === tab.key &&
                          "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:content-['']"
                      )}
                      onClick={() => setRightTab(tab.key)}
                    >
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!dashboardUrl}
                  onClick={() => {
                    if (!dashboardUrl) return;
                    navigator.clipboard.writeText(dashboardUrl).then(() => {
                      toast.success("Dashboard link copied to clipboard");
                    });
                  }}
                >
                  <Link className="size-4" />
                  Copy link
                </Button>
              </div>

              {/* Right panel content — key forces remount on config switch to reset local state */}
              <div
                className="flex flex-1 flex-col overflow-y-auto p-4"
                key={activeConfigId}
              >
                {rightTab === "custom" && (
                  <DashboardRuntimePage
                    configId={activeConfigId}
                    dashboardUrl={dashboardUrl}
                  />
                )}
                {rightTab === "evaluation" && (
                  <EvaluationThresholdsPage
                    projectId={projectId}
                    configId={activeConfigId}
                  />
                )}
                {rightTab === "test-cases" && (
                  <TestCasesOverviewPage
                    projectId={projectId}
                    dashboardConfigurationId={activeConfigId}
                  />
                )}
                {rightTab === "reports" && (
                  <ReportsPage
                    dashboardId={activeConfigId}
                    projectId={projectId}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[300px] w-full flex-1 items-center justify-center">
              <span className="text-sm text-gray-500">
                {showMultipleConfigs
                  ? "Select a configuration to view its details."
                  : "No dashboard configuration available."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
