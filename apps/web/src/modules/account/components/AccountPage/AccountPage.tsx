import { useAuth } from "@/core/auth/hooks";
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from "@/core/auth/services/authApi";
import { fieldErrorsFromZod, isFetchBaseQueryError } from "@/core/auth/utils";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { changePasswordSchema } from "@repo/schema";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PasswordFieldErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

export interface AccountPageProps {}

export const AccountPage = ({}: AccountPageProps) => {
  const { user } = useAuth();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordFieldErrors>(
    {},
  );

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

  const clearPasswordError = (field: keyof PasswordFieldErrors) => {
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleChangePassword = async () => {
    // Collect all field errors before deciding whether to abort
    const errors: PasswordFieldErrors = {};

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
    });
    if (!parsed.success) {
      const zodErrors = fieldErrorsFromZod(parsed.error);
      if (zodErrors.currentPassword)
        errors.currentPassword = zodErrors.currentPassword;
      if (zodErrors.newPassword) errors.newPassword = zodErrors.newPassword;
    }

    if (newPassword && newPassword === currentPassword) {
      errors.newPassword =
        "New password must be different from the current password";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (isFetchBaseQueryError(error) && error.status === 400) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
        return;
      }
      toast.error("Failed to change password");
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

      <div className="mt-10 flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Change Password</h5>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            aria-invalid={!!passwordErrors.currentPassword || undefined}
            aria-describedby={
              passwordErrors.currentPassword
                ? "currentPassword-error"
                : undefined
            }
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              clearPasswordError("currentPassword");
            }}
          />
          {passwordErrors.currentPassword && (
            <p id="currentPassword-error" className="text-xs text-destructive">
              {passwordErrors.currentPassword}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            aria-invalid={!!passwordErrors.newPassword || undefined}
            aria-describedby={
              passwordErrors.newPassword ? "newPassword-error" : undefined
            }
            onChange={(e) => {
              setNewPassword(e.target.value);
              clearPasswordError("newPassword");
            }}
          />
          {passwordErrors.newPassword ? (
            <p id="newPassword-error" className="text-xs text-destructive">
              {passwordErrors.newPassword}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            aria-invalid={!!passwordErrors.confirmPassword || undefined}
            aria-describedby={
              passwordErrors.confirmPassword
                ? "confirmPassword-error"
                : undefined
            }
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearPasswordError("confirmPassword");
            }}
          />
          {passwordErrors.confirmPassword && (
            <p id="confirmPassword-error" className="text-xs text-destructive">
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>
        <Button
          className="h-11 self-end"
          onClick={handleChangePassword}
          disabled={
            isChangingPassword ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
        >
          {isChangingPassword ? "Saving..." : "Change Password"}
        </Button>
      </div>
    </div>
  );
};
