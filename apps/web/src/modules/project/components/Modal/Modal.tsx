import { Heading, Stack } from "@repo/ui";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import styles from "./Modal.module.scss";

export interface ModalTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface ModalProps {
  title: string;
  tabs: ModalTab[];
  buttons?: ReactNode;
  closeButton: boolean;
  onClose: () => void;
}

export const Modal = ({ title, tabs, buttons, closeButton, onClose }: ModalProps) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <Heading variant="h4" weight="700">
            {title}
          </Heading>

          <Stack direction="row" align="center" gap={24} className={styles.tabWrapper}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={clsx(styles.tabItem, activeTabId === tab.id && styles.active)}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </Stack>

          <Stack direction="row" gap={12} align="center">
            {buttons}
            {closeButton && <button className={styles.closeIconButton} onClick={onClose}>×</button>}
          </Stack>
        </header>

        <div className={styles.modalBody}>
          {activeTab?.content}
        </div>
      </div>
    </div>
  );
};