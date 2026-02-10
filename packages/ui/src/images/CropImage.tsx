import { type IconProps } from "../types/iconProps";

interface CropImageProps extends IconProps {}

export const CropImage = (props: CropImageProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <path
      d="M36 52V36h16"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M92 52V36H76"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M36 76v16h16"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M92 76v16H76"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <rect
      x="48"
      y="48"
      width="32"
      height="32"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="70" cy="58" r="3.5" fill="#fff" />
    <path
      d="M52 76l8-10 9 11 6-7 7 8"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);
