import { type IconProps } from "../types/iconProps";

interface RotateLeftIconProps extends IconProps {}

export const RotateLeftIcon = (props: RotateLeftIconProps) => {
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
        d="M12.798 2.52a.75.75 0 0 0-1.08-1.04L9.462 3.822l-.011.012a.746.746 0 0 0-.081.921.75.75 0 0 0 .227.225l2.622 1.73a.75.75 0 1 0 .826-1.25l-1.104-.73a8 8 0 0 1 1.285-.107c3.4 0 6.023 2.475 6.023 5.377a.75.75 0 0 0 1.5 0c0-3.868-3.44-6.877-7.523-6.877q-.555.001-1.068.062zM6 8.25A2.75 2.75 0 0 0 3.25 11v8A2.75 2.75 0 0 0 6 21.75h8A2.75 2.75 0 0 0 16.75 19v-8A2.75 2.75 0 0 0 14 8.25zM4.75 11c0-.69.56-1.25 1.25-1.25h8c.69 0 1.25.56 1.25 1.25v8c0 .69-.56 1.25-1.25 1.25H6c-.69 0-1.25-.56-1.25-1.25z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
