import { IconProps } from '../types';

interface MinusIconProps extends IconProps {}

export const MinusIcon = (props: MinusIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="2"
      fill="none"
      viewBox="0 0 12 2"
      {...props}
    >
      <path
        stroke="currentColor"
        d="M10.75.75h-10"
        strokeLinecap="square"
        strokeWidth="1.5"
      />
    </svg>
  );
};