import { type IconProps } from "../types/iconProps";

interface FullArrowUpIconProps extends IconProps {}

export const FullArrowUpIcon = (props: FullArrowUpIconProps) => {
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
        d="M11.328 3.611a.95.95 0 0 1 1.344 0L17.53 8.47a.75.75 0 0 1-1.06 1.06l-3.72-3.72V20a.75.75 0 0 1-1.5 0V5.81L7.53 9.53a.75.75 0 0 1-1.06-1.06z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
