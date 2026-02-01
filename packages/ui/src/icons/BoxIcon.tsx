import { type IconProps } from "../types/iconProps";

interface BoxIconProps extends IconProps {}

export const BoxIcon = (props: BoxIconProps) => {
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
        fill="currentColor"
        d="M14.217 3.325a4.75 4.75 0 0 0-4.435-.005L7.376 4.586 5.267 5.71A4.75 4.75 0 0 0 2.75 9.902v4.19a4.75 4.75 0 0 0 2.528 4.198l4.5 2.382a4.75 4.75 0 0 0 4.445 0l4.5-2.382a4.75 4.75 0 0 0 2.527-4.198V9.908a4.75 4.75 0 0 0-2.527-4.198zm-3.736 1.322a3.25 3.25 0 0 1 3.034.004l4.506 2.385c.328.174.62.4.864.664l-3.421 1.63-3.473 1.827L5.1 7.711c.246-.27.54-.5.873-.678l2.104-1.12zM4.37 9.024q-.12.425-.121.878v4.19a3.25 3.25 0 0 0 1.73 2.872l4.5 2.382q.37.195.77.29v-7.172zm8.379 10.612a3.3 3.3 0 0 0 .77-.29l4.5-2.382a3.25 3.25 0 0 0 1.73-2.872V9.908q-.001-.464-.127-.898l-3.487 1.66-3.386 1.783z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
