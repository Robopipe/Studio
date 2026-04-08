import { SVGProps } from "react";

export const RectBboxIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        strokeOpacity=".9"
      />
      <rect x="2" y="4" width="3" height="3" rx=".75" fill="currentColor" fillOpacity=".9" />
      <rect x="19" y="4" width="3" height="3" rx=".75" fill="currentColor" fillOpacity=".9" />
      <rect x="2" y="17" width="3" height="3" rx=".75" fill="currentColor" fillOpacity=".9" />
      <rect x="19" y="17" width="3" height="3" rx=".75" fill="currentColor" fillOpacity=".9" />
    </svg>
  );
};
