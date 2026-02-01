import { type IconProps } from "../types/iconProps";

interface CloseIconProps extends IconProps {}

export const CloseIcon = (props: CloseIconProps) => {
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
        d="M5.53 4.47a.75.75 0 0 0-1.06 1.06L10.94 12l-6.47 6.47a.75.75 0 1 0 1.06 1.06L12 13.06l6.47 6.47a.75.75 0 1 0 1.06-1.06L13.06 12l6.47-6.47a.75.75 0 0 0-1.06-1.06L12 10.94z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
