import { useAuth } from "@/core/auth/hooks/useAuth";
import { useProfileQuery } from "@/core/auth/services";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_REPORT_POLL_MS,
  isReportActive,
  useGetConfidenceReportQuery,
  useGetConfidenceReportRegionsQuery,
} from "@/modules/analytics/services/confidenceReportApi";
import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useGetModelsQuery } from "@/modules/model/services/modelApi";
import { EditProjectModal } from "@/modules/project/components/EditProjectModal";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  useDeletePreAnnotateSettingsMutation,
  useGetPreAnnotateSettingsQuery,
  useGetProjectLabelsQuery,
  useUpdatePreAnnotateSettingsMutation,
} from "@/modules/project/services/projectApi";
import {
  ConfidenceReportStatusEnum,
  DetectionPreAnnotateSettings,
  Label,
  OrgMemberRoleEnum,
  PRE_ANNOTATE_DEFAULTS,
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
  SegmentationPreAnnotateSettings,
} from "@repo/schema";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAnnotationNudge } from "../../hooks/useAnnotationNudge";
import { useCanvasState } from "../../hooks/useCanvasState";
import { useHistory } from "../../hooks/useHistory";
import { useLabelShortcuts } from "../../hooks/useLabelShortcuts";
import { useLabelUrlState } from "../../hooks/useLabelUrlState";
import { useToolMode } from "../../hooks/useToolMode";
import {
  useGetTaskQuery,
  usePredictAnnotationsMutation,
  useUpdateTaskMutation,
} from "../../services/labelApi";
import { Annotation } from "../../types/annotations";
import {
  annotationsToUpdatePayload,
  regionsToAnnotations,
  taskDetailToAnnotations,
} from "../../utils/mapAnnotations";
import {
  addToGroup,
  assignPasteGroups,
  canGroupSelection,
  groupSelected,
  removeFromGroup,
  ungroupAnnotations,
} from "../../utils/groupAnnotations";
import { AnnotationPanel } from "../AnnotationPanel";
import { Canvas, CanvasHandle } from "../Canvas";
import { ClassSelect } from "../ClassSelect";
import { DataSourcePanel } from "../DataSourcePanel";
import { LeaveAnnotationsDialog } from "../LeaveAnnotationsDialog";
import { PreAnnotateSettingsDialog } from "../PreAnnotateSettingsDialog";
import { Toolbar } from "../Toolbar";

const TASKS_PER_PAGE = 50;

export const LabelPage = () => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const {
    selectedTaskId,
    setSelectedTaskId,
    page,
    setPage,
    filter,
    setFilter,
    sort,
    setSort,
    pendingAnchorRef,
  } = useLabelUrlState();

  // ─── Inferred-regions tab ──────────────────────────────────────────────────
  // Declared early so queries below can reference activeAnnotationTab.
  const [activeAnnotationTab, setActiveAnnotationTab] = useState<
    "labels" | "history" | "inferred"
  >("labels");
  const [showGtOverlay, setShowGtOverlay] = useState(false);

  // Poll the confidence report so we know whether to poll tasks as well.
  const { data: confidenceReport } = useGetConfidenceReportQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const { data: tasksData, isFetching: isFetchingTasks } = useGetTasksQuery(
    {
      projectId: projectId!,
      page,
      limit: TASKS_PER_PAGE,
      ...(filter.annotationFilter !== "all" && {
        annotated: filter.annotationFilter,
      }),
      ...(filter.labelIds.length > 0 && {
        labelIds: filter.labelIds.join(","),
      }),
      ...(filter.updatedBy.length > 0 && {
        updatedBy: filter.updatedBy.join(","),
      }),
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    {
      skip: !projectId,
      refetchOnMountOrArgChange: true,
      // While a confidence report is running, poll tasks so metric badges
      // stream in as the batch job processes each chunk.
      pollingInterval: isReportActive(confidenceReport)
        ? CONFIDENCE_REPORT_POLL_MS
        : 0,
    },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;

  const { data: labels = [], isLoading: isLoadingLabels } =
    useGetProjectLabelsQuery({ projectId: projectId! }, { skip: !projectId });

  // Whenever there's no task in the URL but the current page has tasks,
  // pick one. Covers two cases:
  //   - Initial load (no `?task=…`) → pick the first task.
  //   - After a page change (`setPage` clears the task) → pick first or
  //     last depending on the queued anchor.
  // Gated on `!isFetchingTasks` so we never anchor on the *previous*
  // page's data — RTK Query keeps `data` around while refetching.
  useEffect(() => {
    if (selectedTaskId !== null || isFetchingTasks || tasks.length === 0)
      return;
    const targetId =
      pendingAnchorRef.current === "last"
        ? tasks[tasks.length - 1].id
        : tasks[0].id;
    setSelectedTaskId(targetId, { replace: true });
    pendingAnchorRef.current = null;
  }, [
    selectedTaskId,
    isFetchingTasks,
    tasks,
    setSelectedTaskId,
    pendingAnchorRef,
  ]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const { data: taskDetail } = useGetTaskQuery(
    { projectId: projectId!, taskId: selectedTaskId! },
    { skip: !projectId || selectedTaskId === null },
  );

  // Inferred regions for the selected task — only fetched while on the Inferred tab.
  const { data: rawRegions = [], isLoading: isLoadingRegions } =
    useGetConfidenceReportRegionsQuery(
      { projectId: projectId!, taskId: selectedTaskId! },
      {
        skip:
          activeAnnotationTab !== "inferred" ||
          !projectId ||
          selectedTaskId === null,
        // Poll while the report is running so regions stream in.
        pollingInterval: isReportActive(confidenceReport)
          ? CONFIDENCE_REPORT_POLL_MS
          : 0,
      },
    );

  const inferredAnnotations = useMemo(
    () => regionsToAnnotations(rawRegions),
    [rawRegions],
  );

  const [updateTask] = useUpdateTaskMutation();
  const [predictAnnotations, { isLoading: isPredicting }] =
    usePredictAnnotationsMutation();
  const { data: profile } = useProfileQuery();
  const { role } = useAuth();
  const canManagePreAnnotateSettings =
    role === OrgMemberRoleEnum.OWNER || role === OrgMemberRoleEnum.ADMIN;
  const { data: models = [] } = useGetModelsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const [preAnnotateOpen, setPreAnnotateOpen] = useState(false);
  const [
    updatePreAnnotateSettingsMutation,
    { isLoading: isSavingPreAnnotateSettings },
  ] = useUpdatePreAnnotateSettingsMutation();
  const [
    deletePreAnnotateSettingsMutation,
    { isLoading: isDeletingPreAnnotateSettings },
  ] = useDeletePreAnnotateSettingsMutation();

  const { data: savedSegSettings } = useGetPreAnnotateSettingsQuery(
    { projectId: projectId!, modelType: PreAnnotateModelTypeEnum.SEGMENTATION },
    { skip: !projectId },
  );
  const { data: savedDetSettings } = useGetPreAnnotateSettingsQuery(
    { projectId: projectId!, modelType: PreAnnotateModelTypeEnum.DETECTION },
    { skip: !projectId },
  );

  const segSettings: SegmentationPreAnnotateSettings =
    (savedSegSettings as SegmentationPreAnnotateSettings | undefined) ??
    PRE_ANNOTATE_DEFAULTS[PreAnnotateModelTypeEnum.SEGMENTATION];
  const detSettings: DetectionPreAnnotateSettings =
    (savedDetSettings as DetectionPreAnnotateSettings | undefined) ??
    PRE_ANNOTATE_DEFAULTS[PreAnnotateModelTypeEnum.DETECTION];


  // One-time cleanup: remove old per-user localStorage keys from before
  // settings were centralised in the DB.
  useEffect(() => {
    if (!profile?.id || !projectId) return;
    try {
      localStorage.removeItem(`preAnnotateSettings:${profile.id}:${projectId}`);
    } catch {
      // ignore
    }
  }, [profile?.id, projectId]);

  const updatePreAnnotateSettings = useCallback(
    async (next: PreAnnotateSettings): Promise<void> => {
      if (!projectId) return;
      await updatePreAnnotateSettingsMutation({
        projectId,
        modelType: next.modelType,
        body: next,
      }).unwrap();
    },
    [projectId, updatePreAnnotateSettingsMutation],
  );

  const deletePreAnnotateSettings = useCallback(
    async (modelType: PreAnnotateModelTypeEnum): Promise<void> => {
      if (!projectId) return;
      await deletePreAnnotateSettingsMutation({
        projectId,
        modelType,
      }).unwrap();
    },
    [projectId, deletePreAnnotateSettingsMutation],
  );

  const { toolMode, setToolMode } = useToolMode();
  const [showCrosshair, setShowCrosshair] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("label.crosshair") === "1";
  });
  const toggleCrosshair = useCallback(() => {
    setShowCrosshair((prev) => {
      const next = !prev;
      window.localStorage.setItem("label.crosshair", next ? "1" : "0");
      return next;
    });
  }, []);
  const [toolbarsVisible, setToolbarsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("label.toolbarsVisible");
    return stored === null ? true : stored === "1";
  });
  const toggleToolbars = useCallback(() => {
    setToolbarsVisible((prev) => {
      const next = !prev;
      window.localStorage.setItem("label.toolbarsVisible", next ? "1" : "0");
      return next;
    });
  }, []);
  const canvasRef = useRef<CanvasHandle>(null);
  const handleResetView = useCallback(() => canvasRef.current?.resetView(), []);
  const imageDimsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const prevTaskIdRef = useRef<number | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<
    Set<string>
  >(() => new Set());
  const [primarySelectedId, setPrimarySelectedId] = useState<string | null>(
    null,
  );
  const clipboardRef = useRef<{
    projectId: number;
    annotations: Annotation[];
  } | null>(null);
  const [hiddenAnnotationIds, setHiddenAnnotationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const isolateAnnotation = useCallback(
    (id: string | null) => {
      setIsolatedLabelId(null);
      setHiddenAnnotationIds(
        id
          ? new Set(annotations.filter((a) => a.id !== id).map((a) => a.id))
          : new Set(),
      );
    },
    [annotations],
  );
  // Transient "h"-hold overlay; does not mutate hiddenAnnotationIds so the
  // per-annotation eye toggles are restored exactly on release.
  const [previewHideAll, setPreviewHideAll] = useState(false);
  const startPreviewHideAll = useCallback(() => setPreviewHideAll(true), []);
  const stopPreviewHideAll = useCallback(() => setPreviewHideAll(false), []);
  // Persistent class filter set by clicking a class in the Annotations tab.
  // Acts radio-style: re-click same class or click "Any" to clear.
  const [isolatedLabelId, setIsolatedLabelId] = useState<string | null>(null);

  const setIsolatedLabel = useCallback(
    (labelId: string) => {
      setIsolatedLabelId(labelId);
      setHiddenAnnotationIds(
        new Set(
          annotations.filter((a) => a.labelId !== labelId).map((a) => a.id),
        ),
      );
      // Only update the drawing label when no region is selected. With an
      // active selection the unanimity effect owns activeLabel and would
      // immediately override this, causing a visible flicker.
      if (selectedAnnotationIds.size === 0) {
        const label = labels.find((l) => String(l.id) === labelId);
        if (label) setActiveLabel(label);
      }
    },
    [labels, selectedAnnotationIds],
  );
  const clearIsolatedLabel = useCallback(
    (showHidden: boolean = false) => {
      setIsolatedLabelId(null);
      if (showHidden) {
        setHiddenAnnotationIds(new Set());
      }
    },
    [setHiddenAnnotationIds],
  );
  const toggleAllAnnotationsVisibility = useCallback(() => {
    if (hiddenAnnotationIds.size === 0) {
      setHiddenAnnotationIds(new Set(annotations.map((a) => a.id)));
    } else {
      setHiddenAnnotationIds(new Set());
      clearIsolatedLabel();
    }
  }, [
    annotations,
    hiddenAnnotationIds,
    setHiddenAnnotationIds,
    clearIsolatedLabel,
  ]);
  const toggleAnnotationVisibility = useCallback(
    (id: string) => {
      setHiddenAnnotationIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (isolatedLabelId !== annotations.find((a) => a.id === id)?.labelId) {
        clearIsolatedLabel();
      }
    },
    [isolatedLabelId, annotations, clearIsolatedLabel],
  );
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const canvasState = useCanvasState();

  const setAnnotationsAndDirty: typeof setAnnotations = useCallback((value) => {
    setAnnotations(value);
    setIsDirty(true);
  }, []);

  const history = useHistory({
    annotations,
    setAnnotations: setAnnotationsAndDirty,
  });

  const handleSelect = useCallback(
    (id: string | null, opts?: { additive?: boolean; range?: boolean }) => {
      if (id === null) {
        setSelectedAnnotationIds(new Set());
        setPrimarySelectedId(null);
        return;
      }
      if (opts?.range && primarySelectedId !== null) {
        const ids = annotations.map((a) => a.id);
        const fromIdx = ids.indexOf(primarySelectedId);
        const toIdx = ids.indexOf(id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [lo, hi] =
            fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
          setSelectedAnnotationIds(new Set(ids.slice(lo, hi + 1)));
          setPrimarySelectedId(id);
          return;
        }
      }
      if (!opts?.additive) {
        setSelectedAnnotationIds(new Set([id]));
        setPrimarySelectedId(id);
        return;
      }
      const next = new Set(selectedAnnotationIds);
      if (next.has(id)) {
        next.delete(id);
        setSelectedAnnotationIds(next);
        setPrimarySelectedId(next.size > 0 ? Array.from(next).pop()! : null);
      } else {
        next.add(id);
        setSelectedAnnotationIds(next);
        setPrimarySelectedId(id);
      }
    },
    [selectedAnnotationIds, primarySelectedId, annotations],
  );

  const handleSelectFromSidebar = useCallback(
    (id: string, opts?: { additive?: boolean; range?: boolean }) => {
      if (isolatedLabelId !== null) {
        const clickedIdx = annotations.findIndex((a) => a.id === id);
        if (clickedIdx >= 0) {
          const isRemoval = !!opts?.additive && selectedAnnotationIds.has(id);
          let added: Annotation[] = [];
          if (!isRemoval) {
            if (opts?.range && primarySelectedId) {
              const anchorIdx = annotations.findIndex(
                (a) => a.id === primarySelectedId,
              );
              if (anchorIdx >= 0) {
                const [lo, hi] =
                  anchorIdx < clickedIdx
                    ? [anchorIdx, clickedIdx]
                    : [clickedIdx, anchorIdx];
                added = annotations.slice(lo, hi + 1);
              } else {
                added = [annotations[clickedIdx]];
              }
            } else {
              added = [annotations[clickedIdx]];
            }
          }
          if (added.some((a) => a.labelId !== isolatedLabelId)) {
            setIsolatedLabelId(null);
            setHiddenAnnotationIds(new Set());
          }
        }
      }
      handleSelect(id, opts);
    },
    [
      isolatedLabelId,
      annotations,
      primarySelectedId,
      selectedAnnotationIds,
      handleSelect,
      setHiddenAnnotationIds,
    ],
  );

  // Wraps history.deleteAnnotation so the id is also removed from the
  // selection Set (the hook itself is now selection-agnostic).
  const deleteAnnotationWithSelection = useCallback(
    (id: string) => {
      history.deleteAnnotation(id);
      setSelectedAnnotationIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setPrimarySelectedId((prev) => (prev === id ? null : prev));
    },
    [history],
  );

  // Set default active label when labels load
  useEffect(() => {
    if (labels.length > 0 && !activeLabel) {
      setActiveLabel(labels[0]);
    }
  }, [labels, activeLabel]);

  // When the selection changes to a unanimous set of same-label regions,
  // mirror that label into activeLabel so the chip reflects the selection.
  // Mixed or empty selections leave activeLabel alone (Q9: indeterminate is display-only).
  useEffect(() => {
    if (selectedAnnotationIds.size === 0) return;
    const selectedLabelIds = new Set(
      annotations
        .filter((a) => selectedAnnotationIds.has(a.id))
        .map((a) => a.labelId),
    );
    if (selectedLabelIds.size !== 1) return;
    const [onlyId] = selectedLabelIds;
    const label = labels.find((l) => String(l.id) === onlyId);
    if (label && label.id !== activeLabel?.id) {
      setActiveLabel(label);
    }
  }, [selectedAnnotationIds, annotations, labels, activeLabel?.id]);

  // Derives the chip's displayed label id. When a multi-selection has mixed
  // labels, no chip is shown (null) while activeLabel stays unchanged for drawing.
  const chipDisplayedLabelId = useMemo<number | null>(() => {
    if (selectedAnnotationIds.size > 1) {
      const labelIds = new Set(
        annotations
          .filter((a) => selectedAnnotationIds.has(a.id))
          .map((a) => a.labelId),
      );
      if (labelIds.size > 1) return null;
    }
    return activeLabel?.id ?? null;
  }, [activeLabel, selectedAnnotationIds, annotations]);

  // Sync annotations from task detail
  useEffect(() => {
    if (!taskDetail) return;
    setAnnotations(taskDetailToAnnotations(taskDetail));
    setIsDirty(false);
    setHiddenAnnotationIds(new Set());
    setPreviewHideAll(false);
    history.reset();
    setSelectedAnnotationIds(new Set());
    setPrimarySelectedId(null);
    imageDimsRef.current = { width: 0, height: 0 };
    if (prevTaskIdRef.current !== taskDetail.id) {
      setIsolatedLabelId(null);
      prevTaskIdRef.current = taskDetail.id;
    }
  }, [taskDetail]);

  const handleReorderAnnotations = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setAnnotationsAndDirty((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setAnnotationsAndDirty],
  );

  const canGroup = useMemo(
    () => canGroupSelection(annotations, selectedAnnotationIds),
    [annotations, selectedAnnotationIds],
  );

  const handleGroupSelected = useCallback(() => {
    if (!canGroup) return;
    const after = groupSelected(annotations, selectedAnnotationIds);
    // Apply the full reordered array in one shot (groupSelected moves members
    // to be contiguous — updateAnnotation can't express a reorder).
    setAnnotationsAndDirty(after);
    // Record for undo: only the annotations whose groupId changed.
    const changes = annotations
      .map((orig) => {
        const updated = after.find((a) => a.id === orig.id);
        if (!updated || updated.groupId === orig.groupId) return null;
        return { before: orig, after: updated };
      })
      .filter(Boolean) as { before: Annotation; after: Annotation }[];
    if (changes.length > 0) history.pushBatchEntry({ label: "group", changes });
  }, [annotations, selectedAnnotationIds, canGroup, history, setAnnotationsAndDirty]);

  const handleUngroupAnnotations = useCallback(
    (groupIds: Set<string>) => {
      const before = annotations.filter(
        (a) => a.groupId && groupIds.has(a.groupId),
      );
      history.runBatch("ungroup", () => {
        for (const a of before) {
          history.updateAnnotation(a.id, { groupId: null });
        }
        // auto-dissolve any remaining singletons (silently clears their groupId)
        // This runs implicitly via autoDissolve in the utilities — we replicate
        // it here for annotations that are NOT in the explicitly ungrouped set
        // but might become singletons after this batch.
        const afterUngroup = ungroupAnnotations(annotations, groupIds);
        for (const a of annotations) {
          if (a.groupId && !groupIds.has(a.groupId)) {
            const afterA = afterUngroup.find((x) => x.id === a.id);
            if (afterA && afterA.groupId !== a.groupId) {
              history.updateAnnotation(a.id, { groupId: afterA.groupId });
            }
          }
        }
      });
    },
    [annotations, history],
  );

  const handleMoveAnnotationInSidebar = useCallback(
    (fromIndex: number, toIndex: number, targetGroupId: string | null) => {
      const movedAnnotation = annotations[fromIndex];
      if (!movedAnnotation) return;

      if (targetGroupId) {
        // Joining a group — addToGroup handles the groupId assignment,
        // compaction (makeGroupContiguous), and dissolving the old group.
        const groupMember = annotations.find((a) => a.groupId === targetGroupId);
        if (groupMember && movedAnnotation.labelId !== groupMember.labelId) {
          toast.error("Cannot add to group: labels must match");
          return;
        }
        if (movedAnnotation.groupId === targetGroupId) {
          handleReorderAnnotations(fromIndex, toIndex);
          return;
        }
        const after = addToGroup(annotations, movedAnnotation.id, targetGroupId);
        const changes = annotations
          .map((orig) => {
            const updated = after.find((a) => a.id === orig.id);
            if (!updated || updated.groupId === orig.groupId) return null;
            return { before: orig, after: updated };
          })
          .filter(Boolean) as { before: Annotation; after: Annotation }[];
        setAnnotationsAndDirty(after);
        if (changes.length > 0) history.pushBatchEntry({ label: "group", changes });
      } else if (movedAnnotation.groupId) {
        // Leaving a group — removeFromGroup handles the groupId clear,
        // compaction of the remaining members, and auto-dissolve.
        const after = removeFromGroup(annotations, movedAnnotation.id);
        const changes = annotations
          .map((orig) => {
            const updated = after.find((a) => a.id === orig.id);
            if (!updated || updated.groupId === orig.groupId) return null;
            return { before: orig, after: updated };
          })
          .filter(Boolean) as { before: Annotation; after: Annotation }[];
        setAnnotationsAndDirty(after);
        if (changes.length > 0) history.pushBatchEntry({ label: "ungroup", changes });
      } else {
        handleReorderAnnotations(fromIndex, toIndex);
      }
    },
    [annotations, history, handleReorderAnnotations, setAnnotationsAndDirty],
  );

  const handleClear = useCallback(() => {
    if (selectedAnnotationIds.size === 0) return;
    const ids = Array.from(selectedAnnotationIds);
    history.runBatch("delete", () => {
      for (const id of ids) history.deleteAnnotation(id);
    });
    setSelectedAnnotationIds(new Set());
    setPrimarySelectedId(null);
  }, [selectedAnnotationIds, history]);

  const cloneAnnotation = useCallback(
    (a: Annotation): Annotation => ({
      ...a,
      bbox: a.bbox ? { ...a.bbox } : undefined,
      points: a.points?.map(([x, y]) => [x, y] as [number, number]),
    }),
    [],
  );

  const handleCopySelection = useCallback(() => {
    if (!projectId || selectedAnnotationIds.size === 0) return;
    const selected = annotations.filter((a) => selectedAnnotationIds.has(a.id));
    if (selected.length === 0) return;
    clipboardRef.current = {
      projectId,
      annotations: selected.map(cloneAnnotation),
    };
    toast.success(
      `Copied ${selected.length} region${selected.length === 1 ? "" : "s"}`,
    );
  }, [annotations, selectedAnnotationIds, projectId, cloneAnnotation]);

  const handleGroupTranslate = useCallback(
    (updates: Array<{ id: string; updates: Partial<Annotation> }>) => {
      if (updates.length === 0) return;
      history.runBatch("move", () => {
        for (const { id, updates: u } of updates)
          history.updateAnnotation(id, u);
      });
    },
    [history],
  );

  const handlePasteClipboard = useCallback(() => {
    if (!projectId) return;
    const clip = clipboardRef.current;
    if (!clip || clip.annotations.length === 0) {
      toast.info("Clipboard is empty");
      return;
    }
    if (clip.projectId !== projectId) {
      toast.error("Clipboard belongs to a different project");
      return;
    }
    const stamp = Date.now();
    const rawPasted: Annotation[] = clip.annotations.map((a, idx) => {
      const cloned = cloneAnnotation(a);
      return { ...cloned, id: `ann-${stamp}-${idx}`, apiId: undefined };
    });
    // Preserve group structure: build a map from original id to new pasted annotation
    // so assignPasteGroups can find the source groupIds
    const sourceMap = clip.annotations.map((original, idx) => ({
      ...rawPasted[idx],
      // carry original id temporarily so assignPasteGroups can look up the groupId
      _originalId: original.id,
    }));
    const pastedWithSrcIds = rawPasted.map((a, idx) => ({
      ...a,
      id: sourceMap[idx]._originalId,
    }));
    const withGroups = assignPasteGroups(pastedWithSrcIds, clip.annotations);
    // Re-assign the new pasted ids
    const pasted: Annotation[] = rawPasted.map((a, idx) => ({
      ...a,
      groupId: withGroups[idx]?.groupId,
    }));
    history.runBatch("paste", () => {
      for (const ann of pasted) history.addAnnotation(ann);
    });
    const newIds = pasted.map((a) => a.id);
    setSelectedAnnotationIds(new Set(newIds));
    setPrimarySelectedId(newIds[newIds.length - 1] ?? null);
    toast.success(
      `Pasted ${pasted.length} region${pasted.length === 1 ? "" : "s"}`,
    );
  }, [projectId, history, cloneAnnotation]);

  const handleSelectLabel = useCallback(
    (labelId: number) => {
      const label = labels.find((l) => l.id === labelId);
      if (!label) return;

      const changed = label.id !== activeLabel?.id;

      if (selectedAnnotationIds.size > 0) {
        const ids = Array.from(selectedAnnotationIds);
        const newLabelId = String(label.id);
        history.runBatch("relabel", () => {
          for (const id of ids) {
            const a = annotations.find((x) => x.id === id);
            history.updateAnnotation(id, {
              labelId: newLabelId,
              labelName: label.name,
              color: label.color,
            });
            // Auto-eject from group if label changes while in a group
            if (a?.groupId && a.labelId !== newLabelId) {
              const groupSiblings = annotations.filter(
                (x) => x.id !== id && x.groupId === a.groupId,
              );
              history.updateAnnotation(id, { groupId: null });
              // Auto-dissolve the group if it becomes a singleton
              if (groupSiblings.length === 1) {
                history.updateAnnotation(groupSiblings[0].id, { groupId: null });
              }
            }
          }
        });
        // Notify user if any grouped regions were ejected
        const ejectedCount = ids.filter((id) => {
          const a = annotations.find((x) => x.id === id);
          return a?.groupId && a.labelId !== newLabelId;
        }).length;
        if (ejectedCount > 0) {
          toast.info(
            `${ejectedCount} region${ejectedCount === 1 ? "" : "s"} removed from group (label changed)`,
          );
        }
      }

      setActiveLabel(label);

      if (changed && isolatedLabelId !== null) {
        setIsolatedLabelId(null);
      }
    },
    [labels, activeLabel?.id, selectedAnnotationIds, annotations, history, isolatedLabelId],
  );

  const canMarkEmpty = true;

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = useCallback(
    async (options?: { reviewed?: boolean }) => {
      if (!projectId || selectedTaskId === null) return;
      setIsSaving(true);
      try {
        const payload = annotationsToUpdatePayload(annotations);
        await updateTask({
          projectId,
          taskId: selectedTaskId,
          body: { ...payload, ...(options?.reviewed && { reviewed: true }) },
        }).unwrap();
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, selectedTaskId, annotations, updateTask],
  );

  const handleSaveEmpty = useCallback(() => {
    handleSave({ reviewed: true });
  }, [handleSave]);

  const handlePreAnnotate = useCallback(
    (modelType: PreAnnotateModelTypeEnum) => {
      if (!projectId || selectedTaskId === null) return;

      const modelId =
        modelType === PreAnnotateModelTypeEnum.DETECTION
          ? detSettings.modelId
          : segSettings.modelId;
      if (modelId === null) return;

      const isDetection = modelType === PreAnnotateModelTypeEnum.DETECTION;
      const conflictingAnnotations = isDetection
        ? annotations.filter((a) => a.type === "bbox")
        : annotations.filter((a) => a.type === "polygon");
      if (conflictingAnnotations.length > 0) return;

      const labelById = new Map(labels.map((l) => [l.id, l]));
      const stamp = Date.now();
      const toastId = toast.loading("Pre-annotating...");

      const body =
        modelType === PreAnnotateModelTypeEnum.DETECTION
          ? {
              modelType: PreAnnotateModelTypeEnum.DETECTION as const,
              modelId: modelId,
              conf: detSettings.conf,
              iou: detSettings.iou,
              minAreaPx: detSettings.minAreaPx,
            }
          : {
              modelType: PreAnnotateModelTypeEnum.SEGMENTATION as const,
              modelId: modelId,
              conf: segSettings.conf,
              iou: segSettings.iou,
              polyEpsilon: segSettings.polyEpsilon,
              maskThreshold: segSettings.maskThreshold,
              minAreaPx: segSettings.minAreaPx,
              fillConcavityLabelIds: segSettings.fillConcavityLabelIds,
            };

      predictAnnotations({ projectId, taskId: selectedTaskId, body })
        .unwrap()
        .then((result) => {
          let predicted: Annotation[] = [];

          if (result.modelType === PreAnnotateModelTypeEnum.DETECTION) {
            predicted = result.rectangles.flatMap((r, idx) => {
              const label = labelById.get(r.labelId);
              if (!label) return [];
              return [
                {
                  id: `pred-${stamp}-${idx}`,
                  apiId: undefined,
                  labelId: String(label.id),
                  labelName: label.name,
                  color: label.color,
                  type: "bbox" as const,
                  bbox: { x: r.x, y: r.y, width: r.width, height: r.height },
                },
              ];
            });
          } else {
            predicted = result.polygons.flatMap((p, idx) => {
              const label = labelById.get(p.labelId);
              if (!label) return [];
              return [
                {
                  id: `pred-${stamp}-${idx}`,
                  apiId: undefined,
                  labelId: String(label.id),
                  labelName: label.name,
                  color: label.color,
                  type: "polygon" as const,
                  points: p.value,
                },
              ];
            });
          }

          // Replace annotations of the predicted geometry type; keep the other type.
          const kept = isDetection
            ? annotations.filter((a) => a.type !== "bbox")
            : annotations.filter((a) => a.type !== "polygon");
          const next = [...kept, ...predicted];

          setAnnotations(next);
          setIsDirty(true);
          history.reset();
          setSelectedAnnotationIds(new Set());
          setPrimarySelectedId(null);

          const noun = isDetection ? "box" : "polygon";
          const plural = isDetection ? "boxes" : "polygons";
          if (predicted.length === 0) {
            toast.info("No predictions above the confidence threshold", {
              id: toastId,
              description: "Try lowering Confidence in the pre-annotate settings.",
            });
          } else {
            toast.success(
              `Pre-annotated ${predicted.length} ${predicted.length === 1 ? noun : plural}`,
              { id: toastId },
            );
          }
        })
        .catch((err: unknown) => {
          const message =
            (err as { data?: { message?: string } })?.data?.message ??
            "Pre-annotation failed";
          toast.error(message, { id: toastId });
        });
    },
    [
      projectId,
      selectedTaskId,
      segSettings,
      detSettings,
      annotations,
      predictAnnotations,
      labels,
      history,
    ],
  );

  const rectangleAnnotations = useMemo(
    () => annotations.filter((a) => a.type === "bbox"),
    [annotations],
  );
  const polygonAnnotations = useMemo(
    () => annotations.filter((a) => a.type === "polygon"),
    [annotations],
  );

  const preAnnotateSegDisabledReason = useMemo(() => {
    if (selectedTaskId === null) return "Select a task first";
    if (polygonAnnotations.length > 0)
      return "Segmentation pre-annotate is only available when no polygons exist";
    if (segSettings.modelId === null)
      return "Choose a segmentation model in pre-annotate settings";
    return undefined;
  }, [selectedTaskId, polygonAnnotations.length, segSettings.modelId]);

  const preAnnotateDetDisabledReason = useMemo(() => {
    if (selectedTaskId === null) return "Select a task first";
    if (rectangleAnnotations.length > 0)
      return "Detection pre-annotate is only available when no boxes exist";
    if (detSettings.modelId === null)
      return "Choose a detection model in pre-annotate settings";
    return undefined;
  }, [selectedTaskId, rectangleAnnotations.length, detSettings.modelId]);

  useLabelShortcuts({
    tasks,
    selectedTaskId,
    page,
    totalPages,
    labels,
    activeLabel,
    isDirty,
    isSaving,
    canMarkEmpty,
    annotationCount: annotations.length,
    onSave: handleSave,
    onSaveEmpty: handleSaveEmpty,
    onSetToolMode: setToolMode,
    onToggleCrosshair: toggleCrosshair,
    onResetView: handleResetView,
    onSelectTask: setSelectedTaskId,
    onChangePage: setPage,
    onSelectLabel: handleSelectLabel,
    onHidePreviewDown: startPreviewHideAll,
    onHidePreviewUp: stopPreviewHideAll,
    onToggleToolbars: toggleToolbars,
  });

  useAnnotationNudge({
    annotations,
    selectedAnnotationIds,
    toolMode,
    imageDimsRef,
    setAnnotations: setAnnotationsAndDirty,
    pushBatchEntry: history.pushBatchEntry,
    startNudge: (ids) => canvasRef.current?.startNudge(ids),
    applyNudge: (dx, dy) => canvasRef.current?.applyNudge(dx, dy),
    clearNudge: () => canvasRef.current?.clearNudge(),
  });

  const isolatedAnnotationId = useMemo(() => {
    if (isolatedLabelId !== null) return null;
    if (
      hiddenAnnotationIds.size === annotations.length - 1 &&
      annotations.length > 0
    ) {
      return (
        annotations.find((a) => !hiddenAnnotationIds.has(a.id))?.id ?? null
      );
    }
    return null;
  }, [hiddenAnnotationIds, annotations, isolatedLabelId]);

  // Priority: hold-to-hide (h) > class isolate > per-annotation hides.
  const visibleAnnotations = useMemo(() => {
    if (previewHideAll) return [];
    if (isolatedLabelId !== null) {
      return annotations.filter((a) => a.labelId === isolatedLabelId);
    }
    return annotations.filter((a) => !hiddenAnnotationIds.has(a.id));
  }, [annotations, hiddenAnnotationIds, previewHideAll, isolatedLabelId]);

  // If the isolated class loses all its annotations (e.g. user deleted them),
  // drop the filter so the canvas isn't stuck empty.
  useEffect(() => {
    if (isolatedLabelId === null) return;
    const stillExists = annotations.some((a) => a.labelId === isolatedLabelId);
    if (!stillExists) setIsolatedLabelId(null);
  }, [annotations, isolatedLabelId]);

  const activeLabelForCanvas = useMemo(
    () =>
      activeLabel
        ? {
            id: String(activeLabel.id),
            name: activeLabel.name,
            color: activeLabel.color,
          }
        : null,
    [activeLabel],
  );

  // When on the Inferred tab the canvas shows only inference predictions
  // (read-only, dashed), optionally with the GT annotations overlaid (solid).
  const isInferredView = activeAnnotationTab === "inferred";
  const canvasAnnotations = useMemo(() => {
    if (!isInferredView) return visibleAnnotations;
    return [
      ...(showGtOverlay ? visibleAnnotations : []),
      ...inferredAnnotations,
    ];
  }, [isInferredView, visibleAnnotations, inferredAnnotations, showGtOverlay]);

  return (
    <div className="-m-6 grid min-h-0 flex-1 grid-cols-[320px_280px_1fr] grid-rows-[minmax(0,1fr)] bg-white">
      <DataSourcePanel
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        annotationCount={annotations.length}
        onSelectTask={setSelectedTaskId}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filter={filter}
        labels={labels}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
      />
      <AnnotationPanel
        annotations={annotations}
        labels={labels}
        selectedAnnotationIds={selectedAnnotationIds}
        onSelectAnnotation={handleSelectFromSidebar}
        onDeleteAnnotation={deleteAnnotationWithSelection}
        onReorderAnnotations={handleReorderAnnotations}
        onMoveAnnotation={handleMoveAnnotationInSidebar}
        onUngroupAnnotations={handleUngroupAnnotations}
        hiddenAnnotationIds={hiddenAnnotationIds}
        onToggleAnnotationVisibility={toggleAnnotationVisibility}
        onToggleAllAnnotationsVisibility={toggleAllAnnotationsVisibility}
        isolatedLabelId={isolatedLabelId}
        onIsolateLabel={setIsolatedLabel}
        onClearIsolate={clearIsolatedLabel}
        historyEntries={history.entries}
        historyIndex={history.currentIndex}
        onJumpTo={history.jumpTo}
        onOpenSettings={() => setSettingsOpen(true)}
        isLoadingLabels={isLoadingLabels}
        projectId={projectId}
        taskId={selectedTaskId}
        isolatedAnnotationId={isolatedAnnotationId}
        onIsolateAnnotation={isolateAnnotation}
        activeTab={activeAnnotationTab}
        onTabChange={setActiveAnnotationTab}
        inferredRegions={rawRegions}
        isLoadingRegions={isLoadingRegions}
        reportStatus={confidenceReport?.status as ConfidenceReportStatusEnum | null ?? null}
        showGtOverlay={showGtOverlay}
        onToggleGtOverlay={setShowGtOverlay}
      />
      <div className="relative flex min-h-0 flex-col overflow-hidden">
        <Canvas
          ref={canvasRef}
          task={selectedTask ?? taskDetail}
          readOnly={isInferredView}
          annotations={canvasAnnotations}
          selectedAnnotationIds={selectedAnnotationIds}
          primarySelectedId={primarySelectedId}
          toolMode={toolMode}
          activeLabel={activeLabelForCanvas}
          scale={canvasState.scale}
          position={canvasState.position}
          isDirty={isDirty}
          isSaving={isSaving}
          canMarkEmpty={canMarkEmpty}
          onSave={handleSave}
          onSaveEmpty={handleSaveEmpty}
          showCrosshair={showCrosshair}
          toolbarsVisible={toolbarsVisible}
          onToggleToolbars={toggleToolbars}
          onSelect={handleSelect}
          onAddAnnotation={history.addAnnotation}
          onUpdateAnnotation={history.updateAnnotation}
          onDeleteSelected={handleClear}
          onCopySelection={handleCopySelection}
          onPasteClipboard={handlePasteClipboard}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={() => {
            const groupIds = new Set(
              Array.from(selectedAnnotationIds)
                .map((id) => annotations.find((a) => a.id === id)?.groupId)
                .filter(Boolean) as string[],
            );
            if (groupIds.size > 0) handleUngroupAnnotations(groupIds);
          }}
          canGroup={canGroup}
          onGroupTranslate={handleGroupTranslate}
          onUndo={history.undo}
          onRedo={history.redo}
          onZoomAtPoint={canvasState.zoomAtPoint}
          onSetPosition={canvasState.setPosition}
          onFitImage={canvasState.fitImage}
          onImageLoad={(w, h) => {
            imageDimsRef.current = { width: w, height: h };
          }}
        />
        <div
          className={cn(
            "pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 transition-[transform,opacity] duration-150",
            !toolbarsVisible && "translate-x-4 opacity-0",
          )}
        >
          <div
            className={
              toolbarsVisible ? "pointer-events-auto" : "pointer-events-none"
            }
          >
            <Toolbar
              toolMode={toolMode}
              onSetToolMode={setToolMode}
              onUndo={history.undo}
              onRedo={history.redo}
              onZoomIn={canvasState.zoomIn}
              onZoomOut={canvasState.zoomOut}
              onClear={handleClear}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              hasSelection={selectedAnnotationIds.size > 0}
              hasLabels={labels.length > 0 || isLoadingLabels}
              showCrosshair={showCrosshair}
              onToggleCrosshair={toggleCrosshair}
              onResetView={handleResetView}
              onPreAnnotate={handlePreAnnotate}
              onOpenPreAnnotateSettings={() => setPreAnnotateOpen(true)}
              preAnnotateSegDisabled={
                preAnnotateSegDisabledReason !== undefined || isPredicting
              }
              preAnnotateDetDisabled={
                preAnnotateDetDisabledReason !== undefined || isPredicting
              }
              preAnnotatePending={isPredicting}
              preAnnotateSegDisabledReason={preAnnotateSegDisabledReason}
              preAnnotateDetDisabledReason={preAnnotateDetDisabledReason}
              preAnnotateSettingsDisabled={!canManagePreAnnotateSettings}
              preAnnotateSettingsDisabledReason={
                !canManagePreAnnotateSettings
                  ? "Only owners and admins can edit pre-annotation settings"
                  : undefined
              }
              canGroup={canGroup}
              onGroupSelected={handleGroupSelected}
            />
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center transition-[transform,opacity] duration-150",
            !toolbarsVisible && "translate-y-4 opacity-0",
          )}
        >
          <div
            className={
              toolbarsVisible
                ? "pointer-events-auto min-w-0 max-w-full"
                : "pointer-events-none min-w-0 max-w-full"
            }
          >
            <ClassSelect
              labels={labels}
              activeLabelId={chipDisplayedLabelId}
              onSelectLabel={handleSelectLabel}
              onOpenSettings={() => setSettingsOpen(true)}
              isLoadingLabels={isLoadingLabels}
            />
          </div>
        </div>
      </div>
      {settingsOpen && activeProject && (
        <EditProjectModal
          project={activeProject}
          initialTabId="labeling"
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <PreAnnotateSettingsDialog
        open={preAnnotateOpen}
        onOpenChange={setPreAnnotateOpen}
        models={models}
        segSettings={segSettings}
        detSettings={detSettings}
        segHasSavedSettings={savedSegSettings != null}
        detHasSavedSettings={savedDetSettings != null}
        onApply={updatePreAnnotateSettings}
        onDelete={deletePreAnnotateSettings}
        isSaving={isSavingPreAnnotateSettings || isDeletingPreAnnotateSettings}
      />
      <LeaveAnnotationsDialog
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
};
