import { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Components/Heading",
  component: Heading,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["h1", "h2", "h3", "h4", "h5"],
      description: "HTML heading level",
    },
    weight: {
      control: "select",
      options: [500, 600, 700],
      description: "Font weight of the heading",
    },
    children: {
      control: "text",
      description: "Heading text content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "h2",
    weight: 700,
    children: "This is a Heading",
  },
};
