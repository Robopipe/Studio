import { type IconProps } from "../types/iconProps";

interface IndicatorIconProps extends IconProps {}

export const IndicatorIcon = (props: IndicatorIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="#000" fillOpacity=".9" />
    </svg>
  );
};
