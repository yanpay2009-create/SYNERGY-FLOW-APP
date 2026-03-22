import React from 'react';

interface ShoppingBagIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  handleColor?: string;
  bodyColor?: string;
}

export const ShoppingBagIcon: React.FC<ShoppingBagIconProps> = ({ 
  size = 24, 
  className = "", 
  strokeWidth = 2,
  handleColor = "currentColor",
  bodyColor = "currentColor"
}) => {
  const color = bodyColor === "currentColor" ? "currentColor" : bodyColor;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Cart Frame */}
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
};
