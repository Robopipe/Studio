import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { ScreenAwareLayout } from "../ScreenAwareLayout";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  useGetProjectsQuery();

  return <ScreenAwareLayout>{children}</ScreenAwareLayout>;
};
