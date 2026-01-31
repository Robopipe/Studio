import { type IconProps } from "../types/iconProps";

interface LinkIconProps extends IconProps {}

export const LinkIcon = (props: LinkIconProps) => {
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
        d="M18.734 5.265a5.166 5.166 0 0 0-7.305 0l-.52.52a.75.75 0 0 0 1.06 1.062l.52-.52a3.666 3.666 0 0 1 5.185 5.184l-.52.52a.75.75 0 0 0 1.06 1.06l.52-.52a5.166 5.166 0 0 0 0-7.306m-4.041 4.042a.75.75 0 0 1 0 1.06l-4.325 4.326a.75.75 0 1 1-1.06-1.06l4.324-4.326a.75.75 0 0 1 1.06 0m-7.846 1.601a.75.75 0 0 1 0 1.06l-.52.521a3.666 3.666 0 0 0 5.184 5.185l.52-.52a.75.75 0 0 1 1.06 1.06l-.52.52a5.166 5.166 0 0 1-7.306-7.305l.52-.52a.75.75 0 0 1 1.062 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
