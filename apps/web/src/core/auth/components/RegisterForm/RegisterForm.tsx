import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { registerSchema } from "@repo/schema";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router";
import { useRegisterMutation, useResendVerificationMutation } from "../../services";
import { fieldErrorsFromZod, mapAuthError, MappedAuthError } from "../../utils";
import { FormError } from "../FormError";

type RegisterFieldErrors = Partial<Record<"email" | "fullName" | "password" | "confirmPassword", string>>;

export const RegisterForm = () => {
  const [register, { isLoading }] = useRegisterMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<MappedAuthError | null>(null);

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof RegisterFieldErrors;
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const errors: RegisterFieldErrors = {};

    const parsed = registerSchema.safeParse({ email, fullName, password });
    if (!parsed.success) {
      Object.assign(errors, fieldErrorsFromZod(parsed.error));
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    try {
      await register(parsed.data!).unwrap();
      setSuccessEmail(email);
      setSuccess(true);
    } catch (error) {
      setFormError(mapAuthError(error, "register"));
    }
  };

  const handleResend = async () => {
    if (!successEmail) return;
    try {
      await resendVerification({ email: successEmail }).unwrap();
    } catch {
      // server always returns 200 for this endpoint
    }
    setResendStatus("sent");
  };

  if (success) {
    return (
      <div className="flex h-full w-full flex-col overflow-y-auto">
        <div className="flex flex-1 items-center justify-center px-8 py-8">
          <div className="flex w-full max-w-100 flex-col">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
                Check your email
              </h2>
              <p className="text-muted-foreground">
                We've sent a verification link to{" "}
                <span className="font-medium text-gray-700">{successEmail}</span>.
                Click the link to verify your email address and activate your account.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              {resendStatus === "sent" ? (
                <p className="text-sm text-muted-foreground">
                  Verification email resent. Please check your inbox.
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </Button>
              )}
              <Link
                to="/login"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-16 mb-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          Powered by Robopipe | © All rights reserved
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <div className="flex flex-1 items-center justify-center px-8 py-8">
        <div className="flex w-full max-w-100 flex-col">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              Sign Up
            </h2>
            <p className="text-muted-foreground">Sign up for the Robopipe app</p>
          </div>

          {formError && (
            <FormError
              message={formError.message}
              action={
                formError.action ? (
                  <Link
                    to={formError.action.to}
                    className="font-semibold underline"
                  >
                    {formError.action.label}
                  </Link>
                ) : undefined
              }
            />
          )}

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
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  aria-invalid={!!fieldErrors.fullName || undefined}
                  aria-describedby={
                    fieldErrors.fullName ? "fullName-error" : undefined
                  }
                  onChange={handleFieldChange}
                />
                {fieldErrors.fullName ? (
                  <p id="fullName-error" className="text-xs text-destructive">
                    {fieldErrors.fullName}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter your full name
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
                    At least 8 characters
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  aria-invalid={!!fieldErrors.confirmPassword || undefined}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? "confirmPassword-error"
                      : undefined
                  }
                  onChange={handleFieldChange}
                />
                {fieldErrors.confirmPassword ? (
                  <p
                    id="confirmPassword-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Re-enter your password
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full text-base font-semibold"
              >
                {isLoading ? "Signing Up..." : "Sign Up"}
              </Button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Log In
              </Link>
            </p>
            <Link
              to="/help"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Need help?
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-16 mb-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        Powered by Robopipe | © All rights reserved
      </div>
    </div>
  );
};
