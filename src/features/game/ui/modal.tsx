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
      className="m-auto w-[calc(100%-1.5rem)] max-w-3xl border-0 bg-transparent p-0 text-slate-100 backdrop:bg-slate-950/85 backdrop:backdrop-blur-md"
      onClick={(event) => {
        if (event.target === dialogRef.current && dismissible) onCloseRef.current?.();
      }}
    >
      <div
        className={`glass-panel mx-auto max-h-[92vh] w-full overflow-y-auto rounded-3xl p-5 shadow-2xl sm:p-7 ${className}`}
      >
        {children}
      </div>
    </dialog>
  );
}
