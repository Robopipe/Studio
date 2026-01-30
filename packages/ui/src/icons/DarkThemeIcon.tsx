import { type IconProps } from "../types/iconProps";

interface DarkThemeIconProps extends IconProps {}

export const DarkThemeIcon = (props: DarkThemeIconProps) => {
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
        d="M12.693 5.077a7.252 7.252 0 1 0 4.514 13.548 8.753 8.753 0 0 1-4.514-13.548M5 12.25a8.75 8.75 0 0 1 8.982-8.747c.923.024 1.163 1.099.637 1.625a7.252 7.252 0 0 0 4.097 12.3c.734.104 1.193 1.105.467 1.68A8.75 8.75 0 0 1 5 12.25"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
