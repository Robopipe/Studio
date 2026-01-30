import { Button, Container, Heading, Stack, Text } from "@repo/ui";
import { Link } from "react-router";

export interface LoginFormProps {}

export const LoginForm = ({}: LoginFormProps) => {
  return (
    <Container>
      <Stack>
        <Heading variant="h3" weight="500">
          Welcome back
        </Heading>
        <Text>Log in to the Robopipe app</Text>
        <input type="text" />
        <input type="text" />
        <Button>Log in</Button>
        <Text>
          Don't have an account? <Link to="register">Sign Up</Link>
        </Text>
        <Link to="help">Need help?</Link>
      </Stack>
    </Container>
  );
};
