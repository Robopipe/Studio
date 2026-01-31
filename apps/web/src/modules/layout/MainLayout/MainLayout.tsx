import { ScreenAwareLayout } from "../ScreenAwareLayout";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return <ScreenAwareLayout>{children}</ScreenAwareLayout>;
};
