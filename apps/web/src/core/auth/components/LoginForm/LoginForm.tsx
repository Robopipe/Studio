import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { loginSchema } from "@repo/schema";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router";
import { useLoginMutation, useResendVerificationMutation } from "../../services";
import { fieldErrorsFromZod, isFetchBaseQueryError, mapAuthError, MappedAuthError } from "../../utils";
import { FormError } from "../FormError";

type LoginFieldErrors = Partial<Record<"email" | "password", string>>;

export const LoginForm = () => {
  const [login, { isLoading }] = useLoginMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<MappedAuthError | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof LoginFieldErrors;
    if (name === "email") {
      setUnverifiedEmail(null);
      setResendStatus("idle");
    }
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setUnverifiedEmail(null);
    setResendStatus("idle");
    const formData = new FormData(e.currentTarget);
    const values = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error) as LoginFieldErrors);
      return;
    }

    setFieldErrors({});
    try {
      await login(parsed.data).unwrap();
    } catch (error) {
      if (isFetchBaseQueryError(error) && error.status === 403) {
        setUnverifiedEmail(values.email);
      } else {
        setFormError(mapAuthError(error, "login"));
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    try {
      await resendVerification({ email: unverifiedEmail }).unwrap();
    } catch {
      // server always returns 200 for this endpoint
    }
    setResendStatus("sent");
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-100 flex-col">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="text-muted-foreground">Log in to the Robopipe app</p>
        </div>

        {unverifiedEmail && resendStatus === "sent" && (
          <div
            role="status"
            className="mb-8 rounded border border-sky-200 bg-sky-50 p-4 text-sm leading-snug text-sky-800"
          >
            Verification email sent. Please check your inbox.
          </div>
        )}
        {unverifiedEmail && resendStatus === "idle" && (
          <FormError
            message="Please verify your email before logging in."
            action={
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="cursor-pointer font-semibold underline"
              >
                {isResending ? "Sending..." : "Resend verification email"}
              </button>
            }
          />
        )}
        {formError && <FormError message={formError.message} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                aria-invalid={!!fieldErrors.email || undefined}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                onChange={handleFieldChange}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter your email address
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                aria-invalid={!!fieldErrors.password || undefined}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                onChange={handleFieldChange}
              />
              {fieldErrors.password ? (
                <p id="password-error" className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter your password
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full text-base font-semibold"
            >
              {isLoading ? "Logging In..." : "Log In"}
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
