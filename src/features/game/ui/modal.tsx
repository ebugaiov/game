"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
};

export function Modal({
  open,
  onClose,
  dismissible = true,
  children,
  className = "",
  labelledBy,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      if (!dismissible) {
        event.preventDefault();
        return;
      }
      onCloseRef.current?.();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [dismissible]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="m-auto w-[calc(100%_-_1.5rem)] max-w-3xl border-0 bg-transparent p-0 text-ink-200 backdrop:bg-ink-950/85 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === dialogRef.current && dismissible) onCloseRef.current?.();
      }}
    >
      <div
        className={`mx-auto max-h-[92vh] w-full overflow-y-auto rounded-xl border-2 border-ink-600 bg-ink-800 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] sm:p-7 ${className}`}
      >
        {children}
      </div>
    </dialog>
  );
}
