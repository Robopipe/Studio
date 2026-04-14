import { SVGProps } from "react";

export const PerspectiveImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="30" y="36" width="68" height="56" rx="4" stroke="#fff" strokeWidth="3" strokeDasharray="6 4" opacity="0.4" />
    <path
      d="M42 40L92 34L96 88L36 92Z"
      stroke="#fff"
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);
