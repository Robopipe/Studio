import { type IconProps } from "../types/iconProps";

interface ArrowLeftIconProps extends IconProps {}

export const ArrowLeftIcon = (props: ArrowLeftIconProps) => {
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
        d="M14.96 19.601a.75.75 0 0 1-1.062 0l-6.717-6.717a1.25 1.25 0 0 1 0-1.768L13.899 4.4a.75.75 0 1 1 1.06 1.06L8.42 12l6.54 6.54a.75.75 0 0 1 0 1.061"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
