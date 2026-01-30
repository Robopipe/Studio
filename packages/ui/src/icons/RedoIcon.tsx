import { type IconProps } from "../types/iconProps";

interface RedoIconProps extends IconProps {}

export const RedoIcon = (props: RedoIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="#000">
        <path d="M16 19.6a.75.75 0 0 0 0-1.5zm.47-8.28a.75.75 0 0 0 1.06 1.06zm1.06-6a.75.75 0 1 0-1.06 1.06zm2.4 3.6-.531-.53zm0-.14-.531.53zM9 18.1a4.25 4.25 0 0 1-4.25-4.25h-1.5A5.75 5.75 0 0 0 9 19.6zm-4.25-4.25A4.25 4.25 0 0 1 9 9.6V8.1a5.75 5.75 0 0 0-5.75 5.75zM9 19.6h7v-1.5H9zm0-10h10V8.1H9zm8.53 2.78 2.93-2.929-1.061-1.06-2.93 2.929zm2.93-4.131-2.93-2.93-1.06 1.061 2.929 2.93zm0 1.202a.85.85 0 0 0 0-1.202l-1.061 1.06a.65.65 0 0 1 0-.919z" />
        <path
          d="M16.47 5.32a.75.75 0 0 1 1.06 0l2.93 2.929a.85.85 0 0 1 0 1.202l-2.93 2.93a.75.75 0 1 1-1.06-1.061l1.72-1.72H9a4.25 4.25 0 0 0 0 8.5h7a.75.75 0 0 1 0 1.5H9A5.75 5.75 0 0 1 9 8.1h9.19l-1.72-1.72a.75.75 0 0 1 0-1.06"
          clipRule="evenodd"
          fillOpacity=".9"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
};
