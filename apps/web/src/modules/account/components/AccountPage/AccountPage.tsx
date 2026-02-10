import { useAuth } from "@/core/auth/hooks";
import { Button, Container, Heading, Stack, TextInput } from "@repo/ui";
import styles from "./AccountPage.module.scss";
import { useState } from "react";
import { useUpdateProfileMutation } from "@/core/auth/services";

export interface AccountPageProps {}

export const AccountPage = ({}: AccountPageProps) => {
  const { user } = useAuth();
  const [cameraApiUrl, setCameraApiUrl] = useState(() => user?.cameraApiUrl || '');
  const [updateProfile, {isLoading}] = useUpdateProfileMutation();
  
   const handleSave = async () => {
    if (user) {
      try {
        await updateProfile({cameraApiUrl, fullName: user.fullName}).unwrap();
      } catch (error) {
        console.error("Failed to update profile:", error);
      }
    }
  }

  return (
    <Container size="sm">
      <Stack>
        <Heading variant="h5" weight="600">
          Account Info
        </Heading>
        <Stack direction="row" className={styles.inputRow}>
          <TextInput label="E-mail" value={user?.email} disabled />
          <TextInput label="Full Name" value={user?.fullName} disabled />
        </Stack>
      </Stack>
      <div className={styles.divider} />
      <Stack>
        <Heading variant="h5" weight="600">
          Robopipe Integration
        </Heading>
        <TextInput label="Robopipe API" value={cameraApiUrl} onChange={(e) => setCameraApiUrl(e.target.value)} />
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Container>
  );
};
