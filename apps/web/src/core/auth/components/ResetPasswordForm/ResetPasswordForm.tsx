import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { FormEvent, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useResetPasswordMutation } from "../../services";

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isWelcome = searchParams.get("welcome") === "1";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setSuccess(true);
    } catch {
      setError("Invalid or expired link. Please request a new one.");
    }
  };

  if (success) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
        <div className="flex w-full max-w-[400px] flex-col">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              {isWelcome ? "You're all set" : "Password reset"}
            </h2>
            <p className="text-muted-foreground">
              {isWelcome
                ? "Your password has been set. You can now log in to your account."
                : "Your password has been reset successfully. You can now log in with your new password."}
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Go to Login
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
            {isWelcome ? "Set your password" : "Set new password"}
          </h2>
          <p className="text-muted-foreground">
            {isWelcome
              ? "Choose a password for your Robopipe Studio account"
              : "Enter your new password below"}
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={isWelcome ? "Choose a password" : "New password"}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Re-enter your password
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full text-base font-semibold"
            >
              {isLoading ? "Saving..." : "Set Password"}
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
