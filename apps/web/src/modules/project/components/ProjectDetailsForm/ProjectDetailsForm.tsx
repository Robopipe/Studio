import { useAuth } from "@/core/auth/hooks";
import { DiscoverCameraApi } from "@/modules/discovery/components";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Textarea } from "@/modules/shadcn/ui/textarea";

interface ProjectDetailsFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  cameraApiUrl: string | null;
  setCameraApiUrl: (val: string) => void;
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cameraApiUrl" className="font-semibold">
            Camera API URL
          </Label>
          <div className="flex flex-row gap-2">
            <Input
              id="cameraApiUrl"
              className="flex-1"
              placeholder={`${user?.cameraApiUrl} (inherited from account settings)`}
              value={cameraApiUrl ?? ""}
              onChange={(e) => setCameraApiUrl(e.target.value)}
            />
            <DiscoverCameraApi onSelect={(url) => setCameraApiUrl(url)} />
          </div>
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
