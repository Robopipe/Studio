import { isMixedContentScenario } from "@/core/cameraApi/mixedContentWarning";
import { DiscoverCameraApi } from "@/modules/discovery/components";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Textarea } from "@/modules/shadcn/ui/textarea";
import { useMemo } from "react";
import { useDetectCameras } from "../../hooks/useDetectCameras";
import { validateCameraApiUrl } from "../../utils/validateCameraApiUrl";
import { CameraSelectField } from "./CameraSelectField";

interface ProjectDetailsFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  cameraApiUrl: string | null;
  setCameraApiUrl: (val: string) => void;
  cameraApiUrlError?: string | null;
  onCameraApiUrlBlur?: () => void;
  selectedCameraMxid: string | null;
  setSelectedCameraMxid: (mxid: string | null) => void;
  multipleDashboardConfigs?: boolean;
  setMultipleDashboardConfigs?: (val: boolean) => void;
  localOverride?: string;
  setLocalOverride?: (val: string) => void;
  localOverrideError?: string | null;
  onLocalOverrideBlur?: () => void;
}

export const ProjectDetailsForm = ({
  name,
  setName,
  description,
  setDescription,
  cameraApiUrl,
  setCameraApiUrl,
  cameraApiUrlError,
  onCameraApiUrlBlur,
  selectedCameraMxid,
  setSelectedCameraMxid,
  multipleDashboardConfigs,
  setMultipleDashboardConfigs,
  localOverride,
  setLocalOverride,
  localOverrideError,
  onLocalOverrideBlur,
}: ProjectDetailsFormProps) => {
  const showLocalOverride = setLocalOverride !== undefined;

  // Detect cameras against the URL the app would actually use for this user:
  // the local override when filled, else the shared project URL — both as
  // currently typed, not the saved values. A filled-but-invalid override
  // yields no detection (no silent fallback to the main URL).
  const effectiveDetectionUrl = useMemo(() => {
    const override = (localOverride ?? "").trim();
    if (override) return validateCameraApiUrl(override) ? null : override;
    const main = (cameraApiUrl ?? "").trim();
    if (main) return validateCameraApiUrl(main) ? null : main;
    return null;
  }, [localOverride, cameraApiUrl]);

  const detection = useDetectCameras(effectiveDetectionUrl);

  const detectionErrorMessage =
    detection.isError &&
    effectiveDetectionUrl &&
    isMixedContentScenario(effectiveDetectionUrl)
      ? "Your browser blocked the request: this page is HTTPS but the camera API uses HTTP. Enable insecure content for this site."
      : undefined;

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
              placeholder="https://robopipe-1.local"
              value={cameraApiUrl ?? ""}
              aria-invalid={!!cameraApiUrlError}
              onChange={(e) => setCameraApiUrl(e.target.value)}
              onBlur={onCameraApiUrlBlur}
            />
            <DiscoverCameraApi onSelect={(url) => setCameraApiUrl(url)} />
          </div>
          {cameraApiUrlError && (
            <p className="text-xs text-destructive">{cameraApiUrlError}</p>
          )}
        </div>

        {showLocalOverride && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cameraApiUrlOverride" className="font-semibold">
              Local camera API URL override (stored locally)
            </Label>
            <div className="flex flex-row gap-2">
              <Input
                id="cameraApiUrlOverride"
                className="flex-1"
                placeholder="Leave empty to use the shared project URL"
                value={localOverride ?? ""}
                aria-invalid={!!localOverrideError}
                onChange={(e) => setLocalOverride!(e.target.value)}
                onBlur={onLocalOverrideBlur}
              />
              <DiscoverCameraApi onSelect={(url) => setLocalOverride!(url)} />
            </div>
            {localOverrideError && (
              <p className="text-xs text-destructive">{localOverrideError}</p>
            )}
            <p className="text-xs text-black/50">
              Applies only to you on this browser. Overrides the project URL
              above for all camera communication.
            </p>
          </div>
        )}

        <CameraSelectField
          cameras={detection.cameras}
          isLoading={detection.isLoading}
          isError={detection.isError}
          errorMessage={detectionErrorMessage}
          onRetry={detection.retry}
          hasUrl={effectiveDetectionUrl != null}
          value={selectedCameraMxid}
          onChange={setSelectedCameraMxid}
        />

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
