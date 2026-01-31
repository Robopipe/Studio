import { type IconProps } from "../types/iconProps";

interface FullArrowRightIconProps extends IconProps {}

export const FullArrowRightIcon = (props: FullArrowRightIconProps) => {
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
        d="M3.25 12a.75.75 0 0 1 .75-.75h14.19l-3.72-3.72a.75.75 0 0 1 1.06-1.06l4.859 4.858a.95.95 0 0 1 0 1.344L15.53 17.53a.75.75 0 1 1-1.06-1.06l3.72-3.72H4a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
