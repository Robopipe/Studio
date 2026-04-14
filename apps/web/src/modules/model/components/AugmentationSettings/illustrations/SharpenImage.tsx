import { SVGProps } from "react";

export const SharpenImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <polygon points="64,30 90,90 38,90" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
    <line x1="64" y1="30" x2="64" y2="18" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="38" y1="90" x2="28" y2="96" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="90" y1="90" x2="100" y2="96" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="48" y1="60" x2="40" y2="52" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="80" y1="60" x2="88" y2="52" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
