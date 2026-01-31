import { type IconProps } from "../types/iconProps";

interface RefreshIconProps extends IconProps {}

export const RefreshIcon = (props: RefreshIconProps) => {
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
        d="M6.501 5.85 4.95 7.25H7a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 2.25 8V4a.75.75 0 0 1 1.5 0v2.313l1.75-1.58A9.72 9.72 0 0 1 12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75c-4.641 0-8.523-3.242-9.508-7.584a.75.75 0 0 1 1.462-.332A8.25 8.25 0 1 0 12 3.75a8.22 8.22 0 0 0-5.499 2.1"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
