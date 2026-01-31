import { type IconProps } from "../types/iconProps";

interface OutputIconProps extends IconProps {}

export const OutputIcon = (props: OutputIconProps) => {
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
        d="M12 21.75a.75.75 0 0 0 0-1.5H7A3.25 3.25 0 0 1 3.75 17V7A3.25 3.25 0 0 1 7 3.75h5a.75.75 0 0 0 0-1.5H7A4.75 4.75 0 0 0 2.25 7v10A4.75 4.75 0 0 0 7 21.75zm5.53-14.28a.75.75 0 1 0-1.06 1.06l2.72 2.72H11a.75.75 0 0 0 0 1.5h8.19l-2.72 2.72a.75.75 0 1 0 1.06 1.06l3.647-3.646a1.25 1.25 0 0 0 0-1.768z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
