import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { forgotPasswordSchema } from "@repo/schema";
import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { useForgotPasswordMutation } from "../../services";
import { fieldErrorsFromZod, mapAuthError, MappedAuthError } from "../../utils";
import { FormError } from "../FormError";

export const ForgotPasswordForm = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<MappedAuthError | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const values = { email: formData.get("email") as string };

    const parsed = forgotPasswordSchema.safeParse(values);
    if (!parsed.success) {
      const errors = fieldErrorsFromZod(parsed.error);
      setEmailError(errors.email);
      return;
    }

    setEmailError(undefined);
    try {
      await forgotPassword(parsed.data).unwrap();
      setSubmitted(true);
    } catch (error) {
      setFormError(mapAuthError(error, "forgotPassword"));
    }
  };

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
                aria-invalid={!!emailError || undefined}
                aria-describedby={emailError ? "email-error" : undefined}
                onChange={() => setEmailError(undefined)}
              />
              {emailError ? (
                <p id="email-error" className="text-xs text-destructive">
                  {emailError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter your email address
                </p>
              )}
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
