import React, { useState } from 'react';

interface SmartProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: string;
  productName?: string;
  showVerifiedBadge?: boolean;
}

// Curated high-reliability domain fallbacks when an external or missing local image URL fails
const DOMAIN_FALLBACKS: Record<string, string> = {
  sacos: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
  trajes: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  conjuntos: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
  blazers: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
  chalecos: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  abrigos: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80',
  camisas: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
  polos: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
  calzado: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
  botas: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
  mocasines: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
  joyeria: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
  cafe: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
};

export const SmartProductImage: React.FC<SmartProductImageProps> = ({
  src,
  alt = 'Producto',
  fallbackCategory = 'default',
  productName = '',
  showVerifiedBadge = false,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const getIntelligentFallback = () => {
    const q = (productName + ' ' + fallbackCategory).toLowerCase();
    if (q.includes('copenhague')) return DOMAIN_FALLBACKS.sacos;
    if (q.includes('madrid')) return DOMAIN_FALLBACKS.trajes;
    if (q.includes('dublin')) return DOMAIN_FALLBACKS.conjuntos;
    if (q.includes('luxenburgo')) return DOMAIN_FALLBACKS.sacos;
    if (q.includes('delemont') || q.includes('lyss') || q.includes('blazer')) return DOMAIN_FALLBACKS.blazers;
    if (q.includes('arm') || q.includes('alpha') || q.includes('chaleco')) return DOMAIN_FALLBACKS.chalecos;
    if (q.includes('estocolmo') || q.includes('oslo') || q.includes('abrigo')) return DOMAIN_FALLBACKS.abrigos;
    if (q.includes('linate') || q.includes('camisa')) return DOMAIN_FALLBACKS.camisas;
    if (q.includes('davis') || q.includes('polo')) return DOMAIN_FALLBACKS.polos;
    if (q.includes('saco') || q.includes('traje')) return DOMAIN_FALLBACKS.sacos;

    for (const [key, url] of Object.entries(DOMAIN_FALLBACKS)) {
      if (q.includes(key)) return url;
    }
    return DOMAIN_FALLBACKS.default;
  };

  const currentSrc = hasError || !src ? getIntelligentFallback() : src;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F3F4F3] flex items-center justify-center">
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300`}
        onError={() => {
          if (!hasError && retryCount < 2) {
            setRetryCount((prev) => prev + 1);
            setHasError(true);
          }
        }}
        loading="lazy"
        {...props}
      />

      {showVerifiedBadge && (
        <span
          className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-[#000000]/70 text-[#FFFFFF] font-mono text-[9px] uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 z-10"
          title="Imagen extraída del catálogo y verificada por Gemini"
        >
          <span className="material-symbols-outlined text-[10px] text-[#25D366]">verified</span>
          <span>IA OK</span>
        </span>
      )}
    </div>
  );
};
