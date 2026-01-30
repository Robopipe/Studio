import { type IconProps } from "../types/iconProps";

interface ArrowDownIconProps extends IconProps {}

export const ArrowDownIcon = (props: ArrowDownIconProps) => {
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
        d="M19.601 9.04a.75.75 0 0 1 0 1.061l-6.717 6.718a1.25 1.25 0 0 1-1.768 0L4.4 10.1a.75.75 0 0 1 1.06-1.06L12 15.58l6.54-6.54a.75.75 0 0 1 1.061 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
