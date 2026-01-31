import { type IconProps } from "../types/iconProps";

interface DesktopIconProps extends IconProps {}

export const DesktopIcon = (props: DesktopIconProps) => {
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
        d="M6 4.25A2.75 2.75 0 0 0 3.25 7v6A2.75 2.75 0 0 0 6 15.75h12A2.75 2.75 0 0 0 20.75 13V7A2.75 2.75 0 0 0 18 4.25zM4.75 7c0-.69.56-1.25 1.25-1.25h12c.69 0 1.25.56 1.25 1.25v6c0 .69-.56 1.25-1.25 1.25H6c-.69 0-1.25-.56-1.25-1.25zm8 10.5a.75.75 0 0 0-1.5 0v.75H9a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-2.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
