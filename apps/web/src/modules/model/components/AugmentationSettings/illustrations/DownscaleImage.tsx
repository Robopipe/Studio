import { SVGProps } from "react";

export const DownscaleImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="24" y="30" width="48" height="40" rx="4" stroke="#fff" strokeWidth="4" />
    <rect x="72" y="58" width="28" height="24" rx="3" stroke="#fff" strokeWidth="4" />
    <path d="M64 60L76 68" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <path d="M72 64L68 68L72 72" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
