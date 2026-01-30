import { type IconProps } from "../types/iconProps";

interface BasketIconProps extends IconProps {}

export const BasketIcon = (props: BasketIconProps) => {
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
        d="m12 4.56-.02.016L7.572 8.25h8.857L12.02 4.576zM5.508 9.75H3.181a.25.25 0 0 0-.247.291l1.249 7.493a3.25 3.25 0 0 0 3.206 2.716h9.223a3.25 3.25 0 0 0 3.205-2.716l1.25-7.493a.25.25 0 0 0-.247-.291zm5.512-6.326L5.229 8.25H3.18a1.75 1.75 0 0 0-1.727 2.038l1.25 7.493a4.75 4.75 0 0 0 4.685 3.969h9.223a4.75 4.75 0 0 0 4.685-3.97l1.249-7.492A1.75 1.75 0 0 0 20.82 8.25h-2.048L12.98 3.424a.75.75 0 0 0-.98.017.75.75 0 0 0-.98-.017M8.75 12.5a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0zm4 0a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0zm4 0a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0z"
        clipRule="evenodd"
        fillOpacity=".9"
        fillRule="evenodd"
      />
    </svg>
  );
};
