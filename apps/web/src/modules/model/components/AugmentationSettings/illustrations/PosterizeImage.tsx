import { SVGProps } from "react";

export const PosterizeImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="30" y="34" width="68" height="60" rx="4" stroke="#fff" strokeWidth="4" />
    <rect x="30" y="34" width="34" height="30" stroke="#fff" strokeWidth="2" opacity="0.3" />
    <rect x="64" y="34" width="34" height="30" stroke="#fff" strokeWidth="2" opacity="0.6" />
    <rect x="30" y="64" width="34" height="30" stroke="#fff" strokeWidth="2" opacity="0.6" />
    <rect x="64" y="64" width="34" height="30" stroke="#fff" strokeWidth="2" opacity="1" />
    <path d="M38 48h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M72 48h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M38 78h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M72 78h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
