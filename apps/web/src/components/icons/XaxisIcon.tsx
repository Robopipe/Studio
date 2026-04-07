import { SVGProps } from "react";

export const XaxisIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="#000"
        d="M8.586 4.532a.75.75 0 1 0-1.172.937L11.04 10l-3.626 4.531a.75.75 0 1 0 1.172.938L12 11.2l3.414 4.268a.75.75 0 1 0 1.172-.937L12.96 10l3.625-4.531a.75.75 0 0 0-1.172-.937L12 8.799zM4 18.25a.75.75 0 0 0 0 1.5h16a.75.75 0 0 0 0-1.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
