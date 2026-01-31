import { appConfig } from "@/config";
import { LoginForm } from "@/core/auth/components";
import { Authenticated } from "@/core/auth/components/Authenticated/Authenticated";
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
  children: [{ path: "ahoj", element: <div>AHOJ</div> }],
};

export const router = createBrowserRouter([publicRoutes, authenticatedRoutes]);
