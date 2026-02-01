import { IconProps } from "../types";

interface CheckIconProps extends IconProps {}

export const CheckIcon = (props: CheckIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="8"
      fill="none"
      viewBox="0 0 12 8"
      {...props}
    >
      <path
        stroke="currentColor"
        d="M10.274.75 4.08 6.944a.5.5 0 0 1-.708 0L.75 4.322"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};
