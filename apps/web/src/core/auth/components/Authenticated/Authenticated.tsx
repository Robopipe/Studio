import { appConfig } from "@/config";
import { MainLayout } from "@/modules/layout";
import { Spinner } from "@repo/ui";
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
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
