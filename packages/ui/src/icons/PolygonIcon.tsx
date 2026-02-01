import { type IconProps } from "../types/iconProps";

interface PolygonIconProps extends IconProps {}

export const PolygonIcon = (props: PolygonIconProps) => {
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
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeOpacity=".9"
        d="M12 3.5L4.5 9l2.5 9h10l2.5-9z"
      />
      <circle cx="12" cy="3.5" r="2" fill="currentColor" fillOpacity=".9" />
      <circle cx="4.5" cy="9" r="2" fill="currentColor" fillOpacity=".9" />
      <circle cx="7" cy="18" r="2" fill="currentColor" fillOpacity=".9" />
      <circle cx="17" cy="18" r="2" fill="currentColor" fillOpacity=".9" />
      <circle cx="19.5" cy="9" r="2" fill="currentColor" fillOpacity=".9" />
    </svg>
  );
};
