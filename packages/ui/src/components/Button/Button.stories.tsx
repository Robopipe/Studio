import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {},
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryLarge: Story = {
  args: {
    size: "large",
    children: "Primary Large Button",
  },
};
