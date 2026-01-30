import { type IconProps } from "../types/iconProps";

interface YaxisIconProps extends IconProps {}

export const YaxisIcon = (props: YaxisIconProps) => {
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
        d="M5.25 20a.75.75 0 0 0 1.5 0V4a.75.75 0 0 0-1.5 0zm5.836-13.468a.75.75 0 0 0-1.172.937l3.836 4.794V17a.75.75 0 0 0 1.5 0v-4.737l3.836-4.794a.75.75 0 0 0-1.172-.937L14.5 10.799z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
