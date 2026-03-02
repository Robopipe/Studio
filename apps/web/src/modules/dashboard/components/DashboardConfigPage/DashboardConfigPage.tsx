import { Button, Heading, Stack, Text } from "@repo/ui";
import { useState } from "react";
import {
  DashboardConfigurationItem,
  DashboardConfigurationItemPositionEnum,
} from "@repo/schema";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import {
  useDeleteDashboardConfigItemMutation,
  useGetDashboardConfigItemsQuery,
} from "../../services/dashboardConfigApi";
import { AddLimitModal } from "../AddLimitModal";
import { DeleteLimitDialog } from "../DeleteLimitDialog";

import styles from "./DashboardConfigPage.module.scss";

interface DashboardConfigPageProps {
  projectId: number;
  configId: number;
}

const isPositionType = (pos: string) =>
  !["COUNT", "AREA"].includes(pos);

const positionDisplayLabel = (position: string) => {
  const map: Record<string, string> = {
    POS_LEFT: "Position Left",
    POS_RIGHT: "Position Right",
    POS_TOP: "Position Top",
    POS_BOTTOM: "Position Bottom",
    POS_CENTER: "Position Center",
    AREA: "Area",
    COUNT: "Count",
  };
  return map[position] ?? position;
};

/** Tiny inline SVG showing the position box icon for position-type items */
const MiniPositionIcon = ({ position }: { position: DashboardConfigurationItemPositionEnum }) => {
  const { POS_LEFT, POS_RIGHT, POS_TOP, POS_BOTTOM } = DashboardConfigurationItemPositionEnum;

  // Inner rect position within a 16x16 viewBox (outer = full box)
  let ix = 4, iy = 4; // center default
  if (position === POS_LEFT) { ix = 1; iy = 4; }
  if (position === POS_RIGHT) { ix = 7; iy = 4; }
  if (position === POS_TOP) { ix = 4; iy = 1; }
  if (position === POS_BOTTOM) { ix = 4; iy = 7; }

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className={styles.miniIcon}>
      <rect x="0.5" y="0.5" width="15" height="15" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x={ix} y={iy} width="6" height="6" rx="0.5" fill="none" stroke="var(--color-emerald-600)" strokeWidth="1.5" />
    </svg>
  );
};

export const DashboardConfigPage = ({ projectId, configId }: DashboardConfigPageProps) => {
  const { data: items = [] } = useGetDashboardConfigItemsQuery({ projectId, configId });
  const { data: labels = [] } = useGetProjectLabelsQuery({ projectId });
  const [deleteItem] = useDeleteDashboardConfigItemMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DashboardConfigurationItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardConfigurationItem | null>(null);

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteItem({ projectId, configId, itemId: deletingItem.id }).unwrap();
    setDeletingItem(null);
  };

  return (
    <Stack fullWidth gap="md">
      <Stack fullWidth direction="row" justify="space-between" align="center">
        <Heading variant="h5" weight="600">
          Limit Items
        </Heading>
        <Button size="md" onClick={() => setIsAddModalOpen(true)}>
          + Add limit
        </Button>
      </Stack>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Label</th>
              <th>In</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>If Not</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.targetLabel.name}</td>
                <td>{item.targetParentLabel?.name ?? "IMAGE"}</td>
                <td className={styles.typeCell}>
                  {positionDisplayLabel(item.position)}
                  {isPositionType(item.position) && (
                    <MiniPositionIcon position={item.position as DashboardConfigurationItemPositionEnum} />
                  )}
                </td>
                <td>{item.limitFrom ?? "-"}</td>
                <td>{item.limitTo ?? "-"}</td>
                <td>{item.type === "CHECK" ? "Check" : "Defect"}</td>
                <td>{item.severity === "ALERT" ? "Alert" : "Warning"}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.editAction}
                    onClick={() => setEditingItem(item)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteAction}
                    onClick={() => setDeletingItem(item)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>
                  <Text>No limit items configured yet.</Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(isAddModalOpen || editingItem) && (
        <AddLimitModal
          projectId={projectId}
          configId={configId}
          labels={labels}
          item={editingItem ?? undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {deletingItem && (
        <DeleteLimitDialog
          onCancel={() => setDeletingItem(null)}
          onConfirm={handleDelete}
        />
      )}
    </Stack>
  );
};
