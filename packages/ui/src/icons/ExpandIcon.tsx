import { type IconProps } from "../types/iconProps";

interface ExpandIconProps extends IconProps {}

export const ExpandIcon = (props: ExpandIconProps) => {
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
        d="M2.25 5.5c0-.69.56-1.25 1.25-1.25H7a.75.75 0 0 1 0 1.5H4.81l2.72 2.72a.75.75 0 0 1-1.06 1.06L3.75 6.81V9a.75.75 0 0 1-1.5 0zm14-.5a.75.75 0 0 1 .75-.75h3.5c.69 0 1.25.56 1.25 1.25V9a.75.75 0 0 1-1.5 0V6.81l-2.72 2.72a.75.75 0 1 1-1.06-1.06l2.72-2.72H17a.75.75 0 0 1-.75-.75m-14 10a.75.75 0 0 1 1.5 0v2.19l2.72-2.72a.75.75 0 0 1 1.06 1.06l-2.72 2.72H7a.75.75 0 0 1 0 1.5H3.5c-.69 0-1.25-.56-1.25-1.25zM21 14.25a.75.75 0 0 1 .75.75v3.5c0 .69-.56 1.25-1.25 1.25H17a.75.75 0 0 1 0-1.5h2.19l-2.72-2.72a.75.75 0 1 1 1.06-1.06l2.72 2.72V15a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
