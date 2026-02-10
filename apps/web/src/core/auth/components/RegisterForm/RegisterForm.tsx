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
import { FormEvent } from "react";
import { Link, Navigate, redirect } from "react-router";
import { useAuth } from "../../hooks";
import { useRegisterMutation } from "../../services";
import styles from "./RegisterForm.module.scss";

export const RegisterForm = () => {
  const [register, { isError, isLoading }] = useRegisterMutation();
  const { isAuthenticated } = useAuth();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    console.log("Form Data:", { email, password, fullName });
    try {
      await register({ email, password, fullName }).unwrap();
      redirect("/");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
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
