import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Container } from "./Container";

const meta = {
  title: "Components/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "full"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    centered: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "md",
    padding: "md",
    centered: false,
    children: (
      <Stack direction="column" gap="md">
        <Text variant="text-20" weight="700">
          Container Component
        </Text>
        <Text variant="text-16" weight="400">
          This is an example of the Container component. It is used to wrap
          content and provide consistent horizontal padding and max-widths based
          on the design system.
        </Text>
      </Stack>
    ),
  },
};
