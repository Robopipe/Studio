import { type IconProps } from "../types/iconProps";

interface InformationIconProps extends IconProps {}

export const InformationIcon = (props: InformationIconProps) => {
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
        d="M12 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15m0 1.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18m-1.75-9.5a.75.75 0 0 1 .75-.75h.5c.69 0 1.25.56 1.25 1.25v3.25H13a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-3H11a.75.75 0 0 1-.75-.75m1.75-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
