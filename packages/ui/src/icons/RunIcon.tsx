import { type IconProps } from "../types/iconProps";

interface RunIconProps extends IconProps {}

export const RunIcon = (props: RunIconProps) => {
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
        d="M17.5 12a.28.28 0 0 0-.138-.26l-10.5-6.206A.2.2 0 0 0 6.75 5.5a.23.23 0 0 0-.112.034.28.28 0 0 0-.138.26v12.412c0 .13.06.214.138.26a.23.23 0 0 0 .112.034.2.2 0 0 0 .112-.034l10.5-6.206A.28.28 0 0 0 17.5 12m.625 1.552c1.167-.69 1.167-2.414 0-3.104l-10.5-6.205C6.458 3.553 5 4.415 5 5.794v12.412c0 1.379 1.458 2.24 2.625 1.551z"
        clipRule="evenodd"
        fillOpacity=".87"
        fillRule="evenodd"
      />
    </svg>
  );
};
