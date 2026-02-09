import { type IconProps } from "../types/iconProps";

interface CutoutImageProps extends IconProps {}

export const CutoutImage = (props: CutoutImageProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="32"
      y="44"
      width="44"
      height="36"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <rect
      x="64"
      y="56"
      width="32"
      height="24"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="46" cy="54" r="3.5" fill="#fff" />
    <path
      d="M38 76l8-10 9 11 6-7 7 8"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);
