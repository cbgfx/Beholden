import React from "react";

export function IconPencil(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconTrash(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPlus(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPerson(props: { size?: number }) {
  const s = props.size ?? 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="currentColor" viewBox="0 0 16 16">
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
    </svg>
  );
}

export function IconAdventure(props: { size?: number }) {
  const s = props.size ?? 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.5 8.516a7.5 7.5 0 1 1-9.462-7.24A1 1 0 0 1 7 0h2a1 1 0 0 1 .962 1.276 7.5 7.5 0 0 1 5.538 7.24m-3.61-3.905L6.94 7.439 4.11 12.39l4.95-2.828 2.828-4.95z"/>
    </svg>
  );
}

/** Notes / list card icon (bootstrap-like, but SVG so no dependency) */
export function IconNotes(props: { size?: number }) {
  const s = props.size ?? 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

/** Crossed swords (Encounter) */
export function IconEncounter(props: { size?: number }) {
  const s = props.size ?? 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 3l6 6-2 2-6-6 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M19 3l-6 6 2 2 6-6-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M9 11l-6 6 2 2 6-6-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M15 11l6 6-2 2-6-6 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
