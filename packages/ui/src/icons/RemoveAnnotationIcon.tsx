import { type IconProps } from "../types/iconProps";

interface RemoveAnnotationIconProps extends IconProps {}

export const RemoveAnnotationIcon = (props: RemoveAnnotationIconProps) => {
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
        d="M3 5.5c0 .925.503 1.733 1.25 2.166V17A2.75 2.75 0 0 0 7 19.75h9.334a2.5 2.5 0 1 0 3.416-3.416V7A2.75 2.75 0 0 0 17 4.25H7.666A2.499 2.499 0 0 0 3 5.5m15.25 10.512V7c0-.69-.56-1.25-1.25-1.25H7.988A2.5 2.5 0 0 1 5.75 7.988V17c0 .69.56 1.25 1.25 1.25h9.012a2.5 2.5 0 0 1 2.238-2.238M8.47 8.47a.75.75 0 0 1 1.06 0L12 10.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L13.06 12l2.47 2.47a.75.75 0 1 1-1.06 1.06L12 13.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L10.94 12 8.47 9.53a.75.75 0 0 1 0-1.06"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
