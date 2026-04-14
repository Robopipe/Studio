import { SVGProps } from "react";

export const Rotate90Image = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <path
      d="M40 72a32 32 0 0 1 32-32"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path d="M76 36l14 2-8 10z" fill="#fff" />
    <path
      d="M88 56a32 32 0 0 1-32 32"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path d="M52 92l-14-2 8-10z" fill="#fff" />
    <rect
      x="48"
      y="44"
      width="32"
      height="32"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="70" cy="54" r="3.5" fill="#fff" />
    <path
      d="M52 72l8-10 9 11 6-7 7 8"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);
