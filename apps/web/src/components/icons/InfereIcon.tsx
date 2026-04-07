import { SVGProps } from "react";

export const InfereIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M9.724 6.858A1.25 1.25 0 0 0 7.75 7.876V16.4a1.25 1.25 0 0 0 1.91 1.061l6.393-3.977a1.25 1.25 0 0 0 .064-2.08zM6.25 7.876c0-2.234 2.523-3.536 4.344-2.24l6.392 4.545c1.6 1.138 1.527 3.539-.14 4.576l-6.393 3.978C8.62 19.875 6.25 18.558 6.25 16.4z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
