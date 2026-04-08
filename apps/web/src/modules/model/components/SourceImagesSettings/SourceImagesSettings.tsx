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
      <div className="flex flex-row flex-wrap items-center gap-2">
        <span className="mr-3 text-xs text-foreground/90">Labels</span>
        {mappedLabels.map((label) => (
          <button
            type="button"
            key={label.id}
            style={{ "--label-color": label.color } as CSSProperties}
            onClick={() =>
              label.isActive
                ? setActiveLabels(
                    activeLabels.filter((l) => l.id !== label.id),
                  )
                : setActiveLabels([...activeLabels, label])
            }
            className={cn(
              "flex cursor-pointer items-center rounded-md border border-transparent p-1 transition-colors",
              label.isActive
                ? "[background-color:color-mix(in_oklab,var(--label-color),transparent_85%)] [border-color:var(--label-color)]"
                : "bg-black/10 opacity-60 hover:opacity-80",
            )}
          >
            <span
              className="h-6 w-2 shrink-0 rounded-[4px]"
              style={{ background: "var(--label-color)" }}
            />
            <span
              className={cn(
                "px-2 text-xs leading-4 text-foreground/90",
                label.isActive ? "font-bold" : "font-normal",
              )}
            >
              {label.name}
            </span>
          </button>
        ))}
      </div>
    </SettingsCard>
  );
};
