import { SVGProps } from "react";

export const SensorIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M12.75 3a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0zM2 21.25a.75.75 0 0 0 0 1.5h20a.75.75 0 0 0 0-1.5zM6.75 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h3a.75.75 0 0 1 .75.75m14.25.75a.75.75 0 0 0 0-1.5h-3a.75.75 0 0 0 0 1.5zm-2.47-6.22-1.5 1.5a.75.75 0 1 1-1.06-1.06l1.5-1.5a.75.75 0 1 1 1.06 1.06m-12-1.06a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.06-1.06zM12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5m.75 5.925A3.751 3.751 0 0 0 12 8.25a3.75 3.75 0 0 0-.75 7.425V19a.75.75 0 0 0 1.5 0z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
