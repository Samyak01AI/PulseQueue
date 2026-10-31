import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-textMuted hover:text-cyan focus:outline-none transition-colors"
        aria-label="More information"
      >
        {children || <HelpCircle className="w-3.5 h-3.5" />}
      </button>

      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-lg bg-secondary border border-white/10 text-[11px] font-sans text-textPrimary shadow-xl z-50 pointer-events-none text-left leading-tight">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-secondary" />
        </span>
      )}
    </span>
  );
};

