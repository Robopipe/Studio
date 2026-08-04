import { appConfig } from "@/config";
import { authApi } from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { captureApi } from "@/modules/capture/services/captureApi";
import { runConfigApi } from "@/modules/run/services/runConfigApi";
import { modelApi } from "@/modules/model/services";
import { projectApi } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useAppDispatch } from "@/hooks/redux";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { organizationApi, useDeleteOrganizationMutation } from "../../services/organizationApi";

interface DangerZoneProps {
  organization: { id: number; name: string };
}

export const DangerZone = ({ organization }: DangerZoneProps) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteOrganization, { isLoading }] = useDeleteOrganizationMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isConfirmed = confirmText.trim() === organization.name;

  const handleConfirm = async () => {
    try {
      await deleteOrganization().unwrap();
      dispatch(projectApi.util.resetApiState());
      dispatch(organizationApi.util.resetApiState());
      dispatch(modelApi.util.resetApiState());
      dispatch(captureApi.util.resetApiState());
      dispatch(cameraApi.util.resetApiState());
      dispatch(runConfigApi.util.resetApiState());
      dispatch(authApi.util.resetApiState());
      navigate(appConfig.web.routes.auth.selectOrganization, { replace: true });
      toast.success("Organization deleted");
    } catch {
      toast.error("Failed to delete organization");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold text-destructive">Danger zone</h5>
        <p className="text-sm text-muted-foreground">
          Permanently delete this organization and all its data. This action cannot be undone.
        </p>
        <div>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete organization
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => !isLoading && setOpen(o)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Delete organization?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{organization.name}</strong> and all its data.
              This action is irreversible and cannot be undone. To confirm, type the organization name below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmOrgName">Organization name</Label>
            <Input
              id="confirmOrgName"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={organization.name}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setOpen(false); setConfirmText(""); }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
            >
              {isLoading ? "Deleting…" : "Delete organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
