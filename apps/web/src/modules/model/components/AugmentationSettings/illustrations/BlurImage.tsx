import { SVGProps } from "react";

export const BlurImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="34"
      y="44"
      width="40"
      height="32"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <path d="M78 52h20" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M78 60h26" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
    <path d="M78 68h18" stroke="#fff" strokeLinecap="round" strokeWidth="2" />
  </svg>
);
