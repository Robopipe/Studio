import { appConfig } from "@/config";
import { Login } from "@repo/schema";
import { Button, Container, Heading, Stack, Text, bui } from "@repo/ui";
import { FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks";
import { useLoginMutation } from "../../services";

export interface LoginFormProps {}

export const LoginForm = ({}: LoginFormProps) => {
  const [login] = useLoginMutation();
  const { isAuthenticated } = useAuth();
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

  if (isAuthenticated) {
    return <Navigate to={appConfig.web.routes.main.projects} replace />;
  }

  return (
    <Container>
      <Stack>
        <Heading variant="h3" weight="500">
          Welcome back
        </Heading>
        <Text>Log in to the Robopipe app</Text>
        <bui.Form onSubmit={handleSubmit}>
          <bui.Field.Root>
            <bui.Field.Label>Email</bui.Field.Label>
            <bui.Input type="email" name="email" />
            <bui.Field.Error />
          </bui.Field.Root>
          <bui.Field.Root>
            <bui.Field.Label>Password</bui.Field.Label>
            <bui.Input type="password" name="password" />
            <bui.Field.Error />
          </bui.Field.Root>
          <Button type="submit">Log in</Button>
        </bui.Form>
        <Text>
          Don't have an account? <Link to="register">Sign Up</Link>
        </Text>
        <Link to="help">Need help?</Link>
      </Stack>
    </Container>
  );
};
