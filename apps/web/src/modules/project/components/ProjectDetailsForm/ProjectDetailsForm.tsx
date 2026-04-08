import { useAuth } from "@/core/auth/hooks";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Textarea } from "@/modules/shadcn/ui/textarea";
import { ProjectTypeEnum } from "@repo/schema";

interface ProjectDetailsFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  cameraApiUrl: string | null;
  setCameraApiUrl: (val: string) => void;
  projectType: ProjectTypeEnum;
  setProjectType?: (val: ProjectTypeEnum) => void;
  multipleDashboardConfigs?: boolean;
  setMultipleDashboardConfigs?: (val: boolean) => void;
}

export const ProjectDetailsForm = ({
  name,
  setName,
  description,
  setDescription,
  cameraApiUrl,
  setCameraApiUrl,
  projectType,
  setProjectType,
  multipleDashboardConfigs,
  setMultipleDashboardConfigs,
}: ProjectDetailsFormProps) => {
  const { user } = useAuth();

  return (
    <div className="relative flex flex-col gap-8">
      <h5 className="text-xl font-semibold">Projects Details</h5>

      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="projectName" className="font-semibold">
            Project name
          </Label>
          <Input
            id="projectName"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="projectDescription" className="font-semibold">
            Project description
          </Label>
          <Textarea
            id="projectDescription"
            placeholder="Project description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Select
          value={projectType}
          onValueChange={(val) => setProjectType?.(val as ProjectTypeEnum)}
          disabled={!setProjectType}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ProjectTypeEnum).map(([key]) => (
              <SelectItem key={key} value={key}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cameraApiUrl" className="font-semibold">
            Camera API URL
          </Label>
          <Input
            id="cameraApiUrl"
            placeholder={`${user?.cameraApiUrl} (inherited from account settings)`}
            value={cameraApiUrl ?? ""}
            onChange={(e) => setCameraApiUrl(e.target.value)}
          />
        </div>

        {setMultipleDashboardConfigs !== undefined && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={multipleDashboardConfigs ?? false}
              onChange={(e) => setMultipleDashboardConfigs(e.target.checked)}
              className="size-4 cursor-pointer accent-emerald-500"
            />
            <span className="text-sm font-medium">
              Multiple dashboard configurations
            </span>
          </label>
        )}
      </div>
    </div>
  );
};
