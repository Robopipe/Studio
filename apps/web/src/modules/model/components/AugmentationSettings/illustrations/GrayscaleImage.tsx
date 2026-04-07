import { SVGProps } from "react";

export const GrayscaleImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="44"
      y="40"
      width="40"
      height="40"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <rect x="44" y="40" width="20" height="40" fill="#fff" opacity="0.35" />
    <rect x="64" y="40" width="20" height="40" fill="#fff" opacity="0.75" />
    <circle cx="72" cy="50" r="4" fill="#fff" />
  </svg>
);
