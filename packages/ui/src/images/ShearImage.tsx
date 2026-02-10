import { type IconProps } from "../types/iconProps";

interface ShearImageProps extends IconProps {}

export const ShearImage = (props: ShearImageProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <polygon
      points="44,44 92,36 84,84 36,92"
      stroke="#fff"
      strokeLinejoin="round"
      strokeWidth="4"
    />
    <path d="M44 28h32" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M76 22l12 6-12 6z" fill="#fff" />
    <path d="M84 100H52" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    <path d="M52 94l-12 6 12 6z" fill="#fff" />
  </svg>
);
