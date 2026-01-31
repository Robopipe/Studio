import { type IconProps } from "../types/iconProps";

interface FullArrowDownIconProps extends IconProps {}

export const FullArrowDownIcon = (props: FullArrowDownIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path fill="#fff" d="M0 0h24v24H0z" />
      <path
        fill="#000"
        d="M12 3.25a.75.75 0 0 1 .75.75v14.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.858 4.859a.95.95 0 0 1-1.344 0L6.47 15.53a.75.75 0 1 1 1.06-1.06l3.72 3.72V4a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
