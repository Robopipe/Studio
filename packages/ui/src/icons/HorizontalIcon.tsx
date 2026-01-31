import { type IconProps } from "../types/iconProps";

interface HorizontalIconProps extends IconProps {}

export const HorizontalIcon = (props: HorizontalIconProps) => {
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
        d="M3.25 9.5A2.75 2.75 0 0 1 6 6.75h12a2.75 2.75 0 0 1 2.75 2.75v5A2.75 2.75 0 0 1 18 17.25H6a2.75 2.75 0 0 1-2.75-2.75zM6 8.25c-.69 0-1.25.56-1.25 1.25v5c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25v-5c0-.69-.56-1.25-1.25-1.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
