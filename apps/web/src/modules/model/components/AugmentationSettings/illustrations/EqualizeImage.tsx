import { SVGProps } from "react";

export const EqualizeImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <line x1="30" y1="92" x2="98" y2="92" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <rect x="34" y="56" width="8" height="36" rx="2" stroke="#fff" strokeWidth="2.5" />
    <rect x="46" y="48" width="8" height="44" rx="2" stroke="#fff" strokeWidth="2.5" />
    <rect x="58" y="44" width="8" height="48" rx="2" stroke="#fff" strokeWidth="2.5" />
    <rect x="70" y="48" width="8" height="44" rx="2" stroke="#fff" strokeWidth="2.5" />
    <rect x="82" y="52" width="8" height="40" rx="2" stroke="#fff" strokeWidth="2.5" />
    <path d="M34 42h56" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
  </svg>
);
