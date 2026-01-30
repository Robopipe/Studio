import { type IconProps } from "../types/iconProps";

interface DownloadIconProps extends IconProps {}

export const DownloadIcon = (props: DownloadIconProps) => {
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
        d="M12.75 4a.75.75 0 0 0-1.5 0v8.19l-1.72-1.72a.75.75 0 1 0-1.06 1.06l2.646 2.647a1.25 1.25 0 0 0 1.768 0l2.646-2.647a.75.75 0 0 0-1.06-1.06l-1.72 1.72zm-8 12a.75.75 0 0 0-1.5 0v1A4.75 4.75 0 0 0 8 21.75h8A4.75 4.75 0 0 0 20.75 17v-1a.75.75 0 0 0-1.5 0v1A3.25 3.25 0 0 1 16 20.25H8A3.25 3.25 0 0 1 4.75 17z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
