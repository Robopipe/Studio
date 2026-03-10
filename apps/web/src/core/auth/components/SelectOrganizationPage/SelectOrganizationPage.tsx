import { appConfig } from "@/config";
import {
  Button,
  Container,
  Heading,
  Spinner,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent, useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../hooks";
import {
  useAcceptInvitationMutation,
  useCreateOrganizationMutation,
  useDeclineInvitationMutation,
  useListInvitationsQuery,
  useListOrganizationsQuery,
  useSelectOrganizationMutation,
} from "../../services";
import styles from "./SelectOrganizationPage.module.scss";

export const SelectOrganizationPage = () => {
  const { isAuthenticated, isPreAuth } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useListOrganizationsQuery();
  const { data: invitations } = useListInvitationsQuery();
  const [selectOrg, { isLoading: selectingOrg }] = useSelectOrganizationMutation();
  const [createOrg, { isLoading: creatingOrg }] = useCreateOrganizationMutation();
  const [acceptInvite] = useAcceptInvitationMutation();
  const [declineInvite] = useDeclineInvitationMutation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated === false) {
    return <Navigate to={appConfig.web.routes.auth.login} replace />;
  }

  if (isAuthenticated && !isPreAuth) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  const handleSelectOrg = async (organizationId: number) => {
    try {
      setError(null);
      await selectOrg({ organizationId }).unwrap();
    } catch {
      setError("Failed to select organization. Please try again.");
    }
  };

  const handleCreateOrg = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("orgName") as string;
    if (!name?.trim()) return;

    try {
      setError(null);
      await createOrg({ name: name.trim() }).unwrap();
      setShowCreateForm(false);
    } catch {
      setError("Failed to create organization.");
    }
  };

  const handleAcceptInvite = async (id: number) => {
    try {
      setError(null);
      await acceptInvite(id).unwrap();
    } catch {
      setError("Failed to accept invitation.");
    }
  };

  const handleDeclineInvite = async (id: number) => {
    try {
      setError(null);
      await declineInvite(id).unwrap();
    } catch {
      setError("Failed to decline invitation.");
    }
  };

  if (orgsLoading) {
    return (
      <Container className={styles.page}>
        <Spinner />
      </Container>
    );
  }

  const hasOrgs = organizations && organizations.length > 0;
  const hasInvitations = invitations && invitations.length > 0;

  return (
    <Container className={styles.page}>
      <div className={styles.content}>
        <Stack align="center" gap={8} className={styles.header}>
          <Heading variant="h2" weight="600">
            Select Organization
          </Heading>
          <Text color="text-secondary">
            Choose an organization to continue, or create a new one
          </Text>
        </Stack>

        {error && (
          <div className={styles.errorBox}>
            <Text color="text-secondary">{error}</Text>
          </div>
        )}

        {hasInvitations && (
          <Stack gap={12} className={styles.section}>
            <Heading variant="h4" weight="600">
              Pending Invitations
            </Heading>
            {invitations.map((inv) => (
              <div key={inv.id} className={styles.listItem}>
                <Stack direction="row" justify="space-between" align="center" gap={12}>
                  <div>
                    <Text weight="500">{inv.organizationName}</Text>
                    <Text variant="text-12" color="text-secondary">
                      Invited to join
                    </Text>
                  </div>
                  <Stack direction="row" gap={8}>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(inv.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => handleDeclineInvite(inv.id)}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Stack>
              </div>
            ))}
          </Stack>
        )}

        {hasOrgs && (
          <Stack gap={12} className={styles.section}>
            <Heading variant="h4" weight="600">
              Your Organizations
            </Heading>
            {organizations.map((org) => (
              <button
                key={org.id}
                className={styles.orgButton}
                onClick={() => handleSelectOrg(org.id)}
                disabled={selectingOrg}
              >
                <Stack direction="row" justify="space-between" align="center">
                  <div>
                    <Text weight="500">{org.name}</Text>
                    <Text variant="text-12" color="text-secondary">
                      {org.role}
                    </Text>
                  </div>
                  <Text color="text-secondary">&rarr;</Text>
                </Stack>
              </button>
            ))}
          </Stack>
        )}

        {!showCreateForm ? (
          <Button
            variant={hasOrgs ? "outlined" : "filled"}
            fullWidth
            onClick={() => setShowCreateForm(true)}
            className={styles.createBtn}
          >
            Create New Organization
          </Button>
        ) : (
          <Stack gap={12} className={styles.section}>
            <Heading variant="h4" weight="600">
              Create Organization
            </Heading>
            <bui.Form onSubmit={handleCreateOrg}>
              <Stack gap={12}>
                <TextInput
                  label="Organization Name"
                  name="orgName"
                  placeholder="My Organization"
                  required
                />
                <Stack direction="row" gap={8}>
                  <Button type="submit" disabled={creatingOrg}>
                    {creatingOrg ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </bui.Form>
          </Stack>
        )}
      </div>

      <div className={styles.copyright}>
        Powered by Robopipe | &copy; All rights reserved
      </div>
    </Container>
  );
};
