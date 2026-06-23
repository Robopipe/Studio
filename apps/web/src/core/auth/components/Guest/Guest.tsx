import { appConfig } from "@/config";
import { AuthLayout } from "@/modules/layout";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Navigate } from "react-router";
import { useAuth, useAuthInit } from "../../hooks";

export const Guest = () => {
  const { isAuthenticated, isPreAuth } = useAuth();
  useAuthInit();

  if (isAuthenticated === null) {
    return <Spinner />;
  }

  if (isAuthenticated && isPreAuth) {
    return <Navigate to={appConfig.web.routes.auth.selectOrganization} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  return <AuthLayout />;
};
