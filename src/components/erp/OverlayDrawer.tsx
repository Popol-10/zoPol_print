import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";

interface OverlayDrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  contentClassName?: string;
}

const sizeClasses = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
};

export function OverlayDrawer({
  open,
  onClose,
  label,
  children,
  size = "md",
  contentClassName = "",
}: OverlayDrawerProps) {
  const { dialogRef, close } = useDialogBehavior(open, onClose);
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex justify-end overflow-hidden bg-slate-950/40 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`drawer-enter h-[100dvh] w-full overflow-y-auto overscroll-contain bg-white shadow-2xl outline-none dark:bg-slate-900 sm:m-3 sm:h-[calc(100dvh-1.5rem)] sm:rounded-2xl ${sizeClasses[size]} ${contentClassName}`}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
