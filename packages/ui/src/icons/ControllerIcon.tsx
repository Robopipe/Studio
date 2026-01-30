import { type IconProps } from "../types/iconProps";

interface ControllerIconProps extends IconProps {}

export const ControllerIcon = (props: ControllerIconProps) => {
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
        d="M4.75 8A3.25 3.25 0 0 1 8 4.75h8A3.25 3.25 0 0 1 19.25 8v8A3.25 3.25 0 0 1 16 19.25H8A3.25 3.25 0 0 1 4.75 16zm5-4.75h-1.5V2a.75.75 0 0 0-1.5 0v1.416A4.75 4.75 0 0 0 3.25 8v8a4.75 4.75 0 0 0 3.5 4.584V22a.75.75 0 0 0 1.5 0v-1.25h1.5V22a.75.75 0 0 0 1.5 0v-1.25h1.5V22a.75.75 0 0 0 1.5 0v-1.25h1.5V22a.75.75 0 0 0 1.5 0v-1.416A4.75 4.75 0 0 0 20.75 16V8a4.75 4.75 0 0 0-3.5-4.584V2a.75.75 0 0 0-1.5 0v1.25h-1.5V2a.75.75 0 0 0-1.5 0v1.25h-1.5V2a.75.75 0 0 0-1.5 0z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
