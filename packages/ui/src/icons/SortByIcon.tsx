import { type IconProps } from "../types/iconProps";

interface SortByIconProps extends IconProps {}

export const SortByIcon = (props: SortByIconProps) => {
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
        d="M8.75 4a.75.75 0 0 0-1.5 0v14.19l-2.72-2.72a.75.75 0 0 0-1.06 1.06l3.646 3.647a1.25 1.25 0 0 0 1.768 0l3.646-3.647a.75.75 0 1 0-1.06-1.06l-2.72 2.72zm6.5 16a.75.75 0 0 0 1.5 0V5.81l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.646-3.647a1.25 1.25 0 0 0-1.768 0L11.47 7.47a.75.75 0 0 0 1.06 1.06l2.72-2.72z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
