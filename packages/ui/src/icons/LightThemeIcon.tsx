import { type IconProps } from "../types/iconProps";

interface LightThemeIconProps extends IconProps {}

export const LightThemeIcon = (props: LightThemeIconProps) => {
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
        d="M12 2.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75M5.46 5.46a.75.75 0 0 1 1.06 0l.707.706a.75.75 0 1 1-1.06 1.061l-.708-.707a.75.75 0 0 1 0-1.06M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9m0 1.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12m5.834-1.227a.75.75 0 0 0-1.06 1.06l.706.708a.75.75 0 0 0 1.06-1.06zM5.46 18.541a.75.75 0 0 1 0-1.06l.707-.708a.75.75 0 0 1 1.06 1.06l-.707.708a.75.75 0 0 1-1.06 0M16.773 6.166a.75.75 0 0 0 1.06 1.061l.708-.707a.75.75 0 0 0-1.06-1.06zM12.75 19.5a.75.75 0 0 0-1.5 0v1a.75.75 0 0 0 1.5 0zm-10-7.5a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75m16.75-.75a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
