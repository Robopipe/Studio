import { useCallback, useState } from "react";
import { Annotation } from "../types/annotations";

export const useAnnotations = (initial: Annotation[]) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(initial);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<{ id: string; name: string; color: string } | null>(null);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
    return annotation;
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedAnnotationId((prev) => (prev === id ? null : prev));
  }, []);

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) ?? null;

  return {
    annotations,
    setAnnotations,
    selectedAnnotationId,
    setSelectedAnnotationId,
    selectedAnnotation,
    activeLabel,
    setActiveLabel,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
};
