import React from "react";

type Props = { size?: number; title?: string };

export function IconPlus({ size = 16, title }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}


export function IconPencil({ size = 16, title }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}


export function IconTrash({ size = 16, title }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconMinus({ size = 16, title }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
      {title ? <title>{title}</title> : null}
      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8Z" />
    </svg>
  );
}

export function IconClose({ size = 16, title }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 32 32">
      {title ? <title>{title}</title> : null}
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708Z" />
    </svg>
  );
}


export function IconPerson({ size = 32, title }: Props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      fill="currentColor" 
      viewBox="0 0 16 16" 
      aria-label={title}
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M2 5.5V10L1.5 10V5.5L2 5.5ZM14.5 5.5V10L14 10V5.5L14.5 5.5ZM8 1L4 4.5V11L8 15L12 11V4.5L8 1ZM5.5 6.5V8.5H7V13H9V8.5H10.5V6.5H5.5Z" 
      />
    </svg>
  );
}

export function IconSkull({size = 32, title}: Props) {
 return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill="currentColor" aria-label={title}>
  <path d="M480 491.4C538.5 447.4 576 379.8 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304C64 379.8 101.5 447.4 160 491.4L160 528C160 554.5 181.5 576 208 576L240 576L240 536C240 522.7 250.7 512 264 512C277.3 512 288 522.7 288 536L288 576L352 576L352 536C352 522.7 362.7 512 376 512C389.3 512 400 522.7 400 536L400 576L432 576C458.5 576 480 554.5 480 528L480 491.4zM160 320C160 284.7 188.7 256 224 256C259.3 256 288 284.7 288 320C288 355.3 259.3 384 224 384C188.7 384 160 355.3 160 320zM416 256C451.3 256 480 284.7 480 320C480 355.3 451.3 384 416 384C380.7 384 352 355.3 352 320C352 284.7 380.7 256 416 256z"/>
  </svg>)

}

export function IconAdventure({ size = 32, title }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-label={title}>
      <path d="M15.5 8.516a7.5 7.5 0 1 1-9.462-7.24A1 1 0 0 1 7 0h2a1 1 0 0 1 .962 1.276 7.5 7.5 0 0 1 5.538 7.24m-3.61-3.905L6.94 7.439 4.11 12.39l4.95-2.828 2.828-4.95z" />
    </svg>
  );
}

export function IconNotes({ size = 32, title }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-label={title}>
      <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5h12zm-1 1H3V14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5z" />
      <path d="M14 1H2a1 1 0 0 0-1 1v1h14V2a1 1 0 0 0-1-1z" />
      <path d="M4.5 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
    </svg>
  );
}

export function IconEncounter({ size = 32, title }: Props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="currentColor" 
      aria-label={title}
    >
      {/* Left Sword */}
      <g transform="translate(3, 0)">
        {/* Blade: 3px wide, tapering to a point at the top */}
        <path d="M2 1 L3 0 L4 1 V10 H2 V1 Z" />
        {/* Crossguard: Wide horizontal bar */}
        <rect x="1" y="10" width="4" height="1" />
        {/* Handle */}
        <rect x="2.5" y="11" width="1" height="3" />
        {/* Pommel: Chunky base */}
        <rect x="2" y="14" width="2" height="1" />
      </g>

      {/* Right Sword */}
      <g transform="translate(9, 0)">
        {/* Blade */}
        <path d="M2 1 L3 0 L4 1 V10 H2 V1 Z" />
        {/* Crossguard */}
        <rect x="1" y="10" width="4" height="1" />
        {/* Handle */}
        <rect x="2.5" y="11" width="1" height="3" />
        {/* Pommel */}
        <rect x="2" y="14" width="2" height="1" />
      </g>
    </svg>
  );
}