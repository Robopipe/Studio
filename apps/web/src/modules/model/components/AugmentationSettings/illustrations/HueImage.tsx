import { SVGProps, useId } from "react";

export const HueImage = (props: SVGProps<SVGSVGElement>) => {
  const gradientId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="128"
      height="128"
      fill="none"
      viewBox="0 0 128 128"
      {...props}
    >
      <circle
        cx="64"
        cy="64"
        r="30"
        stroke={`url(#${gradientId})`}
        strokeWidth="8"
      />
      <rect
        x="52"
        y="52"
        width="24"
        height="24"
        rx="4"
        stroke="#fff"
        strokeWidth="4"
      />
      <defs>
        <linearGradient id={gradientId} x1="34" y1="64" x2="94" y2="64">
          <stop offset="0" stopColor="#FF3B30" />
          <stop offset="0.2" stopColor="#FF9500" />
          <stop offset="0.4" stopColor="#FFCC00" />
          <stop offset="0.6" stopColor="#34C759" />
          <stop offset="0.8" stopColor="#007AFF" />
          <stop offset="1" stopColor="#AF52DE" />
        </linearGradient>
      </defs>
    </svg>
  );
};
