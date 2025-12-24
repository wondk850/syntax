
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Show logo for 1.5 seconds, then fade out
    const timer1 = setTimeout(() => setIsFading(true), 1500);
    // Remove component after fade out animation (0.5s)
    const timer2 = setTimeout(onFinish, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center animate-fade-in">
        <h1 className="font-brand text-5xl md:text-7xl tracking-tighter mb-4">
          <span className="font-black text-slate-900">WON</span>
          <span className="font-light text-blue-500">SUMMER</span>
        </h1>
        <div className="h-1 w-20 bg-slate-900 mx-auto rounded-full mb-4"></div>
        <p className="text-xs md:text-sm font-bold text-slate-400 tracking-[0.3em] uppercase">
          Studio
        </p>
      </div>
    </div>
  );
};
