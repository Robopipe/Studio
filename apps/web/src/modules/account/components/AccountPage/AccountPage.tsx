import { useAuth } from "@/core/auth/hooks";
import { useUpdateProfileMutation } from "@/core/auth/services/authApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface AccountPageProps {}

export const AccountPage = ({}: AccountPageProps) => {
  const { user } = useAuth();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [fullName, setFullName] = useState(user?.fullName ?? "");

  useEffect(() => {
    if (user) setFullName(user.fullName);
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) return;
    try {
      await updateProfile({ fullName: fullName.trim() }).unwrap();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Account Info</h5>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={user?.email ?? ""} disabled />
        </div>
        <div className="flex flex-row items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button
            className="h-11"
            onClick={handleSave}
            disabled={
              isUpdating ||
              !fullName.trim() ||
              fullName.trim() === user?.fullName
            }
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};
