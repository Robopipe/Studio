import { appConfig } from "@/config";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Spinner } from "@/modules/shadcn/ui/spinner";
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
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const hasOrgs = organizations && organizations.length > 0;
  const hasInvitations = invitations && invitations.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex w-full max-w-[480px] flex-col gap-6">
        <div className="mb-2 flex flex-col items-center gap-2 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
            Select Organization
          </h2>
          <p className="text-muted-foreground">
            Choose an organization to continue, or create a new one
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {hasInvitations && (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h4 className="text-2xl font-semibold tracking-tight">
              Pending Invitations
            </h4>
            {invitations.map((inv) => (
              <div key={inv.id} className="rounded-md bg-gray-50 p-3">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{inv.organizationName}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited to join
                    </p>
                  </div>
                  <div className="flex flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(inv.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineInvite(inv.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasOrgs && (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h4 className="text-2xl font-semibold tracking-tight">
              Your Organizations
            </h4>
            {organizations.map((org) => (
              <button
                key={org.id}
                className="w-full cursor-pointer rounded-md bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleSelectOrg(org.id)}
                disabled={selectingOrg}
              >
                <div className="flex flex-row items-center justify-between">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!showCreateForm ? (
          <Button
            variant={hasOrgs ? "outline" : "default"}
            onClick={() => setShowCreateForm(true)}
            className="mt-2 w-full"
          >
            Create New Organization
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h4 className="text-2xl font-semibold tracking-tight">
              Create Organization
            </h4>
            <form onSubmit={handleCreateOrg}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    placeholder="My Organization"
                    required
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button type="submit" disabled={creatingOrg}>
                    {creatingOrg ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        Powered by Robopipe | &copy; All rights reserved
      </div>
    </div>
  );
};
