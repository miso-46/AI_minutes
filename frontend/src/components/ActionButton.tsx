import React from 'react';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled} 
      className="gap-2.5 px-5 py-2 text-base font-bold leading-7 text-center text-white bg-sky-500 rounded-3xl max-sm:px-4 max-sm:py-2 max-sm:text-sm"
    >
      {children}
    </button>
  );
};
