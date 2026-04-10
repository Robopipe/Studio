import { useAuth } from "@/core/auth/hooks";
import { useUpdateProfileMutation } from "@/core/auth/services";
import { DiscoverCameraApi } from "@/modules/discovery/components";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export interface AccountPageProps {}

export const AccountPage = ({}: AccountPageProps) => {
  const { user } = useAuth();
  const [cameraApiUrl, setCameraApiUrl] = useState(
    () => user?.cameraApiUrl || "",
  );
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleSave = async () => {
    if (user) {
      try {
        await updateProfile({
          cameraApiUrl,
          fullName: user.fullName,
        }).unwrap();
        toast.success("Settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Account Info</h5>
        <div className="flex flex-row gap-4 [&>*]:flex-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={user?.fullName ?? ""} disabled />
          </div>
        </div>
      </div>
      <div className="my-4 h-px bg-black/10" />
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Robopipe Integration</h5>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cameraApiUrl">Robopipe API</Label>
          <div className="flex flex-row gap-2">
            <Input
              id="cameraApiUrl"
              className="flex-1"
              value={cameraApiUrl}
              onChange={(e) => setCameraApiUrl(e.target.value)}
            />
            <DiscoverCameraApi onSelect={(url) => setCameraApiUrl(url)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-fit">
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
