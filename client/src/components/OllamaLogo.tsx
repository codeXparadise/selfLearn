import React from 'react';

interface OllamaLogoProps {
  className?: string;
  size?: number | string;
}

export const OllamaLogo: React.FC<OllamaLogoProps> = ({ 
  className = "w-5 h-5", 
  size 
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/ollama.png"
      alt="Ollama"
      className={`inline-block object-contain select-none shrink-0 ${className}`}
      style={style}
      loading="eager"
    />
  );
};

export default OllamaLogo;
