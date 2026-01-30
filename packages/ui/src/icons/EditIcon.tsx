import { type IconProps } from "../types/iconProps";

interface EditIconProps extends IconProps {}

export const EditIcon = (props: EditIconProps) => {
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
        d="M16.327 4.921c.612-.61 1.957-.6 2.75.35.636.761.577 1.993-.359 2.927l-.569.568a5.9 5.9 0 0 1-1.791-1.217 5.7 5.7 0 0 1-1.099-1.562zm-1.586-.537-1.235 1.233-7.259 7.243c-1.537 1.534-2.655 4.949-3.211 6.968a.917.917 0 0 0 1.17 1.128c2.11-.648 5.75-1.897 7.003-3.146l8.569-8.55c1.353-1.35 1.696-3.46.45-4.95-1.245-1.492-3.607-1.8-4.96-.45zm-.594 2.712c.312.55.695 1.058 1.149 1.512.5.502 1.08.931 1.73 1.278l-6.877 6.862c-.39.39-1.35.92-2.692 1.474-.887.366-1.833.7-2.676.977a28 28 0 0 1 .877-2.46c.525-1.258 1.097-2.267 1.649-2.817z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
