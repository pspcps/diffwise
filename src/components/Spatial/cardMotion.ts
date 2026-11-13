import type { PointerEvent } from "react";

export function tiltCard(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== "mouse" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientY - bounds.top) / bounds.height - 0.5) * -6;
  const y = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6;
  event.currentTarget.style.setProperty("--rx", `${x}deg`);
  event.currentTarget.style.setProperty("--ry", `${y}deg`);
}

export function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}
