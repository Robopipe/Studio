import { useAuth } from "@/core/auth/hooks";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { OrgMemberRoleEnum } from "@repo/schema";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
} from "../../services";
import { MemberList } from "../MemberList";
import { DangerZone } from "../DangerZone/DangerZone";

export const OrganizationSettingsPage = () => {
  const { role } = useAuth();
  const { data: organization, isLoading } = useGetOrganizationQuery();
  const [updateOrganization, { isLoading: isUpdating }] =
    useUpdateOrganizationMutation();
  const [name, setName] = useState("");
  const canManage =
    role === OrgMemberRoleEnum.ADMIN || role === OrgMemberRoleEnum.OWNER;

  useEffect(() => {
    if (organization) {
      setName(organization.name);
    }
  }, [organization]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateOrganization({ name: name.trim() }).unwrap();
      toast.success("Organization updated");
    } catch {
      toast.error("Failed to update organization");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[640px] p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Organization</h5>
        <div className="flex flex-row items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="orgName">Name</Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
            />
          </div>
          {canManage && (
            <Button
              onClick={handleSave}
              disabled={isUpdating || name.trim() === organization?.name}
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
      <div className="my-4 h-px bg-black/10" />
      <MemberList />
      {role === OrgMemberRoleEnum.OWNER && organization && (
        <>
          <div className="my-4 h-px bg-black/10" />
          <DangerZone organization={organization} />
        </>
      )}
    </div>
  );
};
