import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Onboarding: React.FC = () => {
  const { onboardingSlides } = useApp();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (onboardingSlides.length === 0) {
      navigate('/account');
    }
  }, [onboardingSlides, navigate]);

  const next = () => {
    if (current < onboardingSlides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('/account');
    }
  };

  if (onboardingSlides.length === 0) {
      return null;
  }

  const activeSlide = onboardingSlides[current];

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden flex flex-col justify-between max-w-md mx-auto">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        <img 
            key={activeSlide.id}
            src={activeSlide.image || undefined} 
            alt="bg" 
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-synergy-blue', 'to-purple-900');
            }}
            className="w-full h-full object-cover transition-opacity duration-700 ease-in-out animate-in fade-in" 
        />
      </div>

      <div className="z-10 mt-12 px-6 flex justify-end">
        <button onClick={() => navigate('/account')} className="text-white text-sm font-medium backdrop-blur-md bg-black/20 border border-white/20 px-4 py-1.5 rounded-full hover:bg-black/30 transition">
          Skip
        </button>
      </div>

      <div className="z-10 pb-12 px-8 text-white">
        <h1 className="text-4xl font-bold mb-4 leading-tight animate-in slide-in-from-bottom-5 duration-500">
          {activeSlide.title}
        </h1>
        <p className="text-white/90 text-lg mb-8 font-light animate-in slide-in-from-bottom-5 duration-700">
          {activeSlide.desc}
        </p>

        <button 
          onClick={next}
          className="w-full bg-synergy-blue text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-glow active:scale-95 transition-transform hover:bg-synergy-dark"
        >
          <span>{current === onboardingSlides.length - 1 ? "Get Started" : "Next"}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
