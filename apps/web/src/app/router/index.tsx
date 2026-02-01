import { appConfig } from "@/config";
import { webRoutes } from "@/config/web/routes";
import { LoginForm } from "@/core/auth/components";
import { Authenticated } from "@/core/auth/components/Authenticated/Authenticated";
import { RegisterForm } from "@/core/auth/components/RegisterForm/RegisterForm";
import { CapturePage } from "@/modules/capture/components/CapturePage";
import { LabelPage } from "@/modules/label/components/LabelPage";
import { AuthLayout } from "@/modules/layout";
import { ModelDetailPage, ModelNewPage } from "@/modules/model/components";
import { ProjectsPage } from "@/modules/project";
import { ProjectPage } from "@/modules/project/components/ProjectPage";
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
  ],
};

export const router = createBrowserRouter([publicRoutes, authenticatedRoutes]);
