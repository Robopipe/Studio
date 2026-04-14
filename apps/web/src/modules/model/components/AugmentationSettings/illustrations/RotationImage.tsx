import { SVGProps } from "react";

export const RotationImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <circle cx="64" cy="64" r="30" stroke="#fff" strokeWidth="4" />
    <path d="M64 34l12 6-12 6z" fill="#fff" />
    <rect
      x="50"
      y="50"
      width="28"
      height="28"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="70" cy="58" r="3" fill="#fff" />
    <path
      d="M54 74l6-8 8 9 5-6 6 7"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);
