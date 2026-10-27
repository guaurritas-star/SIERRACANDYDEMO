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
      className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 bg-[#000000] text-[#ffffff] px-6 py-3 shadow-2xl flex items-center gap-3 border-l-4 border-[#25D366] animate-bounce-short`}
    >
      <span className="material-symbols-outlined text-[#25D366] text-[20px]">
        check_circle
      </span>
      <span className="font-mono text-xs tracking-wide">{message}</span>
    </div>
  );
};
