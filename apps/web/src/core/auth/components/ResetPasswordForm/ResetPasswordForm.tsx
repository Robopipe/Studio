import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { resetPasswordSchema } from "@repo/schema";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useResetPasswordMutation } from "../../services";
import { fieldErrorsFromZod, mapAuthError, MappedAuthError } from "../../utils";
import { FormError } from "../FormError";

type ResetFieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [formError, setFormError] = useState<MappedAuthError | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => navigate("/login", { replace: true }), 5000);
    return () => clearTimeout(id);
  }, [success, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof ResetFieldErrors;
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Collect all field errors before deciding whether to abort
    const errors: ResetFieldErrors = {};

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      const zodErrors = fieldErrorsFromZod(parsed.error);
      if (zodErrors.password) errors.password = zodErrors.password;
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
      await resetPassword({ token, password }).unwrap();
      setSuccess(true);
    } catch (error) {
      setFormError(mapAuthError(error, "resetPassword"));
    }
  };

  if (success) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
        <div className="flex w-full max-w-100 flex-col">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              Password reset
            </h2>
            <p className="text-muted-foreground">
              Your password has been reset successfully. Redirecting you to the
              login page in 5 seconds.
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
      <div className="flex w-full max-w-100 flex-col">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
            Set new password
          </h2>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {formError && <FormError message={formError.message} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="New password"
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
