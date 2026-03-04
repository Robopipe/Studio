import {
  Button,
  Container,
  Heading,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useResetPasswordMutation } from "../../services";
import styles from "./ResetPasswordForm.module.scss";

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
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
      setError("Invalid or expired reset link. Please request a new one.");
    }
  };

  if (success) {
    return (
      <Container className={styles.LoginPane}>
        <div className={styles.FormWidth}>
          <Stack align="center" gap={8} className={styles.Header}>
            <Heading variant="h2" weight="600">
              Password reset
            </Heading>
            <Text color="text-secondary">
              Your password has been reset successfully. You can now log in with
              your new password.
            </Text>
          </Stack>
          <Stack align="center" gap={16} className={styles.FooterLinks}>
            <Link to="/login" className={styles.GreenLink}>
              Go to Login
            </Link>
          </Stack>
        </div>
        <div className={styles.Copyright}>
          Powered by Robopipe | &copy; All rights reserved
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.LoginPane}>
      <div className={styles.FormWidth}>
        <Stack align="center" gap={8} className={styles.Header}>
          <Heading variant="h2" weight="600">
            Set new password
          </Heading>
          <Text color="text-secondary">Enter your new password below</Text>
        </Stack>

        {error && (
          <div className={styles.ErrorBox}>
            <div className={styles.ErrorTag}>ERROR</div>
            <div className={styles.ErrorMessage}>{error}</div>
          </div>
        )}

        <bui.Form onSubmit={handleSubmit}>
          <Stack gap={20}>
            <TextInput
              label="New Password"
              name="password"
              type="password"
              placeholder="New password"
              helperText="At least 8 characters"
              required
            />
            <TextInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              helperText="Re-enter your new password"
              required
            />
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={styles.SubmitBtn}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </Stack>
        </bui.Form>

        <Stack align="center" gap={16} className={styles.FooterLinks}>
          <Link to="/login" className={styles.GreenLink}>
            Back to Login
          </Link>
        </Stack>
      </div>
      <div className={styles.Copyright}>
        Powered by Robopipe | &copy; All rights reserved
      </div>
    </Container>
  );
};
