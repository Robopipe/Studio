import { Footer, Logo } from "@/modules/ui";
import {
  Container,
  DesktopIcon,
  Heading,
  IconContainer,
  Stack,
  Text,
} from "@repo/ui";
import styles from "./ScreenTooNarrow.module.scss";

export const ScreenTooNarrow = () => {
  return (
    <main>
      <Container
        className={styles.screenTooNarrow}
        size="full"
        paddingY="xl"
        paddingX="sm"
      >
        <Stack
          direction="column"
          align="center"
          gap={32}
          className={styles.content}
        >
          <Logo />
          <IconContainer color="dark" className={styles.icon}>
            <DesktopIcon />
          </IconContainer>
          <Heading
            variant="h3"
            weight="500"
            color="text-white-primary"
            className={styles.title}
          >
            Unsupported <br /> screen size
          </Heading>
          <Stack direction="column" align="center" gap={16}>
            <Text
              variant="text-14"
              color="text-white-secondary"
              className={styles.message}
            >
              We're sorry, but this app isn't currently optimized for your
              device's screen size. For the best experience, please use a device
              with a screen width of at least 1024px.
            </Text>
            <Text
              variant="text-14"
              color="text-white-secondary"
              className={styles.message}
            >
              If you still wish to proceed, try switching your browser to
              desktop mode.
            </Text>
          </Stack>
          <Footer variant="light" />
        </Stack>
      </Container>
    </main>
  );
};
