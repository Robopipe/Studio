import { type IconProps } from "../types/iconProps";

interface ImageIconProps extends IconProps {}

export const ImageIcon = (props: ImageIconProps) => {
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
        d="M18 5.5H6A2.5 2.5 0 0 0 3.5 8v8A2.5 2.5 0 0 0 6 18.5h12a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 18 5.5M6 4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4zm3 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-2.899 6.927L7.71 13.13a1 1 0 0 1 1.619-.027L10 14l2.673-3.82a1 1 0 0 1 1.644.008l3.606 5.246A1 1 0 0 1 17.099 17H6.921a1 1 0 0 1-.82-1.573"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
