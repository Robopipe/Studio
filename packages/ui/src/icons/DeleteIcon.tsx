import { type IconProps } from "../types/iconProps";

interface DeleteIconProps extends IconProps {}

export const DeleteIcon = (props: DeleteIconProps) => {
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
        d="M10.442 2.25a2.75 2.75 0 0 0-2.61 1.88L7.46 5.25H3.5a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5h-3.96l-.373-1.12a2.75 2.75 0 0 0-2.609-1.88zm4.517 3H9.041l.215-.645a1.25 1.25 0 0 1 1.185-.855h3.117a1.25 1.25 0 0 1 1.186.855zM5.748 8.44a.75.75 0 0 0-1.496.12l.706 8.819a4.75 4.75 0 0 0 4.735 4.371h4.614a4.75 4.75 0 0 0 4.735-4.371l.706-8.82a.75.75 0 0 0-1.496-.119l-.705 8.82a3.25 3.25 0 0 1-3.24 2.99H9.693a3.25 3.25 0 0 1-3.24-2.99zm4.498 2.485a.75.75 0 0 0-1.492.15l.5 5a.75.75 0 1 0 1.492-.15zm4.329-.671a.75.75 0 0 1 .671.82l-.5 5a.75.75 0 0 1-1.492-.149l.5-5a.75.75 0 0 1 .82-.671"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
