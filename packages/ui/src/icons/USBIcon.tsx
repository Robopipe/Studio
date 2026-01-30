import { type IconProps } from "../types/iconProps";

interface USBIconProps extends IconProps {}

export const USBIcon = (props: USBIconProps) => {
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
        d="M4 6.25A2.75 2.75 0 0 0 1.25 9v6A2.75 2.75 0 0 0 4 17.75h16A2.75 2.75 0 0 0 22.75 15V9A2.75 2.75 0 0 0 20 6.25zM2.75 9c0-.69.56-1.25 1.25-1.25h16c.69 0 1.25.56 1.25 1.25v6c0 .69-.56 1.25-1.25 1.25H4c-.69 0-1.25-.56-1.25-1.25zM7 13a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
