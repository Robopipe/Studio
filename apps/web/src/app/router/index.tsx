import { appConfig } from "@/config";
import { webRoutes } from "@/config/web/routes";
import { LoginForm } from "@/core/auth/components";
import { Authenticated } from "@/core/auth/components/Authenticated/Authenticated";
import { CapturePage } from "@/modules/capture/components/CapturePage";
import { AuthLayout } from "@/modules/layout";
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
    { path: "/", element: <div>Projects Page</div> },
    { path: webRoutes.capture, element: <CapturePage /> },
  ],
};

export const router = createBrowserRouter([publicRoutes, authenticatedRoutes]);
