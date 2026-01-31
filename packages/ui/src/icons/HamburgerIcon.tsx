import { type IconProps } from "../types/iconProps";

interface HamburgerIconProps extends IconProps {}

export const HamburgerIcon = (props: HamburgerIconProps) => {
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
        d="M3.25 6A.75.75 0 0 1 4 5.25h16a.75.75 0 0 1 0 1.5H4A.75.75 0 0 1 3.25 6m0 6a.75.75 0 0 1 .75-.75h16a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75M4 17.25a.75.75 0 0 0 0 1.5h16a.75.75 0 0 0 0-1.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
