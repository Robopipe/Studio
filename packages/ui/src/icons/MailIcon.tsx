import { type IconProps } from "../types/iconProps";

interface MailIconProps extends IconProps {}

export const MailIcon = (props: MailIconProps) => {
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
        d="M7 4.25A4.75 4.75 0 0 0 2.25 9v6A4.75 4.75 0 0 0 7 19.75h10A4.75 4.75 0 0 0 21.75 15V9A4.75 4.75 0 0 0 17 4.25zM3.75 9A3.25 3.25 0 0 1 7 5.75h10A3.25 3.25 0 0 1 20.25 9v6A3.25 3.25 0 0 1 17 18.25H7A3.25 3.25 0 0 1 3.75 15zm4.23-.826a.75.75 0 0 0-.96 1.152l3.86 3.217a1.75 1.75 0 0 0 2.24 0l3.86-3.217a.75.75 0 1 0-.96-1.152l-3.86 3.216a.25.25 0 0 1-.32 0z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
