import { type IconProps } from "../types/iconProps";

interface BulbIconProps extends IconProps {}

export const BulbIcon = (props: BulbIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="14"
      fill="none"
      viewBox="0 0 11 14"
      {...props}
    >
      <path
        stroke="currentColor"
        d="M7.75 12.75h-5m4.3-2c0-2 2.7-3.162 2.7-5.833C9.75 2.615 7.735.75 5.25.75S.75 2.615.75 4.917c0 2.287 2.7 3.456 2.7 5.833"
        strokeOpacity=".9"
        strokeWidth="1.5"
      />
    </svg>
  );
};
