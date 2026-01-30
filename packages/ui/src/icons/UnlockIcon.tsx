import { type IconProps } from "../types/iconProps";

interface UnlockIconProps extends IconProps {}

export const UnlockIcon = (props: UnlockIconProps) => {
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
        d="M12 4.5A4.5 4.5 0 0 0 7.5 9v.75h9.75a4 4 0 0 1 4 4v2.75a4.75 4.75 0 0 1-4.75 4.75h-9a4.75 4.75 0 0 1-4.75-4.75v-2.75c0-1.953 1.4-3.579 3.25-3.93V9a6 6 0 0 1 11.277-2.858.75.75 0 0 1-1.319.716A4.5 4.5 0 0 0 12 4.5m-5.25 6.75a2.5 2.5 0 0 0-2.5 2.5v2.75a3.25 3.25 0 0 0 3.25 3.25h9a3.25 3.25 0 0 0 3.25-3.25v-2.75a2.5 2.5 0 0 0-2.5-2.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
