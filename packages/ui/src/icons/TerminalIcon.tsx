import { type IconProps } from "../types/iconProps";

interface TerminalIconProps extends IconProps {}

export const TerminalIcon = (props: TerminalIconProps) => {
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
        d="M7 3.25A4.75 4.75 0 0 0 2.25 8v8A4.75 4.75 0 0 0 7 20.75h10A4.75 4.75 0 0 0 21.75 16V8A4.75 4.75 0 0 0 17 3.25zM3.75 8A3.25 3.25 0 0 1 7 4.75h10A3.25 3.25 0 0 1 20.25 8v8A3.25 3.25 0 0 1 17 19.25H7A3.25 3.25 0 0 1 3.75 16zm3.72.47a.75.75 0 0 1 1.06 0l2.5 2.5a1.457 1.457 0 0 1 0 2.06l-2.5 2.5a.75.75 0 0 1-1.06-1.06L9.94 12 7.47 9.53a.75.75 0 0 1 0-1.06M12.25 15a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};
