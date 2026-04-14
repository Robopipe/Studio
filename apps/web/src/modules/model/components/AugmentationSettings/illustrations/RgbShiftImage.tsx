import { SVGProps } from "react";

export const RgbShiftImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <circle cx="54" cy="54" r="20" stroke="#fff" strokeWidth="3" opacity="0.5" />
    <circle cx="74" cy="54" r="20" stroke="#fff" strokeWidth="3" opacity="0.5" />
    <circle cx="64" cy="72" r="20" stroke="#fff" strokeWidth="3" opacity="0.5" />
  </svg>
);
