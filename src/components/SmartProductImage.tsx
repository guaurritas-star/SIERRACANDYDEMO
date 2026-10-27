import React, { useState } from 'react';

interface SmartProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: string;
  productName?: string;
  showVerifiedBadge?: boolean;
}

const DOMAIN_FALLBACKS: Record<string, string> = {
  botas:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
  mocasines:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb',
  derby:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCV8_hGjBn7y8fa0mWH2q7XbC4kNliE4SPBeBBj_ZNQbtLpjOjBu5zW5mMEo0ZczPt_GOFNcKZCBcg1xqOo52QqZe3ngu1GHxzt4frX4utiVcyzumJpSzlBbcFRpcF4jLoiyCLolWOOtXn_f9OzRaJvqVxqerIveAGkumw2LWIiYjiWAi9MSX7mJUaWfNJNx6tB1NtNZl4MPHPS0gzwAoRAeDCjTs1Y-eYdW-v8qsq4dv1AdG7gH8tn',
  trabajo:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCzVdE6CnLEYQKWxOUhosYjKcT7C265j2htNwc2ht0CpMS-gVCFg3TXfu6Ot8m_-quuVp0CT1NI_A-s6t0U8_ve8c9oVYFSB788OYzCMAku9y4nTb6mjBX-DOPrLq_6h7epv0psCgcnly48nFMKKTsZ6ZDUJGYW9U_vxbb7GC-ZB8kD3yTxJ8Z6MFqXjDJm0_YKpxdQp9JqAE0bB_Y4ixVc5u8nZTkLZigct24m8AmotSlybo_5DUZS',
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
};

export const SmartProductImage: React.FC<SmartProductImageProps> = ({
  src,
  alt = 'Fotografía de producto',
  fallbackCategory = 'default',
  productName = '',
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);

  const getIntelligentFallback = () => {
    const q = (productName + ' ' + fallbackCategory).toLowerCase();
    if (q.includes('riviera') || q.includes('mocas')) return DOMAIN_FALLBACKS.mocasines;
    if (q.includes('derby') || q.includes('brutalista')) return DOMAIN_FALLBACKS.derby;
    if (q.includes('trabajo') || q.includes('urbana')) return DOMAIN_FALLBACKS.trabajo;
    if (q.includes('chelsea') || q.includes('bota')) return DOMAIN_FALLBACKS.botas;
    return DOMAIN_FALLBACKS.default;
  };

  const activeSrc = !src || hasError ? getIntelligentFallback() : src;

  if (secondaryError) {
    return (
      <div className="w-full h-full bg-[#efede8] flex flex-col items-center justify-center p-6 text-center select-none">
        <span className="font-editorial italic text-lg text-[#4a4945]">
          {productName || alt}
        </span>
        <span className="text-[11px] text-[#73716b] mt-1">{fallbackCategory}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#efede8] flex items-center justify-center">
      <img
        src={activeSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`${className} transition-transform duration-200`}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          } else {
            setSecondaryError(true);
          }
        }}
        loading="lazy"
        {...props}
      />
    </div>
  );
};
