import { useAuth } from "@/core/auth/hooks";
import { OrgMemberRoleEnum, UpdateMemberRole } from "@repo/schema";
import {
  Badge,
  Button,
  CloseIcon,
  Heading,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent } from "react";
import { toast } from "sonner";
import {
  useGetMembersQuery,
  useInviteUserMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "../../services";
import styles from "./MemberList.module.scss";

const roleItems = [
  { label: "Admin", value: OrgMemberRoleEnum.ADMIN },
  { label: "Member", value: OrgMemberRoleEnum.MEMBER },
];

export const MemberList = () => {
  const { user, role: currentUserRole } = useAuth();
  const { data: members, isLoading } = useGetMembersQuery();
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const canManage =
    currentUserRole === OrgMemberRoleEnum.ADMIN ||
    currentUserRole === OrgMemberRoleEnum.OWNER;

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    try {
      await inviteUser({ email }).unwrap();
      form.reset();
      toast.success(`Invitation sent to ${email}`);
    } catch (err: any) {
      const message =
        err?.data?.message || "Failed to send invitation. Please try again.";
      toast.error(message);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateMemberRole({ userId, role: role as UpdateMemberRole['role'] }).unwrap();
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

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Stack gap={24}>
      <Heading variant="h5" weight="600">
        Members
      </Heading>

      <Stack gap={12}>
        {members?.map((member) => (
          <div key={member.user.id} className={styles.memberRow}>
            <Stack gap={2}>
              <Text weight="600">{member.user.fullName}</Text>
              <Text variant="text-14" color="text-secondary">
                {member.user.email}
              </Text>
            </Stack>
            <div className={styles.memberActions}>
              {canManage && member.role !== OrgMemberRoleEnum.OWNER ? (
                <>
                  <div className={styles.roleSelect}>
                    <Select<string>
                      placeholder="Role"
                      items={roleItems}
                      value={member.role}
                      onValueChange={(val) =>
                        val && handleRoleChange(member.user.id, val)
                      }
                    />
                  </div>
                  {member.user.id !== user?.id && (
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemove(member.user.id)}
                      aria-label="Remove member"
                    >
                      <CloseIcon width={16} height={16} />
                    </button>
                  )}
                </>
              ) : (
                <Badge
                  variant={
                    member.role === OrgMemberRoleEnum.MEMBER ? "neutral" : "success"
                  }
                >
                  {member.role}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </Stack>

      {canManage && (
        <>
          <div className={styles.divider} />
          <Heading variant="h5" weight="600">
            Invite Member
          </Heading>

          <bui.Form onSubmit={handleInvite}>
            <Stack gap={16}>
              <TextInput
                label="Email"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
              <Button type="submit" disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </Stack>
          </bui.Form>
        </>
      )}
    </Stack>
  );
};
