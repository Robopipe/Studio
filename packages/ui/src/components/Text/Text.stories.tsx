import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "text-10",
        "text-12",
        "text-14",
        "text-16",
        "text-20",
        "code-10",
        "code-12",
        "code-14",
        "code-16",
        "number-10",
        "number-12",
        "number-14",
        "number-16",
      ],
      description: "Typography variant based on design system mixins",
    },
    weight: {
      control: "select",
      options: ["400", "500", "700"],
      description: "Font weight",
    },
    color: {
      control: "text",
      description: "Text color",
    },
    as: {
      control: "select",
      options: ["span", "p", "div", "label"],
      description: "HTML element to render",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog",
    variant: "text-16",
    weight: "400",
    color: "gray-400",
  },
};
