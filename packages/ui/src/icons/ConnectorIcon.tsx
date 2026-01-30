import { type IconProps } from "../types/iconProps";

interface ConnectorIconProps extends IconProps {}

export const ConnectorIcon = (props: ConnectorIconProps) => {
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
        d="M10.464 7.363a2 2 0 1 0-1.36.634l.84 1.799a4.5 4.5 0 0 0-1.882 2.954H5.855a2 2 0 1 0 0 1.5h2.207a4.501 4.501 0 0 0 7.857 2.176l2.105 1.263a2 2 0 1 0 .772-1.286l-2.104-1.263A4.5 4.5 0 0 0 17 13.5a4.5 4.5 0 0 0-.478-2.02l2.426-1.779a2 2 0 1 0-.887-1.21l-2.427 1.78a4.5 4.5 0 0 0-4.331-1.11zM15.5 13.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
