import React, { useState } from 'react';

interface SmartProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: string;
  productName?: string;
  showVerifiedBadge?: boolean;
}

// Curated high-reliability domain fallbacks when an external image URL fails
const DOMAIN_FALLBACKS: Record<string, string> = {
  sacos: '/assets/mextie/suit_copenhague.png',
  trajes: '/assets/mextie/suit_madrid.png',
  conjuntos: '/assets/mextie/suit_dublin.png',
  blazers: '/assets/mextie/blazer_delemont.png',
  chalecos: '/assets/mextie/chaleco_arm.png',
  abrigos: '/assets/mextie/abrigo_estocolmo.png',
  camisas: '/assets/mextie/camisa_linate.png',
  polos: '/assets/mextie/polo_davis.png',
  calzado: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
  botas: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
  mocasines: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
  joyeria: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
  cafe: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
  default: '/assets/mextie/page_4.png',
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

  // Determine intelligent fallback based on product name or category
  const getIntelligentFallback = () => {
    const q = (productName + ' ' + fallbackCategory).toLowerCase();
    if (q.includes('copenhague')) return '/assets/mextie/suit_copenhague.png';
    if (q.includes('madrid')) return '/assets/mextie/suit_madrid.png';
    if (q.includes('dublin')) return '/assets/mextie/suit_dublin.png';
    if (q.includes('luxenburgo')) return '/assets/mextie/suit_luxenburgo.png';
    if (q.includes('san marino')) return '/assets/mextie/suit_sanmarino.png';
    if (q.includes('londres')) return '/assets/mextie/suit_londres.png';
    if (q.includes('delemont')) return '/assets/mextie/blazer_delemont.png';
    if (q.includes('lyss')) return '/assets/mextie/blazer_lyss.png';
    if (q.includes('arm')) return '/assets/mextie/chaleco_arm.png';
    if (q.includes('alpha')) return '/assets/mextie/chaleco_alpha.png';
    if (q.includes('estocolmo') || q.includes('abrigo')) return '/assets/mextie/abrigo_estocolmo.png';
    if (q.includes('oslo')) return '/assets/mextie/abrigo_oslo.png';
    if (q.includes('linate') || q.includes('camisa')) return '/assets/mextie/camisa_linate.png';
    if (q.includes('davis') || q.includes('polo')) return '/assets/mextie/polo_davis.png';
    if (q.includes('saco') || q.includes('traje')) return '/assets/mextie/suit_copenhague.png';
    if (q.includes('chaleco')) return '/assets/mextie/chaleco_arm.png';

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
