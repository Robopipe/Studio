import { SVGProps } from "react";

export const MedianBlurImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="34" y="34" width="60" height="60" rx="4" stroke="#fff" strokeWidth="4" />
    <line x1="54" y1="34" x2="54" y2="94" stroke="#fff" strokeWidth="2" />
    <line x1="74" y1="34" x2="74" y2="94" stroke="#fff" strokeWidth="2" />
    <line x1="34" y1="54" x2="94" y2="54" stroke="#fff" strokeWidth="2" />
    <line x1="34" y1="74" x2="94" y2="74" stroke="#fff" strokeWidth="2" />
    <circle cx="64" cy="64" r="6" stroke="#fff" strokeWidth="2.5" />
  </svg>
);
