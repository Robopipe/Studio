import { type IconProps } from "../types/iconProps";

interface SaveIconProps extends IconProps {}

export const SaveIcon = (props: SaveIconProps) => {
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
        d="M19.5 7v11a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5h.75V9c0 .966.784 1.75 1.75 1.75H15A1.75 1.75 0 0 0 16.75 9V4.688L19.3 6.6a.5.5 0 0 1 .2.4m-4.25-4h1.5v.044a2 2 0 0 1 .783.356l2.667 2A2 2 0 0 1 21 7v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm-7 1.5h7V9a.25.25 0 0 1-.25.25H8.5A.25.25 0 0 1 8.25 9zm5.5 1.5a.75.75 0 0 0-1.5 0v2a.75.75 0 0 0 1.5 0z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};
