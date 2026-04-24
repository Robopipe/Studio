import { appConfig } from "@/config";
import { CameraStreamProvider } from "@/modules/camera-stream";
import { MainLayout } from "@/modules/layout";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Navigate, Outlet } from "react-router";
import { useAuth, useAuthInit } from "../../hooks";

export interface AuthenticatedProps {}

export const Authenticated = ({}: AuthenticatedProps) => {
  const { isAuthenticated, isPreAuth } = useAuth();
  useAuthInit();

  if (isAuthenticated === null) {
    return <Spinner />;
  }

  if (isAuthenticated === false) {
    return <Navigate to={appConfig.web.routes.auth.login} replace={true} />;
  }

  if (isPreAuth) {
    return <Navigate to={appConfig.web.routes.auth.selectOrganization} replace={true} />;
  }

  return (
    <CameraStreamProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </CameraStreamProvider>
  );
};
