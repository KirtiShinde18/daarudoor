"use client";

import React, { useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

export type ConfirmationVariant = 'primary' | 'success' | 'danger' | 'secondary';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  disableBackdropDismiss?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon,
  loading = false,
  disableBackdropDismiss = false,
  children,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key if not loading
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !disableBackdropDismiss) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, disableBackdropDismiss, onClose]);

  // Auto-focus confirm button on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !disableBackdropDismiss) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          btn: 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm focus:ring-[#22C55E]/40',
          iconWrap: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          defaultIcon: <CheckCircle2 className="w-7 h-7" />,
        };
      case 'danger':
        return {
          btn: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm focus:ring-[#EF4444]/40',
          iconWrap: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
          defaultIcon: <AlertCircle className="w-7 h-7" />,
        };
      case 'secondary':
        return {
          btn: 'bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-main border border-border-main focus:ring-border-main/50',
          iconWrap: 'bg-black/5 dark:bg-white/5 text-muted border border-border-main',
          defaultIcon: <HelpCircle className="w-7 h-7" />,
        };
      case 'primary':
      default:
        return {
          btn: 'bg-[#6A0409] hover:bg-[#9D0208] active:bg-[#370617] text-white shadow-sm focus:ring-[#6A0409]/40',
          iconWrap: 'bg-[#6A0409]/10 text-[#6A0409] dark:text-[#FCE7E9] dark:bg-[#9D0208]/20 border border-[#6A0409]/20',
          defaultIcon: <HelpCircle className="w-7 h-7" />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-surface dark:bg-surface border border-border-main rounded-2xl shadow-2xl p-6 sm:p-7 text-center transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${styles.iconWrap}`}>
            {icon || styles.defaultIcon}
          </div>
        </div>

        {/* Title */}
        <h3
          id="confirmation-modal-title"
          className="text-xl font-bold text-text-main tracking-tight mb-2"
        >
          {title}
        </h3>

        {/* Description */}
        <p
          id="confirmation-modal-desc"
          className="text-sm text-muted leading-relaxed mb-6 px-2"
        >
          {description}
        </p>

        {children && <div className="mb-6 text-left">{children}</div>}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-border-main bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-border-main"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 ${styles.btn}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
