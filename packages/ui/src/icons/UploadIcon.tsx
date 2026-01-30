import { type IconProps } from "../types/iconProps";

interface UploadIconProps extends IconProps {}

export const UploadIcon = (props: UploadIconProps) => {
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
        d="M12.884 2.823a1.25 1.25 0 0 0-1.768 0L8.47 5.47a.75.75 0 0 0 1.06 1.06l1.72-1.72V13a.75.75 0 0 0 1.5 0V4.81l1.72 1.72a.75.75 0 1 0 1.06-1.06zM4.75 16a.75.75 0 0 0-1.5 0v1A4.75 4.75 0 0 0 8 21.75h8A4.75 4.75 0 0 0 20.75 17v-1a.75.75 0 0 0-1.5 0v1A3.25 3.25 0 0 1 16 20.25H8A3.25 3.25 0 0 1 4.75 17z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
