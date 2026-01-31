import { type IconProps } from "../types/iconProps";

interface VisibleIconProps extends IconProps {}

export const VisibleIcon = (props: VisibleIconProps) => {
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
        d="M12 3.25c4.354 0 8.611 2.736 10.705 8.494a.75.75 0 0 1 0 .512C20.611 18.014 16.355 20.75 12 20.75c-4.218 0-8.344-2.567-10.502-7.963l-.203-.531a.75.75 0 0 1 0-.512l.203-.531C3.656 5.817 7.782 3.25 12 3.25m0 1.5c-3.586 0-7.264 2.191-9.198 7.25 1.934 5.059 5.612 7.25 9.198 7.25s7.264-2.191 9.197-7.25C19.264 6.941 15.586 4.75 12 4.75m0 3.5a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5m0 1.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5"
      />
    </svg>
  );
};
