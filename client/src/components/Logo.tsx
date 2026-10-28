import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', onClick }) => {
  const iconSizes = {
    sm: 'w-6 h-4',
    md: 'w-8 h-5.5',
    lg: 'w-10 h-7'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div 
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      onClick={onClick}
    >
      {/* YouTube Play Button Red Icon */}
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <svg 
          className={`${iconSizes[size]} drop-shadow-sm`} 
          viewBox="0 0 68 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Red YouTube rounded rectangle */}
          <path 
            d="M66.52 7.74C65.74 4.8 63.45 2.5 60.52 1.72C55.23 0.3 34 0.3 34 0.3C34 0.3 12.77 0.3 7.48 1.72C4.55 2.5 2.26 4.8 1.48 7.74C0.06 13.05 0 24.15 0 24.15C0 24.15 0.06 35.25 1.48 40.56C2.26 43.5 4.55 45.8 7.48 46.58C12.77 48 34 48 34 48C34 48 55.23 48 60.52 46.58C63.45 45.8 65.74 43.5 66.52 40.56C67.94 35.25 68 24.15 68 24.15C68 24.15 67.94 13.05 66.52 7.74Z" 
            fill="#FF0000"
          />
          {/* White Play triangle */}
          <path 
            d="M45 24L27 13.5V34.5L45 24Z" 
            fill="white"
          />
        </svg>
      </div>

      {/* App Name: self (black) learn (red) */}
      <div className={`font-black tracking-tight ${textSizes[size]} flex items-center leading-none`}>
        <span className="text-black dark:text-white transition-colors duration-200">
          self
        </span>
        <span className="text-[#FF0000] ml-0.5">
          learn
        </span>
      </div>
    </div>
  );
};

