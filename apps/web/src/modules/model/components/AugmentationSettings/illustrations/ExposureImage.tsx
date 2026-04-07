import { SVGProps } from "react";

export const ExposureImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="36"
      y="38"
      width="48"
      height="32"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="92" cy="86" r="12" stroke="#fff" strokeWidth="4" />
    <path d="M92 74v8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M92 90v8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M80 86h8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M96 86h8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M84 78l6 6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path
      d="M100 78l-6 6"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path d="M84 94l6-6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path
      d="M100 94l-6-6"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
  </svg>
);
