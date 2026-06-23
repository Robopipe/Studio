import { useAuth } from "@/core/auth/hooks";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { OrgMemberRoleEnum, UpdateMemberRole, type AssignableRole } from "@repo/schema";
import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  useGetInvitationsQuery,
  useGetMembersQuery,
  useInviteUserMutation,
  useRemoveMemberMutation,
  useRevokeInvitationMutation,
  useUpdateMemberRoleMutation,
} from "../../services";

export const MemberList = () => {
  const { user, role: currentUserRole } = useAuth();
  const { data: members, isLoading } = useGetMembersQuery();
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const canManage =
    currentUserRole === OrgMemberRoleEnum.ADMIN ||
    currentUserRole === OrgMemberRoleEnum.OWNER;
  const { data: invitations } = useGetInvitationsQuery(undefined, {
    skip: !canManage,
  });
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [inviteRole, setInviteRole] = useState<AssignableRole>(OrgMemberRoleEnum.MEMBER);

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    try {
      await inviteUser({ email, role: inviteRole }).unwrap();
      form.reset();
      setInviteRole(OrgMemberRoleEnum.MEMBER);
      toast.success(`Invitation sent to ${email}`);
    } catch (err: any) {
      const message =
        err?.data?.message || "Failed to send invitation. Please try again.";
      toast.error(message);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateMemberRole({
        userId,
        role: role as UpdateMemberRole["role"],
      }).unwrap();
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      await removeMember(userId).unwrap();
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRevoke = async (invitationId: number) => {
    try {
      await revokeInvitation(invitationId).unwrap();
      toast.success("Invitation revoked");
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h5 className="text-xl font-semibold">Members</h5>

      <div className="flex flex-col gap-3">
        {members?.map((member) => (
          <div
            key={member.user.id}
            className="flex items-center justify-between border-b border-black/10 py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-0.5">
              <span>{member.user.fullName}</span>
              <span className="text-sm text-muted-foreground">
                {member.user.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canManage && member.role !== OrgMemberRoleEnum.OWNER ? (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(val) =>
                      val && handleRoleChange(member.user.id, val)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrgMemberRoleEnum.ADMIN}>
                        Admin
                      </SelectItem>
                      <SelectItem value={OrgMemberRoleEnum.MEMBER}>
                        Member
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {member.user.id !== user?.id && (
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 hover:text-destructive"
                      onClick={() => handleRemove(member.user.id)}
                      aria-label="Remove member"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </>
              ) : (
                <Badge
                  variant={
                    member.role === OrgMemberRoleEnum.MEMBER
                      ? "secondary"
                      : "default"
                  }
                >
                  {member.role}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {canManage && invitations && invitations.length > 0 && (
        <>
          <div className="my-2 h-px bg-black/10" />
          <h5 className="text-xl font-semibold">Pending Invitations</h5>

          <div className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between border-b border-black/10 py-3 last:border-b-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span>{invitation.email}</span>
                  <span className="text-sm text-muted-foreground">
                    Invited{" "}
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {invitation.role === OrgMemberRoleEnum.ADMIN ? "Admin" : "Member"}
                  </Badge>
                  <Badge variant="outline">Pending</Badge>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 hover:text-destructive"
                    onClick={() => handleRevoke(invitation.id)}
                    aria-label="Revoke invitation"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {canManage && (
        <>
          <div className="my-2 h-px bg-black/10" />
          <h5 className="text-xl font-semibold">Invite Member</h5>

          <form onSubmit={handleInvite}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    className="min-w-0 flex-1"
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(val) => setInviteRole(val as AssignableRole)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrgMemberRoleEnum.MEMBER}>Member</SelectItem>
                      <SelectItem value={OrgMemberRoleEnum.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isInviting}
                className="w-fit"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
