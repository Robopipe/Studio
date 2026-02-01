import { type IconProps } from "../types/iconProps";

interface SettingsIconProps extends IconProps {}

export const SettingsIcon = (props: SettingsIconProps) => {
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
        d="M19.5 9.354v5.292a2.5 2.5 0 0 1-1.286 2.186l-5 2.778a2.5 2.5 0 0 1-2.428 0l-5-2.778A2.5 2.5 0 0 1 4.5 14.646V9.354a2.5 2.5 0 0 1 1.286-2.186l5-2.778a2.5 2.5 0 0 1 2.428 0l5 2.778A2.5 2.5 0 0 1 19.5 9.354m-16.5 0a4 4 0 0 1 2.057-3.497l5-2.778a4 4 0 0 1 3.886 0l5 2.778A4 4 0 0 1 21 9.354v5.292a4 4 0 0 1-2.057 3.497l-5 2.778a4 4 0 0 1-3.886 0l-5-2.778A4 4 0 0 1 3 14.646zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0m1.5 0a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
