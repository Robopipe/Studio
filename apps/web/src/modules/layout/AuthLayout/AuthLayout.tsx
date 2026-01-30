import { KoalaLogo, Logo } from "@/modules/ui";
import { Container, Heading, Stack, Text } from "@repo/ui";
import { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { ScreenAwareLayout } from "../ScreenAwareLayout";
import { AuthBackground } from "./AuthBackground";
import styles from "./AuthLayout.module.scss";

export interface AuthLayoutProps {
  children?: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const content = children ? children : <Outlet />;

  return (
    <ScreenAwareLayout>
      <Stack className={styles.authLayout} direction="row">
        <Container
          paddingX="xl"
          paddingY="xl"
          centered={false}
          className={styles.leftPanel}
          size="full"
        >
          <AuthBackground className={styles.background} />
          <Stack
            direction="column"
            justify="space-between"
            className={styles.leftPanelContent}
          >
            <Logo />
            <div>
              <Heading color="emerald-100" variant="h2" weight="500">
                Open-Source Solution for Industrial
              </Heading>
              <Heading color="emerald-400" variant="h2" weight="500">
                Machine Vision
              </Heading>
              <Stack
                direction="row"
                align="center"
                gap={12}
                className={styles.koalaLogo}
              >
                <Text color="emerald-100">by</Text>
                <Link
                  to="https://koala42.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.koalaLogoLink}
                >
                  <KoalaLogo />
                </Link>
              </Stack>
            </div>
          </Stack>
        </Container>
        <div className={styles.rightPanel}>{content}</div>
      </Stack>
    </ScreenAwareLayout>
  );
};
