import { SVGProps } from "react";

export const StopCaptureIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M4.25 9A4.75 4.75 0 0 1 9 4.25h6A4.75 4.75 0 0 1 19.75 9v6A4.75 4.75 0 0 1 15 19.75H9A4.75 4.75 0 0 1 4.25 15zM9 5.75A3.25 3.25 0 0 0 5.75 9v6A3.25 3.25 0 0 0 9 18.25h6A3.25 3.25 0 0 0 18.25 15V9A3.25 3.25 0 0 0 15 5.75z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
