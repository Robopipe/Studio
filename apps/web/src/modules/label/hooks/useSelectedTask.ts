import { useEffect, useState } from "react";
import { Task } from "@repo/schema";

export const useSelectedTask = (tasks: Task[]) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (tasks.length > 0 && (selectedTaskId === null || !tasks.some((t) => t.id === selectedTaskId))) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? undefined;

  return { selectedTaskId, setSelectedTaskId, selectedTask };
};
