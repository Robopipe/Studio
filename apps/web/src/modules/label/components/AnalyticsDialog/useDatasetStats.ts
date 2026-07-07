import { useGetDatasetStatsQuery } from "@/modules/analytics/services/analyticsApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { AnnotationType } from "@repo/schema";
import { useEffect, useState } from "react";

import { ALL_TYPES } from "./types";

export const useDatasetStats = (open: boolean) => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  // null = not yet initialized; set to available types on first data load
  const [selectedTypes, setSelectedTypes] = useState<AnnotationType[] | null>(null);

  const requestTypes = selectedTypes ?? ALL_TYPES;
  const typesParam = requestTypes.join(",");

  const { data, isLoading, isError } = useGetDatasetStatsQuery(
    { projectId: projectId!, types: typesParam },
    { skip: !projectId || !open },
  );

  // Default selection: only the annotation types that actually have data
  useEffect(() => {
    if (data?.availableTypes && selectedTypes === null) {
      const initial = ALL_TYPES.filter((t) => data.availableTypes[t]);
      setSelectedTypes(initial.length > 0 ? initial : ALL_TYPES);
    }
  }, [data?.availableTypes, selectedTypes]);

  const toggleType = (type: AnnotationType) => {
    setSelectedTypes((prev) => {
      const current = prev ?? ALL_TYPES;
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return next.length > 0 ? next : current;
    });
  };

  const hasGeometricType =
    requestTypes.includes("rectangle") || requestTypes.includes("polygon");

  const hasAnyAreaData = data?.labels.some((l) => l.area !== null) ?? false;

  return {
    data,
    isLoading,
    isError,
    requestTypes,
    toggleType,
    hasGeometricType,
    hasAnyAreaData,
  };
};
