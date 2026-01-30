import { type IconProps } from "../types/iconProps";

interface DateIconProps extends IconProps {}

export const DateIcon = (props: DateIconProps) => {
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
        d="M17.75 4a.75.75 0 0 0-1.5 0v1h-8.5V4a.75.75 0 0 0-1.5 0v1.07A4.004 4.004 0 0 0 3 9v8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V9a4.004 4.004 0 0 0-3.25-3.93zM4.5 9.75h15V17a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17zm.114-1.5h14.772A2.5 2.5 0 0 0 17 6.5H7c-1.12 0-2.067.736-2.386 1.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
