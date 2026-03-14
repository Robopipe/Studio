import { appConfig } from "@/config";
import { Login } from "@repo/schema";
import {
  Button,
  Container,
  Heading,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks";
import { useLoginMutation } from "../../services";
import styles from "./LoginForm.module.scss";

export const LoginForm = () => {
  const [login, { isError, isLoading }] = useLoginMutation();
  const { isAuthenticated, isPreAuth } = useAuth();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password } as Login).unwrap();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isPreAuth) {
    return <Navigate to={appConfig.web.routes.auth.selectOrganization} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  return (
    <Container className={styles.LoginPane}>
      <div className={styles.FormWidth}>
        <Stack align="center" gap={8} className={styles.Header}>
          <Heading variant="h2" weight="600">
            Welcome back
          </Heading>
          <Text color="text-secondary">Log in to the Robopipe app</Text>
        </Stack>

        {isError && (
          <div className={styles.ErrorBox}>
            <div className={styles.ErrorTag}>ERROR</div>
            <div className={styles.ErrorMessage}>
              The username or password you entered is incorrect. Please check
              your credentials and try again.
            </div>
          </div>
        )}

        <bui.Form onSubmit={handleSubmit}>
          <div className="size-10 bg-red-300"></div>
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
              label="Password"
              name="password"
              type="password"
              placeholder="Password"
              helperText="Enter your password"
              error={isError}
              required
            />
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={styles.SubmitBtn}
            >
              Log In
            </Button>
          </Stack>
        </bui.Form>

        <Stack align="center" gap={16} className={styles.FooterLinks}>
          <Text variant="text-14">
            Don't have an account?{" "}
            <Link to="/register" className={styles.GreenLink}>
              Sign Up
            </Link>
          </Text>
          <Link to="/forgot-password" className={styles.GreenLink}>
            Forgot password?
          </Link>
        </Stack>
      </div>

      <div className={styles.Copyright}>
        Powered by Robopipe | © All rights reserved
      </div>
    </Container>
  );
};
