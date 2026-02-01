import { type IconProps } from "../types/iconProps";

interface LogoutIconProps extends IconProps {}

export const LogoutIcon = (props: LogoutIconProps) => {
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
        d="M13.854 20.104a.75.75 0 0 1-.75.75h-6a4.75 4.75 0 0 1-4.75-4.75v-8a4.75 4.75 0 0 1 4.75-4.75h6a.75.75 0 0 1 0 1.5h-6a3.25 3.25 0 0 0-3.25 3.25v8a3.25 3.25 0 0 0 3.25 3.25h6a.75.75 0 0 1 .75.75m7.426-8.884a1.25 1.25 0 0 1 0 1.767l-2.646 2.647a.75.75 0 1 1-1.06-1.06l1.719-1.72h-8.19a.75.75 0 0 1 0-1.5h8.19l-1.72-1.72a.75.75 0 0 1 1.06-1.06z"
        fillOpacity=".9"
      />
    </svg>
  );
};
