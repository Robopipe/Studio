import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { ScreenAwareLayout } from "../ScreenAwareLayout";
import styles from "./MainLayout.module.scss";
import { Navbar } from "./Navbar";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  useGetProjectsQuery();

  return (
    <ScreenAwareLayout>
      <div className={styles.wrapper}>
        <Navbar />
        <main className={styles.content}>{children}</main>
      </div>
    </ScreenAwareLayout>
  );
};
