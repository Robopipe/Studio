import { type IconProps } from "../types/iconProps";

interface BrightnessImageProps extends IconProps {}

export const BrightnessImage = (props: BrightnessImageProps) => (
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
      y="38"
      width="40"
      height="28"
      rx="4"
      stroke="#fff"
      strokeWidth="4"
    />
    <circle cx="90" cy="86" r="6" fill="#fff" />
    <path d="M90 74v-8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M90 98v8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M78 86h-8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M102 86h8" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M82 78l-6-6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M98 94l6 6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M98 78l6-6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M82 94l-6 6" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
  </svg>
);
