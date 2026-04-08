import { appConfig } from "@/config";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks";
import { useForgotPasswordMutation } from "../../services";

export const ForgotPasswordForm = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  if (submitted) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
        <div className="flex w-full max-w-[400px] flex-col">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              Check your email
            </h2>
            <p className="text-muted-foreground">
              If an account with that email exists, we've sent a password reset
              link. Please check your inbox.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 mx-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          Powered by Robopipe | &copy; All rights reserved
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-[400px] flex-col">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
            Forgot password
          </h2>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && (
          <div className="mb-8 overflow-hidden rounded border border-red-200 bg-red-50">
            <div className="w-fit bg-red-600 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">
              ERROR
            </div>
            <div className="p-4 text-sm leading-snug text-red-900">{error}</div>
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
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your email address
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full text-base font-semibold"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 mx-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        Powered by Robopipe | &copy; All rights reserved
      </div>
    </div>
  );
};
