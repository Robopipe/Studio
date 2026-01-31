import { type IconProps } from "../types/iconProps";

interface TemperatureIconProps extends IconProps {}

export const TemperatureIcon = (props: TemperatureIconProps) => {
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
        d="M8.25 5a3.75 3.75 0 1 1 7.5 0v6.348c0 .072.04.18.158.274a6.25 6.25 0 1 1-7.816 0c.118-.095.158-.202.158-.274zM12 2.75A2.25 2.25 0 0 0 9.75 5v6.348c0 .603-.31 1.116-.72 1.444a4.75 4.75 0 1 0 5.939 0c-.409-.328-.719-.84-.719-1.444V5A2.25 2.25 0 0 0 12 2.75m0 12a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5m.75-1.413V5a.75.75 0 0 0-1.5 0v8.337A3.251 3.251 0 0 0 12 19.75a3.25 3.25 0 0 0 .75-6.413"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
