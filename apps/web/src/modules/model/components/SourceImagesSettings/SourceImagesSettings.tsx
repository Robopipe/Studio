import { cn } from "@/lib/utils";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { Label } from "@repo/schema";
import { CSSProperties, useEffect, useMemo } from "react";
import { SettingsCard } from "../SettingsCard";

export interface SourceImagesSettingsProps {
  activeLabels: Label[];
  setActiveLabels: (labels: Label[]) => void;
}

export const SourceImagesSettings = (props: SourceImagesSettingsProps) => {
  const { activeLabels, setActiveLabels } = props;
  const [project] = useActiveProject();
  const { data: labels } = useGetProjectLabelsQuery(
    { projectId: project?.id! },
    { skip: !project },
  );
  const mappedLabels = useMemo(
    () =>
      labels?.map((label) => ({
        ...label,
        isActive: activeLabels.some(
          (activeLabel) => activeLabel.id === label.id,
        ),
      })) || [],
    [labels, activeLabels],
  );

  useEffect(() => {
    if (labels && activeLabels.length === 0) {
      setActiveLabels(labels);
    }
  }, [labels]);

  return (
    <SettingsCard title="source images" state="complete" stepNumber={1}>
      <div className="flex flex-row flex-wrap gap-4">
        {mappedLabels.map((label) => (
          <div
            key={label.id}
            style={{ "--label-color": label.color } as CSSProperties}
            className={cn(
              "flex cursor-pointer flex-row items-center gap-1.5 rounded-lg border border-transparent bg-black/10 py-1 pl-1 pr-3",
              label.isActive &&
                "[background-color:color-mix(in_oklab,var(--label-color),transparent_80%)] [border-color:var(--label-color)] [&_span]:font-bold"
            )}
            onClick={() =>
              label.isActive
                ? setActiveLabels(
                    activeLabels.filter((l) => l.id !== label.id),
                  )
                : setActiveLabels([...activeLabels, label])
            }
          >
            <div
              className="h-6 w-2 rounded-sm"
              style={{ background: "var(--label-color)" }}
            />
            <span className="text-sm">{label.name}</span>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
};
