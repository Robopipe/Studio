import { Spinner } from "@/modules/shadcn/ui/spinner";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useVerifyEmailMutation } from "../../services";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [verifyEmail] = useVerifyEmailMutation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    verifyEmail({ token })
      .unwrap()
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const id = setTimeout(() => navigate("/login", { replace: true }), 5000);
    return () => clearTimeout(id);
  }, [status, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-100 flex-col">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="size-8" />
            <p className="text-muted-foreground">Verifying your email…</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
                Email verified
              </h2>
              <p className="text-muted-foreground">
                Your email has been verified. Redirecting you to the login page
                in 5 seconds.
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
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
                Link expired
              </h2>
              <p className="text-muted-foreground">
                This verification link is invalid or has expired. Go back to
                login and use the resend option to get a new link.
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
          </>
        )}
      </div>
      <div className="absolute bottom-8 left-0 right-0 mx-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        Powered by Robopipe | © All rights reserved
      </div>
    </div>
  );
};
