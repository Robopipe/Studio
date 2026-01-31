import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Text } from "../Text";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Stack",
  component: Stack,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    direction: {
      control: "select",
      options: ["row", "column", "row-reverse", "column-reverse"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
    },
    justify: {
      control: "select",
      options: [
        "start",
        "center",
        "end",
        "space-between",
        "space-around",
        "space-evenly",
      ],
    },
    gap: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    wrap: {
      control: "select",
      options: ["wrap", "nowrap", "wrap-reverse"],
    },
    fullWidth: {
      control: "boolean",
    },
    fullHeight: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for demo boxes
const Box = ({
  children,
  color = "#e0e0e0",
  style,
}: {
  children?: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      padding: "1rem",
      backgroundColor: color,
      borderRadius: "8px",
      minWidth: "80px",
      textAlign: "center",
      ...style,
    }}
  >
    {children || "Item"}
  </div>
);

export const Default: Story = {
  args: {
    gap: "md",
    direction: "column",
  },
  render: (args) => (
    <Stack {...args}>
      <Box color="#ffebee">Item 1</Box>
      <Box color="#e3f2fd">Item 2</Box>
      <Box color="#e8f5e9">Item 3</Box>
    </Stack>
  ),
};

export const Row: Story = {
  args: {
    direction: "row",
    gap: "md",
  },
  render: (args) => (
    <Stack {...args}>
      <Box color="#ffebee">Item 1</Box>
      <Box color="#e3f2fd">Item 2</Box>
      <Box color="#e8f5e9">Item 3</Box>
    </Stack>
  ),
};

export const WithAlignment: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Align: start
        </Text>
        <Stack
          direction="row"
          gap="md"
          align="start"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">Small</Box>
          <Box color="#e3f2fd" style={{ height: "80px" }}>
            Tall
          </Box>
          <Box color="#e8f5e9">Small</Box>
        </Stack>
      </div>

      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Align: center
        </Text>
        <Stack
          direction="row"
          gap="md"
          align="center"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">Small</Box>
          <Box color="#e3f2fd" style={{ height: "80px" }}>
            Tall
          </Box>
          <Box color="#e8f5e9">Small</Box>
        </Stack>
      </div>

      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Align: end
        </Text>
        <Stack
          direction="row"
          gap="md"
          align="end"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">Small</Box>
          <Box color="#e3f2fd" style={{ height: "80px" }}>
            Tall
          </Box>
          <Box color="#e8f5e9">Small</Box>
        </Stack>
      </div>
    </div>
  ),
};

export const WithJustification: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Justify: start
        </Text>
        <Stack
          direction="row"
          gap="md"
          justify="start"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">1</Box>
          <Box color="#e3f2fd">2</Box>
          <Box color="#e8f5e9">3</Box>
        </Stack>
      </div>

      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Justify: center
        </Text>
        <Stack
          direction="row"
          gap="md"
          justify="center"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">1</Box>
          <Box color="#e3f2fd">2</Box>
          <Box color="#e8f5e9">3</Box>
        </Stack>
      </div>

      <div>
        <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
          Justify: space-between
        </Text>
        <Stack
          direction="row"
          gap="md"
          justify="space-between"
          style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
        >
          <Box color="#ffebee">1</Box>
          <Box color="#e3f2fd">2</Box>
          <Box color="#e8f5e9">3</Box>
        </Stack>
      </div>
    </div>
  ),
};

export const GapVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((gapSize) => (
        <div key={gapSize}>
          <Text style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
            Gap: {gapSize}
          </Text>
          <Stack
            direction="row"
            gap={gapSize}
            style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}
          >
            <Box color="#ffebee">1</Box>
            <Box color="#e3f2fd">2</Box>
            <Box color="#e8f5e9">3</Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const CustomGap: Story = {
  args: {
    direction: "row",
    gap: "32px",
  },
  render: (args) => (
    <Stack {...args}>
      <Box color="#ffebee">Item 1</Box>
      <Box color="#e3f2fd">Item 2</Box>
      <Box color="#e8f5e9">Item 3</Box>
    </Stack>
  ),
};

export const WithWrap: Story = {
  args: {
    direction: "row",
    gap: "md",
    wrap: "wrap",
  },
  render: (args) => (
    <Stack
      {...args}
      style={{ maxWidth: "400px", backgroundColor: "#f5f5f5", padding: "1rem" }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={i}
          color={i % 3 === 0 ? "#ffebee" : i % 3 === 1 ? "#e3f2fd" : "#e8f5e9"}
        >
          Item {i + 1}
        </Box>
      ))}
    </Stack>
  ),
};

export const FullWidth: Story = {
  args: {
    direction: "column",
    gap: "md",
    fullWidth: true,
  },
  render: (args) => (
    <Stack {...args} style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}>
      <Box color="#ffebee">Full Width Item 1</Box>
      <Box color="#e3f2fd">Full Width Item 2</Box>
      <Box color="#e8f5e9">Full Width Item 3</Box>
    </Stack>
  ),
};

export const WithButtons: Story = {
  render: () => (
    <Stack direction="row" gap="md" align="center">
      <Button variant="filled">Primary</Button>
      <Button variant="outlined">Secondary</Button>
      <Button variant="text">Tertiary</Button>
    </Stack>
  ),
};

export const FormLayout: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: "400px" }}>
      <Stack gap="xs">
        <Text style={{ fontWeight: "bold" }}>Name</Text>
        <input
          type="text"
          placeholder="Enter your name"
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </Stack>

      <Stack gap="xs">
        <Text style={{ fontWeight: "bold" }}>Email</Text>
        <input
          type="email"
          placeholder="Enter your email"
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </Stack>

      <Stack direction="row" gap="md" justify="end">
        <Button variant="outlined">Cancel</Button>
        <Button variant="filled">Submit</Button>
      </Stack>
    </Stack>
  ),
};

export const NestedStacks: Story = {
  render: () => (
    <Stack gap="lg" style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}>
      <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Dashboard</Text>

      <Stack direction="row" gap="md" wrap="wrap">
        <Box color="#ffebee" style={{ flex: "1", minWidth: "200px" }}>
          <Stack gap="sm">
            <Text style={{ fontWeight: "bold" }}>Card 1</Text>
            <Text>Content here</Text>
          </Stack>
        </Box>

        <Box color="#e3f2fd" style={{ flex: "1", minWidth: "200px" }}>
          <Stack gap="sm">
            <Text style={{ fontWeight: "bold" }}>Card 2</Text>
            <Text>Content here</Text>
          </Stack>
        </Box>

        <Box color="#e8f5e9" style={{ flex: "1", minWidth: "200px" }}>
          <Stack gap="sm">
            <Text style={{ fontWeight: "bold" }}>Card 3</Text>
            <Text>Content here</Text>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  ),
};

export const AsCustomElement: Story = {
  args: {
    as: "section",
    direction: "column",
    gap: "md",
  },
  render: (args) => (
    <Stack {...args}>
      <Text>This Stack is rendered as a section element</Text>
      <Box color="#ffebee">Item 1</Box>
      <Box color="#e3f2fd">Item 2</Box>
    </Stack>
  ),
};
