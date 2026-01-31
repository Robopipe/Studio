import { type IconProps } from "../types/iconProps";

interface AnnotateIconProps extends IconProps {}

export const AnnotateIcon = (props: AnnotateIconProps) => {
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
        fill="currentColor"
        d="M3 5.5c0 .925.503 1.733 1.25 2.166V17A2.75 2.75 0 0 0 7 19.75h9.334a2.5 2.5 0 1 0 3.416-3.416V7A2.75 2.75 0 0 0 17 4.25H7.666A2.499 2.499 0 0 0 3 5.5m15.25 10.512V7c0-.69-.56-1.25-1.25-1.25H7.988A2.5 2.5 0 0 1 5.75 7.988V17c0 .69.56 1.25 1.25 1.25h9.012a2.5 2.5 0 0 1 2.238-2.238"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
