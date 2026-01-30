import { type IconProps } from "../types/iconProps";

interface UndoIconProps extends IconProps {}

export const UndoIcon = (props: UndoIconProps) => {
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
        d="M7.53 4.97a.75.75 0 0 1 0 1.06L5.81 7.75H15a5.75 5.75 0 0 1 0 11.5H8a.75.75 0 0 1 0-1.5h7a4.25 4.25 0 0 0 0-8.5H5.81l1.72 1.72a.75.75 0 1 1-1.06 1.06L3.54 9.101a.85.85 0 0 1 0-1.202l2.93-2.93a.75.75 0 0 1 1.06 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
