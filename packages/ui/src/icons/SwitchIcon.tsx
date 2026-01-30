import { type IconProps } from "../types/iconProps";

interface SwitchIconProps extends IconProps {}

export const SwitchIcon = (props: SwitchIconProps) => {
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
        fill="#000"
        d="M12.751 4.032a.75.75 0 0 0-1.5 0v7.719a.75.75 0 0 0 1.5 0zM8.575 6.337a.75.75 0 1 0-.764-1.29 8.226 8.226 0 1 0 8.38 0 .75.75 0 1 0-.765 1.29 6.726 6.726 0 1 1-6.851 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
