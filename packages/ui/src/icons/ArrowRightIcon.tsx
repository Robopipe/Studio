import { type IconProps } from "../types/iconProps";

interface ArrowRightIconProps extends IconProps {}

export const ArrowRightIcon = (props: ArrowRightIconProps) => {
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
        d="M9.04 4.399a.75.75 0 0 1 1.062 0l6.717 6.717a1.25 1.25 0 0 1 0 1.768L10.102 19.6a.75.75 0 1 1-1.061-1.06L15.58 12 9.04 5.46a.75.75 0 0 1 0-1.061"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
