import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  showBack = true, 
  rightElement,
  transparent = false
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`sticky top-0 z-[100] ${transparent ? 'bg-transparent' : 'bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50'} -mx-4 px-4 pt-12 pb-3 mb-6 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBack && (
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className={`text-xl font-bold ${showBack ? 'ml-2' : ''} text-gray-900 dark:text-white tracking-tight`}>
            {title}
          </h1>
        </div>
        {rightElement && (
          <div className="flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
