import { type IconProps } from "../types/iconProps";

interface NoteIconProps extends IconProps {}

export const NoteIcon = (props: NoteIconProps) => {
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
        d="M9 3.5h3q.13 0 .26.005c.08 1.886.616 3.431 1.71 4.525s2.64 1.63 4.525 1.71q.005.13.005.26v7a3.5 3.5 0 0 1-3.5 3.5H9A3.5 3.5 0 0 1 5.5 17V7A3.5 3.5 0 0 1 9 3.5m9.254 4.723a6.51 6.51 0 0 0-4.478-4.477c.11 1.482.556 2.526 1.254 3.224s1.742 1.144 3.224 1.253M4 7a5 5 0 0 1 5-5h3a8 8 0 0 1 8 8v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm4.25 7a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75M9 16.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
