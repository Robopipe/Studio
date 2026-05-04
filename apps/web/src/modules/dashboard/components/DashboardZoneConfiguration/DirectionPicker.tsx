import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

const options: {
  value: DashboardConfigurationZoneDirectionEnum;
  label: string;
  Icon: typeof ArrowRight;
}[] = [
  {
    value: DashboardConfigurationZoneDirectionEnum.LEFT_TO_RIGHT,
    label: "Left to right",
    Icon: ArrowRight,
  },
  {
    value: DashboardConfigurationZoneDirectionEnum.RIGHT_TO_LEFT,
    label: "Right to left",
    Icon: ArrowLeft,
  },
  {
    value: DashboardConfigurationZoneDirectionEnum.TOP_TO_BOTTOM,
    label: "Top to bottom",
    Icon: ArrowDown,
  },
  {
    value: DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP,
    label: "Bottom to top",
    Icon: ArrowUp,
  },
];

interface DirectionPickerProps {
  value: DashboardConfigurationZoneDirectionEnum;
  onChange: (value: DashboardConfigurationZoneDirectionEnum) => void;
}

export const DirectionPicker = ({ value, onChange }: DirectionPickerProps) => {
  return (
    <div className="inline-flex h-9 items-center rounded-md border border-input bg-muted p-0.5 text-sm">
      {options.map(({ value: optionValue, label, Icon }) => {
        const isSelected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            aria-label={label}
            title={label}
            className={`flex h-8 w-9 cursor-pointer items-center justify-center rounded-sm transition-colors ${
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onChange(optionValue)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
};
