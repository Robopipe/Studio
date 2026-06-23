import { appConfig } from "@/config";
import { webRoutes } from "@/config/web/routes";
import {
  ForgotPasswordForm,
  LoginForm,
  ResetPasswordForm,
  SelectOrganizationPage,
} from "@/core/auth/components";
import { Authenticated } from "@/core/auth/components/Authenticated/Authenticated";
import { RegisterForm } from "@/core/auth/components/RegisterForm/RegisterForm";
import { AccountPage, OrganizationSettingsPage } from "@/modules/account/components";
import { CapturePage } from "@/modules/capture/components/CapturePage";
import { LabelPage } from "@/modules/label/components/LabelPage";
import { AuthLayout } from "@/modules/layout";
import { ModelDetailPage, ModelNewPage } from "@/modules/model/components";
import { ProjectsPage } from "@/modules/project";
import { ProjectPage } from "@/modules/project/components/ProjectPage";
import { RunPage } from "@/modules/run";
import { E2EEditorPage } from "@/modules/evaluation/graph/workspace/E2EEditorPage";
import { createBrowserRouter, Navigate, RouteObject } from "react-router";

const { auth } = appConfig.web.routes;
const publicRoutes: RouteObject = {
  element: <AuthLayout />,
  children: [
    {
      path: auth.login,
      element: <LoginForm />,
    },
    {
      path: auth.register,
      element: <RegisterForm />,
    },
    {
      path: auth.forgotPassword,
      element: <ForgotPasswordForm />,
    },
    {
      path: auth.resetPassword,
      element: <ResetPasswordForm />,
    },
    {
      path: auth.selectOrganization,
      element: <SelectOrganizationPage />,
    },
  ],
};
const authenticatedRoutes: RouteObject = {
  element: <Authenticated />,
  children: [
    { path: webRoutes.main.projects, element: <ProjectsPage /> },
    { path: webRoutes.main.project, element: <ProjectPage /> },
    { path: webRoutes.capture, element: <CapturePage /> },
    {
      path: webRoutes.model.modelList,
      element: <Navigate to="new" replace />,
    },
    {
      path: webRoutes.model.modelNew,
      element: <ModelNewPage />,
    },
    {
      path: webRoutes.model.modelDetail,
      element: <ModelDetailPage />,
    },
    { path: webRoutes.label, element: <LabelPage /> },
    { path: webRoutes.run, element: <RunPage /> },
    { path: webRoutes.account, element: <AccountPage /> },
    { path: webRoutes.main.organization, element: <OrganizationSettingsPage /> },
  ],
};

// In E2E mode the whole app is replaced by the standalone editor host, so the
// Playwright specs can reach the editor at any path without auth or backend data.
export const router = import.meta.env.VITE_E2E
  ? createBrowserRouter([{ path: "*", element: <E2EEditorPage /> }])
  : createBrowserRouter([publicRoutes, authenticatedRoutes]);
