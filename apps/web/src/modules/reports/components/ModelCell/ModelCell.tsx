import { Link } from "react-router";

interface ModelCellProps {
  modelId: number | null;
  /** Resolved from the project's model list; unknown ids render as plain #id. */
  modelNameById: Map<number, string>;
  projectId: number | null;
}

export const ModelCell = ({
  modelId,
  modelNameById,
  projectId,
}: ModelCellProps) => {
  if (modelId === null) {
    return <>—</>;
  }

  const name = modelNameById.get(modelId);
  // A missing name means the model was deleted (or the list hasn't loaded) —
  // its detail page would error, so show the bare id without a link.
  if (name === undefined || projectId === null) {
    return <>#{modelId}</>;
  }

  return (
    <Link
      to={`/projects/${projectId}/models/${modelId}`}
      target="_blank"
      rel="noreferrer"
      className="text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
};
