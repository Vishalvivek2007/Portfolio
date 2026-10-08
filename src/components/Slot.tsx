"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { slotEl, type SlotId } from "@/stage/slots";

export default function Slot({ id, label, className = "", children }: { id: SlotId; label: string; className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    slotEl.set(id, el);
    return () => {
      slotEl.delete(id);
    };
  }, [id]);
  return (
    <div ref={ref} id={"slot-" + id} role="img" aria-label={label} className={"slot " + className} data-slot={id}>
      <span className="br" />
      {children}
    </div>
  );
}
