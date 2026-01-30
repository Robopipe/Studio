import { type IconProps } from "../types/iconProps";

interface SupportIconProps extends IconProps {}

export const SupportIcon = (props: SupportIconProps) => {
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
        d="M19.5 12a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0m1.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0m1.5 0a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-6.505 3.005a.75.75 0 0 1 0 1.06l-.707.708a.75.75 0 1 1-1.061-1.06l.707-.708a.75.75 0 0 1 1.06 0m7.07 0a.75.75 0 0 0-1.06 1.06l.707.708a.75.75 0 0 0 1.061-1.06zM7.228 7.227a.75.75 0 0 1 1.06 0l.708.707a.75.75 0 1 1-1.06 1.06l-.708-.706a.75.75 0 0 1 0-1.061m9.546 1.06a.75.75 0 0 0-1.06-1.06l-.708.707a.75.75 0 0 0 1.06 1.06z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
