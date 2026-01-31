import { Tabs as BaseTabs } from "@base-ui/react";
import clsx from "clsx";
import styles from "./Tabs.module.scss";

export interface TabsProps {
  tabs: {
    label: string;
    render: () => React.ReactNode;
  }[];
  defaultValue: string;
  className?: string;
}

export const Tabs = ({ tabs, defaultValue, className }: TabsProps) => {
  return (
    <BaseTabs.Root
      className={clsx(styles.Tabs, className)}
      defaultValue={defaultValue}
    >
      <BaseTabs.List className={styles.List}>
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.label}
            className={styles.Tab}
            value={tab.label}
          >
            {tab.label}
          </BaseTabs.Tab>
        ))}

        <BaseTabs.Indicator className={styles.Indicator} />
      </BaseTabs.List>
      {tabs.map((tab) => (
        <BaseTabs.Panel
          key={tab.label}
          className={styles.Panel}
          value={tab.label}
        >
          {tab.render()}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
};
