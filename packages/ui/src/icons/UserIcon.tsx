import { type IconProps } from "../types/iconProps";

interface UserIconProps extends IconProps {}

export const UserIcon = (props: UserIconProps) => {
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
        d="M8.25 8.5a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0M12 3.25a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5m-1.917 12a6.75 6.75 0 0 0-6.658 5.64l-.165.987a.75.75 0 1 0 1.48.246l.164-.986a5.25 5.25 0 0 1 5.179-4.387h3.834a5.25 5.25 0 0 1 5.179 4.387l.164.986a.75.75 0 1 0 1.48-.246l-.164-.987a6.75 6.75 0 0 0-6.659-5.64z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
