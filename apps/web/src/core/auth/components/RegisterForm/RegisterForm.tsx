import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { registerSchema } from "@repo/schema";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router";
import { useRegisterMutation } from "../../services";
import { fieldErrorsFromZod, mapAuthError, MappedAuthError } from "../../utils";
import { FormError } from "../FormError";

type RegisterFieldErrors = Partial<Record<"email" | "fullName", string>>;

export const RegisterForm = () => {
  const [register, { isLoading }] = useRegisterMutation();
  const [success, setSuccess] = useState(false);
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
    const values = {
      email: formData.get("email") as string,
      fullName: formData.get("fullName") as string,
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error) as RegisterFieldErrors);
      return;
    }

    setFieldErrors({});
    try {
      await register(parsed.data).unwrap();
      setSuccess(true);
    } catch (error) {
      setFormError(mapAuthError(error, "register"));
    }
  };

  if (success) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
        <div className="flex w-full max-w-[400px] flex-col">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              Check your email
            </h2>
            <p className="text-muted-foreground">
              We've sent you an email with a link to set your password. Please
              check your inbox and follow the instructions to complete your
              registration.
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
          Powered by Robopipe | © All rights reserved
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-[400px] flex-col">
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

      <div className="absolute bottom-8 left-0 right-0 mx-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        Powered by Robopipe | © All rights reserved
      </div>
    </div>
  );
};
