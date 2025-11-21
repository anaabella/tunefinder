import type { SVGProps } from "react";

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a2.4 2.4 0 0 1-2-2.5V9.5a2.4 2.4 0 0 1 2-2.5h19a2.4 2.4 0 0 1 2 2.5v5a2.4 2.4 0 0 1-2 2.5h-19Z" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}
