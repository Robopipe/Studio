import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesktopIcon } from "../../icons";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["filled", "outlined", "text"],
    },
    size: {
      control: "radio",
      options: ["xs", "sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
  },
};

export const WithIcon: Story = {
  args: {
    children: "Like",
    iconStart: <DesktopIcon />,
    variant: "filled",
    size: "md",
  },
};
