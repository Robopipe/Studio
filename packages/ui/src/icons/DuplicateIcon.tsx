import { type IconProps } from "../types/iconProps";

interface DuplicateIconProps extends IconProps {}

export const DuplicateIcon = (props: DuplicateIconProps) => {
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
        d="M11.5 5h5A2.5 2.5 0 0 1 19 7.5v5a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 9 12.5v-5A2.5 2.5 0 0 1 11.5 5m-4 2.5a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-5a4 4 0 0 1-4-4zm-4 6a4 4 0 0 1 3-3.874v1.582A2.5 2.5 0 0 0 5 13.5v3A2.5 2.5 0 0 0 7.5 19h3a2.5 2.5 0 0 0 2.292-1.5h1.582a4 4 0 0 1-3.874 3h-3a4 4 0 0 1-4-4z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
