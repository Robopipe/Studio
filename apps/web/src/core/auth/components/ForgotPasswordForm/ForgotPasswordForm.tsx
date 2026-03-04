import { appConfig } from "@/config";
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
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks";
import { useForgotPasswordMutation } from "../../services";
import styles from "./ForgotPasswordForm.module.scss";

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
      <Container className={styles.LoginPane}>
        <div className={styles.FormWidth}>
          <Stack align="center" gap={8} className={styles.Header}>
            <Heading variant="h2" weight="600">
              Check your email
            </Heading>
            <Text color="text-secondary">
              If an account with that email exists, we've sent a password reset
              link. Please check your inbox.
            </Text>
          </Stack>
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
  }

  return (
    <Container className={styles.LoginPane}>
      <div className={styles.FormWidth}>
        <Stack align="center" gap={8} className={styles.Header}>
          <Heading variant="h2" weight="600">
            Forgot password
          </Heading>
          <Text color="text-secondary">
            Enter your email and we'll send you a reset link
          </Text>
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
              label="Email"
              name="email"
              type="email"
              placeholder="Email"
              helperText="Enter your email address"
              required
            />
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={styles.SubmitBtn}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
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
