import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function Menu(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 14L14 6M7 6h7v7" />
    </svg>
  );
}

export function Spinner(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeOpacity={0.25}
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Instagram(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.9.25 2.3.42.6.23 1 .5 1.5 1 .5.5.77.9 1 1.5.17.4.36 1.1.42 2.3.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.9-.42 2.3-.23.6-.5 1-1 1.5-.5.5-.9.77-1.5 1-.4.17-1.1.36-2.3.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.9-.25-2.3-.42-.6-.23-1-.5-1.5-1-.5-.5-.77-.9-1-1.5-.17-.4-.36-1.1-.42-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.9.42-2.3.23-.6.5-1 1-1.5.5-.5.9-.77 1.5-1 .4-.17 1.1-.36 2.3-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-.9.04-1.4.19-1.7.32-.4.16-.7.35-1 .65-.3.3-.5.6-.65 1-.13.3-.28.8-.32 1.7C3.56 8.5 3.56 8.9 3.56 12s0 3.5.07 4.7c.04.9.19 1.4.32 1.7.16.4.35.7.65 1 .3.3.6.5 1 .65.3.13.8.28 1.7.32 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c.9-.04 1.4-.19 1.7-.32.4-.16.7-.35 1-.65.3-.3.5-.6.65-1 .13-.3.28-.8.32-1.7.07-1.2.07-1.6.07-4.7s0-3.5-.07-4.7c-.04-.9-.19-1.4-.32-1.7a2.7 2.7 0 0 0-.65-1 2.7 2.7 0 0 0-1-.65c-.3-.13-.8-.28-1.7-.32-1.2-.07-1.6-.07-4.7-.07Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.08a3.18 3.18 0 1 0 0-6.36 3.18 3.18 0 0 0 0 6.36Zm6.24-8.28a1.14 1.14 0 1 1-2.29 0 1.14 1.14 0 0 1 2.29 0Z" />
    </svg>
  );
}

export function Facebook(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21h2.8Z" />
    </svg>
  );
}

export function LinkedIn(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.06c.53-1 1.83-2.05 3.77-2.05C21.4 8.65 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.57-2.3 3.2V21h-4V9Z" />
    </svg>
  );
}

export function YouTube(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" />
    </svg>
  );
}

export function Pinterest(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-3.65 19.3c-.05-.8-.01-1.75.2-2.62.23-.83 1.44-6.09 1.44-6.09s-.36-.73-.36-1.8c0-1.7.98-2.96 2.2-2.96 1.04 0 1.54.78 1.54 1.71 0 1.05-.67 2.61-1.01 4.06-.29 1.22.61 2.21 1.81 2.21 2.17 0 3.84-2.29 3.84-5.6 0-2.92-2.1-4.97-5.1-4.97-3.47 0-5.5 2.6-5.5 5.28 0 1.05.4 2.17.9 2.78.1.12.11.23.08.35l-.34 1.35c-.05.22-.28.3-.48.2-1.36-.63-2.21-2.6-2.21-4.19 0-3.41 2.48-6.54 7.15-6.54 3.75 0 6.67 2.67 6.67 6.24 0 3.73-2.35 6.73-5.62 6.73-1.1 0-2.13-.57-2.48-1.25l-.68 2.58c-.24.95-.9 2.14-1.34 2.86A10 10 0 1 0 12 2Z" />
    </svg>
  );
}
