import { useState } from "react";
import { mockTasks, MockTask } from "../mocks/data";

export const useSelectedTask = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(mockTasks[0].id);

  const selectedTask: MockTask | undefined = mockTasks.find(
    (t) => t.id === selectedTaskId,
  );

  return { selectedTaskId, setSelectedTaskId, selectedTask };
};
