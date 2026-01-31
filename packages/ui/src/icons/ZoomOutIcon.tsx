import { type IconProps } from "../types/iconProps";

interface ZoomOutIconProps extends IconProps {}

export const ZoomOutIcon = (props: ZoomOutIconProps) => {
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
        d="M11.5 3.75a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5M2.25 11.5a9.25 9.25 0 0 1 18.5 0 9.2 9.2 0 0 1-2.2 5.989l2.98 2.98a.75.75 0 1 1-1.06 1.061l-2.981-2.98a9.2 9.2 0 0 1-5.989 2.2 9.25 9.25 0 0 1-9.25-9.25m5.25-.75a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
