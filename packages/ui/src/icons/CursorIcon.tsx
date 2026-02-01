import { type IconProps } from "../types/iconProps";

interface CursorIconProps extends IconProps {}

export const CursorIcon = (props: CursorIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        fillOpacity=".9"
        d="M5.5 3.21a.75.75 0 0 1 1.206-.592l12.5 9.75a.75.75 0 0 1-.413 1.346l-5.074.404-2.86 5.026a.75.75 0 0 1-1.362-.104l-4.25-13.75a.75.75 0 0 1 .253-.835z"
      />
    </svg>
  );
};
