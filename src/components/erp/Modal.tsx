import { useId, type ElementType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ElementType;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  size = "md",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { dialogRef, close } = useDialogBehavior(open, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end overflow-y-auto overscroll-contain bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`modal-enter flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none dark:bg-slate-900 sm:max-h-[88vh] sm:rounded-[24px] sm:pb-0 ${sizeClasses[size]}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#ff226d] dark:bg-rose-950/40">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-extrabold text-slate-900 dark:text-white sm:text-xl"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400"
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff226d] dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
      {children}
    </footer>
  );
}
