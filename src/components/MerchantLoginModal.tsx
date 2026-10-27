import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface MerchantLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  onContinueDemo: () => void;
  brandName: string;
}

export const MerchantLoginModal: React.FC<MerchantLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onContinueDemo,
  brandName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthenticated();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Cerraste la ventana de inicio de sesión antes de completar el acceso.');
      } else {
        setErrorMsg(
          'La ventana emergente fue bloqueada por el navegador o entorno de vista previa. Puedes volver a intentar o acceder en modo demostración.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="merchant-login-title"
      className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] w-full max-w-md border border-[#e4e2dc] p-8 shadow-xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e4e2dc] pb-4">
          <div className="space-y-1">
            <p className="text-xs text-[#73716b] uppercase tracking-widest">
              Acceso de Comerciante
            </p>
            <h2
              id="merchant-login-title"
              className="font-editorial text-2xl font-semibold text-[#141413]"
            >
              Administrar {brandName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="w-9 h-9 flex items-center justify-center text-[#73716b] hover:text-[#141413] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-sm text-[#4a4945] leading-relaxed">
          Inicia sesión con Google para sincronizar tu catálogo y configuración directamente con tu cuenta en Cloud Firestore.
        </p>

        {errorMsg && (
          <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] leading-relaxed">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>{isLoading ? 'Verificando con Google...' : 'Iniciar Sesión con Google'}</span>
          </button>

          <button
            type="button"
            onClick={onContinueDemo}
            className="w-full py-2.5 px-4 bg-[#f7f6f2] hover:bg-[#efede8] text-[#141413] border border-[#cfccc4] text-xs font-medium transition-colors cursor-pointer"
          >
            Acceder en Modo Vista Previa ({brandName})
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-transparent text-[#73716b] hover:text-[#141413] text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        <div className="pt-4 border-t border-[#e4e2dc] flex items-center justify-between text-[11px] text-[#73716b]">
          <span>Firebase Auth & Firestore Multi-Tenant</span>
          <span>Candy Studio</span>
        </div>
      </div>
    </div>
  );
};
