import { SVGProps } from "react";

export const MotionBlurImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="50" y="40" width="44" height="48" rx="4" stroke="#fff" strokeWidth="4" />
    <path d="M34 50h16" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
    <path d="M28 58h22" stroke="#fff" strokeLinecap="round" strokeWidth="2.5" />
    <path d="M24 66h26" stroke="#fff" strokeLinecap="round" strokeWidth="2" />
    <path d="M28 74h22" stroke="#fff" strokeLinecap="round" strokeWidth="2.5" />
    <path d="M34 82h16" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
  </svg>
);
