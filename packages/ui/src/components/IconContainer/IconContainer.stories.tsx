import { Meta, StoryObj } from "@storybook/react-vite";
import { CameraIcon } from "../../icons";
import { IconContainer } from "./IconContainer";

const meta: Meta<typeof IconContainer> = {
  title: "Components/IconContainer",
  component: IconContainer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: ["neutral", "success", "dark", "danger"],
      description: "Color theme of the IconContainer",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <CameraIcon />,
  },
};
