import { type IconProps } from "../types/iconProps";

interface ChartIconProps extends IconProps {}

export const ChartIcon = (props: ChartIconProps) => {
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
        d="M17 2.25A4.75 4.75 0 0 1 21.75 7v10A4.75 4.75 0 0 1 17 21.75H7A4.75 4.75 0 0 1 2.25 17V7A4.75 4.75 0 0 1 7 2.25zM7 3.75A3.25 3.25 0 0 0 3.75 7v7.188l1.303-1.738a1.25 1.25 0 0 1 1.885-.134l2.98 2.982L15.3 8.039a.75.75 0 0 1 1.2.9l-5.553 7.489a1.25 1.25 0 0 1-1.884.134l-2.981-2.98-2.331 3.107V17A3.25 3.25 0 0 0 7 20.25h10A3.25 3.25 0 0 0 20.25 17V7A3.25 3.25 0 0 0 17 3.75z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
