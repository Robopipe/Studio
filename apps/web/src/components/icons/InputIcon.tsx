import { SVGProps } from "react";

export const InputIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M12 2.25a.75.75 0 0 0 0 1.5h5A3.25 3.25 0 0 1 20.25 7v10A3.25 3.25 0 0 1 17 20.25h-5a.75.75 0 0 0 0 1.5h5A4.75 4.75 0 0 0 21.75 17V7A4.75 4.75 0 0 0 17 2.25zM9.53 7.47a.75.75 0 0 0-1.06 1.06l2.72 2.72H3a.75.75 0 0 0 0 1.5h8.19l-2.72 2.72a.75.75 0 1 0 1.06 1.06l3.647-3.646a1.25 1.25 0 0 0 0-1.768z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
