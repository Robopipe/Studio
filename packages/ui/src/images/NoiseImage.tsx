import { type IconProps } from "../types/iconProps";

interface NoiseImageProps extends IconProps {}

export const NoiseImage = (props: NoiseImageProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="40"
      y="40"
      width="48"
      height="48"
      rx="4"
      stroke="#fff"
      strokeDasharray="2 6"
      strokeWidth="4"
    />
    <rect x="34" y="34" width="4" height="4" fill="#fff" />
    <rect x="90" y="36" width="4" height="4" fill="#fff" />
    <rect x="36" y="92" width="4" height="4" fill="#fff" />
    <rect x="92" y="90" width="4" height="4" fill="#fff" />
  </svg>
);
