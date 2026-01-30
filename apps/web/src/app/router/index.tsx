import { appConfig } from "@/config";
import { AuthLayout, MainLayout } from "@/modules/layout";
import { createBrowserRouter, RouteObject } from "react-router";

const { auth } = appConfig.web.routes;

const publicRoutes: RouteObject = {
  element: <AuthLayout />,
  children: [
    {
      path: auth.login,
    },
  ],
};
const authenticatedRoutes: RouteObject = {
  element: <MainLayout />,
  children: [{ path: "" }],
};

export const router = createBrowserRouter([publicRoutes, authenticatedRoutes]);
