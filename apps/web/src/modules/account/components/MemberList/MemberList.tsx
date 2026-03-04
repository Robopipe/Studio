import { useAuth } from "@/core/auth/hooks";
import { UserRoleEnum } from "@repo/schema";
import {
  Badge,
  Button,
  Heading,
  Spinner,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent, useState } from "react";
import { useGetMembersQuery, useInviteUserMutation } from "../../services";
import styles from "./MemberList.module.scss";

export const MemberList = () => {
  const { user } = useAuth();
  const { data: members, isLoading } = useGetMembersQuery();
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const isAdmin = user?.role === UserRoleEnum.ADMIN;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;

    try {
      await inviteUser({ email, fullName }).unwrap();
      setSuccess(`Invitation sent to ${email}`);
      e.currentTarget.reset();
    } catch (err: any) {
      const message =
        err?.data?.message || "Failed to send invitation. Please try again.";
      setError(message);
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
            <Badge
              variant={
                member.role === UserRoleEnum.ADMIN ? "success" : "neutral"
              }
            >
              {member.role}
            </Badge>
          </div>
        ))}
      </Stack>

      {isAdmin && (
        <>
          <div className={styles.divider} />
          <Heading variant="h5" weight="600">
            Invite Member
          </Heading>

          {error && (
            <Text variant="text-14" color="error">
              {error}
            </Text>
          )}
          {success && (
            <Text variant="text-14" color="success">
              {success}
            </Text>
          )}

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
