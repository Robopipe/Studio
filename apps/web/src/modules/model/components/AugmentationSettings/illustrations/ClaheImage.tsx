import { SVGProps } from "react";

export const ClaheImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    fill="none"
    viewBox="0 0 128 128"
    {...props}
  >
    <rect x="30" y="34" width="68" height="60" rx="4" stroke="#fff" strokeWidth="4" />
    <line x1="52" y1="34" x2="52" y2="94" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
    <line x1="74" y1="34" x2="74" y2="94" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
    <line x1="30" y1="54" x2="98" y2="54" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
    <line x1="30" y1="74" x2="98" y2="74" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
    <rect x="36" y="60" width="10" height="8" rx="1" stroke="#fff" strokeWidth="2" />
    <rect x="58" y="40" width="10" height="8" rx="1" stroke="#fff" strokeWidth="2" />
    <rect x="80" y="78" width="10" height="10" rx="1" stroke="#fff" strokeWidth="2" />
  </svg>
);
