import { type IconProps } from "../types/iconProps";

interface RotateRightIconProps extends IconProps {}

export const RotateRightIcon = (props: RotateRightIconProps) => {
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
        d="M12.283 1.48a.75.75 0 0 0-1.081 1.04l.64.665a9 9 0 0 0-1.069-.062C6.69 3.123 3.25 6.132 3.25 10a.75.75 0 0 0 1.5 0c0-2.902 2.623-5.377 6.023-5.377.453 0 .88.04 1.285.107l-1.104.73a.75.75 0 0 0 .826 1.25l2.628-1.734.015-.01a.75.75 0 0 0 .107-1.15zM10 8.25A2.75 2.75 0 0 0 7.25 11v8A2.75 2.75 0 0 0 10 21.75h8A2.75 2.75 0 0 0 20.75 19v-8A2.75 2.75 0 0 0 18 8.25zM8.75 11c0-.69.56-1.25 1.25-1.25h8c.69 0 1.25.56 1.25 1.25v8c0 .69-.56 1.25-1.25 1.25h-8c-.69 0-1.25-.56-1.25-1.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
