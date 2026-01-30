import { type IconProps } from "../types/iconProps";

interface AdjustmentsIconProps extends IconProps {}

export const AdjustmentsIcon = (props: AdjustmentsIconProps) => {
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
        d="M7.25 6a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0m-1.372.75H4a.75.75 0 0 1 0-1.5h1.878a2.25 2.25 0 1 1 0 1.5M12 5.25a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5zm-8 6a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5zm13-1.5c.98 0 1.813.626 2.122 1.5H20a.75.75 0 0 1 0 1.5h-.878a2.251 2.251 0 1 1-2.122-3M3.25 18a.75.75 0 0 1 .75-.75h5.878a2.25 2.25 0 0 1 4.244 0H20a.75.75 0 0 1 0 1.5h-5.878a2.251 2.251 0 0 1-4.244 0H4a.75.75 0 0 1-.75-.75M17 11.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M11.25 18a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
