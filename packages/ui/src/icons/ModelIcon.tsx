import { type IconProps } from "../types/iconProps";

interface ModelIconProps extends IconProps {}

export const ModelIcon = (props: ModelIconProps) => {
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
        d="M7 2.25A4.75 4.75 0 0 0 2.25 7v10A4.75 4.75 0 0 0 7 21.75h10A4.75 4.75 0 0 0 21.75 17V7A4.75 4.75 0 0 0 17 2.25zM3.75 7A3.25 3.25 0 0 1 7 3.75h10A3.25 3.25 0 0 1 20.25 7v10A3.25 3.25 0 0 1 17 20.25H7A3.25 3.25 0 0 1 3.75 17zm10.7.6a.75.75 0 1 0-.9-1.2l-3.539 2.654a1.25 1.25 0 0 0-.134 1.884l2.981 2.98L9.55 16.4a.75.75 0 0 0 .9 1.2l3.539-2.654a1.25 1.25 0 0 0 .134-1.884l-2.981-2.98z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
