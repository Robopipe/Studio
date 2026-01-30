import type { Meta, StoryObj } from "@storybook/react-vite";
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
      options: ["sm", "md", "lg"],
    },
    color: {
      control: "radio",
      options: ["primary", "gray"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    fullWidth: {
      control: "boolean",
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
    color: "primary",
  },
};

export const Outlined: Story = {
  args: {
    children: "Action",
    variant: "outlined",
    size: "md",
    color: "primary",
  },
};

export const Text: Story = {
  args: {
    children: "Action",
    variant: "text",
    size: "md",
    color: "primary",
  },
};

export const Small: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "sm",
    color: "primary",
  },
};

export const Large: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "lg",
    color: "primary",
  },
};

export const Disabled: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "primary",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: "Loading",
    variant: "filled",
    size: "md",
    color: "primary",
    loading: true,
  },
};

export const WithStartIcon: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "primary",
    startIcon: "✓",
  },
};

export const WithEndIcon: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "primary",
    endIcon: "→",
  },
};

export const WithBothIcons: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "primary",
    startIcon: "✓",
    endIcon: "→",
  },
};

export const FullWidth: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "primary",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
};

export const GrayPrimary: Story = {
  args: {
    children: "Action",
    variant: "filled",
    size: "md",
    color: "gray",
  },
};

export const GrayOutlined: Story = {
  args: {
    children: "Action",
    variant: "outlined",
    size: "md",
    color: "gray",
  },
};

export const GrayText: Story = {
  args: {
    children: "Action",
    variant: "text",
    size: "md",
    color: "gray",
  },
};
