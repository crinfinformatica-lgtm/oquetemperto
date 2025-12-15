
import React from 'react';

interface AppLogoProps {
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* 
        LOGICA DA LOGO ATUALIZADA:
        Apenas a Lupa (Azul #0047AB) = Símbolo de Busca
      */}

      {/* --- LUPA (SÍMBOLO DE BUSCA) --- */}
      
      {/* Cabo da Lupa */}
      <path 
        d="M150 150 L185 185" 
        stroke="#0047AB" 
        strokeWidth="20" 
        strokeLinecap="round"
      />

      {/* Aro Azul (Primary) */}
      <circle 
        cx="90" 
        cy="90" 
        r="70" 
        stroke="#0047AB" 
        strokeWidth="12" 
        fill="white" // Fundo branco para garantir contraste
      />
      
      {/* Reflexo no vidro (Sutil) */}
      <path 
        d="M60 50 Q 90 20 120 50" 
        stroke="#E0E7FF" 
        strokeWidth="6" 
        strokeLinecap="round" 
        opacity="0.6"
      />

    </svg>
  );
};

export default AppLogo;
