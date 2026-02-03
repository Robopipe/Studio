import { IconProps } from "../types";

interface CheckIconProps extends IconProps {}

export const CheckIcon = (props: CheckIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="7"
      fill="none"
      viewBox="0 0 9 7"
      {...props}
    >
      <path
        fill="#fff"
        d="M8.28.22a.75.75 0 0 1 0 1.06L3.422 6.14a.95.95 0 0 1-1.344 0L.22 4.28a.75.75 0 1 1 1.06-1.06l1.47 1.47L7.22.22a.75.75 0 0 1 1.06 0"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};
