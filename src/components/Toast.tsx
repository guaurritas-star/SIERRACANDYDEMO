import React from 'react';

interface ToastProps {
  message: string | null;
  isVisible: boolean;
  type?: 'success' | 'info' | 'warning';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  if (!isVisible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 bg-[#141413] text-[#ffffff] px-5 py-3.5 shadow-lg border border-[#3a3935] flex items-center gap-3 text-xs tracking-wide transition-opacity duration-150"
    >
      <span>{message}</span>
    </div>
  );
};
