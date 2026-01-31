import { type IconProps } from "../types/iconProps";

interface HandIconProps extends IconProps {}

export const HandIcon = (props: HandIconProps) => {
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
        d="M12.5 2.75a.75.75 0 0 0-.75.75V11a.75.75 0 0 1-1.5 0V6.5a.75.75 0 0 0-1.5 0V15a.75.75 0 0 1-1.28.53L5.7 13.76a.99.99 0 1 0-1.377 1.421l4.959 4.649a5.25 5.25 0 0 0 3.59 1.42H14c2.9 0 5.25-2.35 5.25-5.25V7.5a.75.75 0 0 0-1.5 0V11a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 0-1.5 0V11a.75.75 0 0 1-1.5 0V3.5a.75.75 0 0 0-.75-.75m2.006-.27A2.25 2.25 0 0 0 10.25 3.5v.878a2.25 2.25 0 0 0-3 2.122v6.69l-.49-.49a2.49 2.49 0 1 0-3.463 3.576l4.96 4.648a6.75 6.75 0 0 0 4.616 1.826H14A6.75 6.75 0 0 0 20.75 16V7.5a2.25 2.25 0 0 0-3-2.122V4.5a2.25 2.25 0 0 0-3.244-2.02"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
