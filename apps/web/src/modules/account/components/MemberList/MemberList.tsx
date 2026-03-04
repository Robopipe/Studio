import { useAuth } from "@/core/auth/hooks";
import { UserRoleEnum } from "@repo/schema";
import {
  Badge,
  Button,
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
  { label: "Admin", value: UserRoleEnum.ADMIN },
  { label: "Member", value: UserRoleEnum.MEMBER },
];

export const MemberList = () => {
  const { user } = useAuth();
  const { data: members, isLoading } = useGetMembersQuery();
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const isAdmin = user?.role === UserRoleEnum.ADMIN;

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;

    try {
      await inviteUser({ email, fullName }).unwrap();
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
      await updateMemberRole({ userId, role: role as UserRoleEnum }).unwrap();
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
          <div key={member.id} className={styles.memberRow}>
            <Stack gap={2}>
              <Text weight="600">{member.fullName}</Text>
              <Text variant="text-14" color="text-secondary">
                {member.email}
              </Text>
            </Stack>
            <div className={styles.memberActions}>
              {isAdmin ? (
                <>
                  <Select<string>
                    placeholder="Role"
                    items={roleItems}
                    value={member.role}
                    onValueChange={(val) => val && handleRoleChange(member.id, val)}
                  />
                  {member.id !== user?.id && (
                    <Button
                      variant="danger"
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </Button>
                  )}
                </>
              ) : (
                <Badge
                  variant={
                    member.role === UserRoleEnum.ADMIN ? "success" : "neutral"
                  }
                >
                  {member.role}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </Stack>

      {isAdmin && (
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
              <TextInput
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="John Doe"
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
