import { useState } from "react";
import { Stack, Text, Heading } from "@repo/ui";
import styles from "./CreateProjectModal.module.scss";
import clsx from "clsx";

type Tab = "details" | "labeling";

export const CreateProjectModal = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<Tab>("details");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Header Section */}
        <header className={styles.modalHeader}>
          <Heading variant="h4" weight="700">Create Project</Heading>
          
          <Stack direction="row" align="center" gap={24} className={styles.tabWrapper}>
            <button 
              className={clsx(styles.tabItem, activeTab === "details" && styles.active)}
              onClick={() => setActiveTab("details")}
            >
              Projects Details
            </button>
            <button 
              className={clsx(styles.tabItem, activeTab === "labeling" && styles.active)}
              onClick={() => setActiveTab("labeling")}
            >
              Labeling Setup
            </button>
          </Stack>

          <Stack direction="row" gap={12}>
            <button className={styles.deleteBtn}>Delete</button>
            <button className={styles.saveBtn}>Save</button>
          </Stack>
        </header>

        {/* Body Section */}
        <div className={styles.modalBody}>
          {activeTab === "details" ? (
            <div className={styles.formSection}>
              <Heading variant="h5" weight="600">Projects Details</Heading>
              
              <div className={styles.inputGroup}>
                <label>Project name</label>
                <input placeholder="Project name" />
              </div>

              <div className={styles.inputGroup}>
                <label>Project description</label>
                <textarea placeholder="Project description" rows={5} />
              </div>
            </div>
          ) : (
            <div>{/* Labeling Setup Content */}</div>
          )}
        </div>
      </div>
    </div>
  );
};