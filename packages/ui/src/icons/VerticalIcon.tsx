import { type IconProps } from "../types/iconProps";

interface VerticalIconProps extends IconProps {}

export const VerticalIcon = (props: VerticalIconProps) => {
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
        d="M6.75 6A2.75 2.75 0 0 1 9.5 3.25h5A2.75 2.75 0 0 1 17.25 6v12a2.75 2.75 0 0 1-2.75 2.75h-5A2.75 2.75 0 0 1 6.75 18zM9.5 4.75c-.69 0-1.25.56-1.25 1.25v12c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25V6c0-.69-.56-1.25-1.25-1.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
