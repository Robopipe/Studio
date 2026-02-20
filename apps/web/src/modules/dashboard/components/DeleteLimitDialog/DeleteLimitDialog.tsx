import { Button, Heading, Stack, Text } from "@repo/ui";

import styles from "./DeleteLimitDialog.module.scss";

interface DeleteLimitDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteLimitDialog = ({ onCancel, onConfirm }: DeleteLimitDialogProps) => {
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.dialog}>
        <Heading variant="h5" weight="700">
          Do you really want to delete this limit.
        </Heading>
        <Text variant="text-14" className={styles.description}>
          This action can not be undone. However you can setup a new limit with same parameters.
        </Text>
        <Stack direction="row" justify="end" gap={12}>
          <Button variant="outlined" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete this limit anyway
          </Button>
        </Stack>
      </div>
    </div>
  );
};
