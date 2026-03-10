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
import { useRegisterMutation } from "../../services";
import styles from "./RegisterForm.module.scss";

export const RegisterForm = () => {
  const [register, { isError, isLoading }] = useRegisterMutation();
  const { isAuthenticated, isPreAuth } = useAuth();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;
    try {
      await register({ email, fullName }).unwrap();
      setSuccess(true);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  if (isPreAuth) {
    return <Navigate to={appConfig.web.routes.auth.selectOrganization} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  if (success) {
    return (
      <Container className={styles.LoginPane}>
        <div className={styles.FormWidth}>
          <Stack align="center" gap={8} className={styles.Header}>
            <Heading variant="h2" weight="600">
              Check your email
            </Heading>
            <Text color="text-secondary">
              We've sent you an email with a link to set your password. Please
              check your inbox and follow the instructions to complete your
              registration.
            </Text>
          </Stack>
          <Stack align="center" gap={16} className={styles.FooterLinks}>
            <Link to="/login" className={styles.GreenLink}>
              Go to Login
            </Link>
          </Stack>
        </div>
        <div className={styles.Copyright}>
          Powered by Robopipe | © All rights reserved
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.LoginPane}>
      <div className={styles.FormWidth}>
        <Stack align="center" gap={8} className={styles.Header}>
          <Heading variant="h2" weight="600">
            Sign Up
          </Heading>
          <Text color="text-secondary">Sign up for the Robopipe app</Text>
        </Stack>

        {isError && (
          <div className={styles.ErrorBox}>
            <div className={styles.ErrorTag}>ERROR</div>
            <div className={styles.ErrorMessage}>
              Registration failed. Please check your details and try again.
            </div>
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
              error={isError}
              required
            />
            <TextInput
              label="Full Name"
              name="fullName"
              type="text"
              placeholder="Full Name"
              helperText="Enter your full name"
              error={isError}
              required
            />
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={styles.SubmitBtn}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </Button>
          </Stack>
        </bui.Form>

        <Stack align="center" gap={16} className={styles.FooterLinks}>
          <Text variant="text-14">
            Already have an account?{" "}
            <Link to="/login" className={styles.GreenLink}>
              Log In
            </Link>
          </Text>
          <Link to="/help" className={styles.GreenLink}>
            Need help?
          </Link>
        </Stack>
      </div>

      <div className={styles.Copyright}>
        Powered by Robopipe | © All rights reserved
      </div>
    </Container>
  );
};
