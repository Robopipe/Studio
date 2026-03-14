import { useAuth } from "@/core/auth/hooks";
import { OrgMemberRoleEnum } from "@repo/schema";
import { Button, Container, Heading, Spinner, Stack, TextInput } from "@repo/ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
} from "../../services";
import { MemberList } from "../MemberList";
import styles from "./OrganizationSettingsPage.module.scss";

export const OrganizationSettingsPage = () => {
  const { role } = useAuth();
  const { data: organization, isLoading } = useGetOrganizationQuery();
  const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
  const [name, setName] = useState("");
  const canManage = role === OrgMemberRoleEnum.ADMIN || role === OrgMemberRoleEnum.OWNER;

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
      <Container size="sm">
        <Spinner />
      </Container>
    );
  }

  return (
    <Container size="sm">
      <Stack>
        <Heading variant="h5" weight="600">
          Organization
        </Heading>
        <Stack direction="row" align="end" gap={12} className={styles.nameRow}>
          <TextInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManage}
          />
          {canManage && (
            <Button
              onClick={handleSave}
              disabled={isUpdating || name.trim() === organization?.name}
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          )}
        </Stack>
      </Stack>
      <div className={styles.divider} />
      <MemberList />
    </Container>
  );
};
