import { type IconProps } from "../types/iconProps";

interface DropdownMenuIconProps extends IconProps {}

export const DropdownMenuIcon = (props: DropdownMenuIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="#000" fillOpacity=".9">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </g>
    </svg>
  );
};
