import { Stack, Text } from "@repo/ui";
import styles from "./Footer.module.scss";

export interface FooterProps {
  variant: "light" | "dark";
}

export const Footer = ({ variant }: FooterProps) => {
  const textColor =
    variant === "light" ? "text-secondary" : "text-white-secondary";

  return (
    <Stack
      as="footer"
      direction="row"
      justify="center"
      gap={12}
      className={styles.footer}
    >
      <Text color={textColor} variant="text-12">
        Powered by Robopipe
      </Text>
      <Text color={textColor} variant="text-12">
        |
      </Text>
      <Text color={textColor} variant="text-12">
        © All rights reserved
      </Text>
    </Stack>
  );
};
