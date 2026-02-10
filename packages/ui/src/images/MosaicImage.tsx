import { type IconProps } from "../types/iconProps";

interface MosaicImageProps extends IconProps {}

export const MosaicImage = (props: MosaicImageProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect
      x="28"
      y="40"
      width="44"
      height="32"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <rect x="78" y="46" width="10" height="10" fill="#fff" />
    <rect x="92" y="46" width="10" height="10" fill="#fff" />
    <rect x="106" y="46" width="10" height="10" fill="#fff" />
    <rect x="78" y="60" width="10" height="10" fill="#fff" />
    <rect x="92" y="60" width="10" height="10" fill="#fff" />
    <rect x="106" y="60" width="10" height="10" fill="#fff" />
    <rect x="78" y="74" width="10" height="10" fill="#fff" />
    <rect x="92" y="74" width="10" height="10" fill="#fff" />
    <rect x="106" y="74" width="10" height="10" fill="#fff" />
  </svg>
);
