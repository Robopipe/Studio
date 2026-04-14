import { SVGProps } from "react";

export const SaturationImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="46"
      y="38"
      width="36"
      height="28"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <path
      d="M78 90c0 8-6 14-14 14s-14-6-14-14c0-9 14-22 14-22s14 13 14 22z"
      stroke="#fff"
      strokeWidth="4"
    />
  </svg>
);
