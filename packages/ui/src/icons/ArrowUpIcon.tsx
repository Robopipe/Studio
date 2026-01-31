import { type IconProps } from "../types/iconProps";

interface ArrowUpIconProps extends IconProps {}

export const ArrowUpIcon = (props: ArrowUpIconProps) => {
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
        d="M4.399 14.96a.75.75 0 0 1 0-1.061l6.717-6.718a1.25 1.25 0 0 1 1.768 0L19.6 13.9a.75.75 0 0 1-1.06 1.06L12 8.42l-6.54 6.54a.75.75 0 0 1-1.061 0"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
