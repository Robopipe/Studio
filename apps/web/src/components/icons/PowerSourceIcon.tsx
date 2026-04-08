import { SVGProps } from "react";

export const PowerSourceIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M13 3.25a.75.75 0 0 1 .75.75v7.25H21a.75.75 0 0 1 0 1.5h-7.25V20a.75.75 0 0 1-1.5 0V4a.75.75 0 0 1 .75-.75m-3 3a.75.75 0 0 1 .75.75v10a.75.75 0 0 1-1.5 0v-4.25H3a.75.75 0 0 1 0-1.5h6.25V7a.75.75 0 0 1 .75-.75M18.75 4a.75.75 0 0 0-1.5 0v1.25H16a.75.75 0 0 0 0 1.5h1.25V8a.75.75 0 0 0 1.5 0V6.75H20a.75.75 0 0 0 0-1.5h-1.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
