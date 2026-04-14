import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { ScreenAwareLayout } from "../ScreenAwareLayout";
import { Navbar } from "./Navbar";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  useGetProjectsQuery();

  return (
    <ScreenAwareLayout>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
        <Navbar />
        <main className="flex flex-1 flex-col overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </ScreenAwareLayout>
  );
};
