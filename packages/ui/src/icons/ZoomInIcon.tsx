import { type IconProps } from "../types/iconProps";

interface ZoomInIconProps extends IconProps {}

export const ZoomInIcon = (props: ZoomInIconProps) => {
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
        d="M3.75 11.5a7.75 7.75 0 1 1 15.5 0 7.75 7.75 0 0 1-15.5 0m7.75-9.25a9.25 9.25 0 0 0 0 18.5 9.2 9.2 0 0 0 5.989-2.2l2.98 2.98a.75.75 0 1 0 1.061-1.06l-2.98-2.981a9.2 9.2 0 0 0 2.2-5.989 9.25 9.25 0 0 0-9.25-9.25m0 4.5a.75.75 0 0 1 .75.75v3.25h3.25a.75.75 0 0 1 0 1.5h-3.25v3.25a.75.75 0 0 1-1.5 0v-3.25H7.5a.75.75 0 0 1 0-1.5h3.25V7.5a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
