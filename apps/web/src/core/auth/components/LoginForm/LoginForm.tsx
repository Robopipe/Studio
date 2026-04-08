import { appConfig } from "@/config";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Login } from "@repo/schema";
import { FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks";
import { useLoginMutation } from "../../services";

export const LoginForm = () => {
  const [login, { isError, isLoading }] = useLoginMutation();
  const { isAuthenticated, isPreAuth } = useAuth();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password } as Login).unwrap();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isPreAuth) {
    return <Navigate to={appConfig.web.routes.auth.selectOrganization} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-[400px] flex-col">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="text-muted-foreground">Log in to the Robopipe app</p>
        </div>

        {isError && (
          <div className="mb-8 overflow-hidden rounded border border-red-200 bg-red-50">
            <div className="w-fit bg-red-600 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">
              ERROR
            </div>
            <div className="p-4 text-sm leading-snug text-red-900">
              The username or password you entered is incorrect. Please check
              your credentials and try again.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                aria-invalid={isError || undefined}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your email address
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                aria-invalid={isError || undefined}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your password
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full text-base font-semibold"
            >
              Log In
            </Button>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              Sign Up
            </Link>
          </p>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 mx-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        Powered by Robopipe | © All rights reserved
      </div>
    </div>
  );
};
