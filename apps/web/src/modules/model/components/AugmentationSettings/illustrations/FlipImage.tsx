import { SVGProps } from "react";

export const FlipImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="4" y="4" width="120" height="120" rx="16" fill="#0F7F46" />
    <path
      d="M64 28v72"
      stroke="#fff"
      strokeDasharray="6 6"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path d="M30 64l16-10v20z" fill="#fff" />
    <path d="M98 64l-16-10v20z" fill="#fff" />
    <rect
      x="46"
      y="40"
      width="36"
      height="36"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="72" cy="50" r="4" fill="#fff" />
    <path
      d="M52 68l10-12 10 12 8-10 8 10"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);
