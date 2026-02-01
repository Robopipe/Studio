import { appConfig } from "@/config";
import { webRoutes } from "@/config/web/routes";
import { LoginForm } from "@/core/auth/components";
import { Authenticated } from "@/core/auth/components/Authenticated/Authenticated";
import { CapturePage } from "@/modules/capture/components/CapturePage";
import { AuthLayout } from "@/modules/layout";
import { ProjectsPage } from "@/modules/project";
import { ProjectPage } from "@/modules/project/components/ProjectPage";
import { TrainDetailPage, TrainNewPage } from "@/modules/train/components";
import { createBrowserRouter, RouteObject } from "react-router";

const { auth } = appConfig.web.routes;
const publicRoutes: RouteObject = {
  element: <AuthLayout />,
  children: [
    {
      path: auth.login,
      element: <LoginForm />,
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
      path: webRoutes.train.trainList,
      element: <Navigate to="new" replace />,
    },
    {
      path: webRoutes.train.trainNew,
      element: <TrainNewPage />,
    },
    {
      path: webRoutes.train.trainDetail,
      element: <TrainDetailPage />,
    },
  ],
};

export const router = createBrowserRouter([publicRoutes, authenticatedRoutes]);
