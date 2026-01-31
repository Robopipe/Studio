import { type IconProps } from "../types/iconProps";

interface ChatIconProps extends IconProps {}

export const ChatIcon = (props: ChatIconProps) => {
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
        d="M12.058 1.258c-5.937 0-10.75 4.813-10.75 10.75 0 1.718.403 3.344 1.122 4.787.107.215.13.435.08.62l-.595 2.226c-.408 1.524.986 2.917 2.51 2.51l2.226-.596a.9.9 0 0 1 .62.08 10.7 10.7 0 0 0 4.787 1.123c5.937 0 10.75-4.813 10.75-10.75s-4.813-10.75-10.75-10.75m-9.25 10.75a9.25 9.25 0 1 1 9.25 9.25 9.2 9.2 0 0 1-4.119-.965 2.38 2.38 0 0 0-1.676-.187l-2.226.596a.55.55 0 0 1-.673-.674l.595-2.226a2.38 2.38 0 0 0-.187-1.676 9.2 9.2 0 0 1-.964-4.118M7.25 10.5A.75.75 0 0 1 8 9.75h8a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 3.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
