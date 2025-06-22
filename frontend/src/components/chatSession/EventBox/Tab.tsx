import React from 'react';
import type { TabProps } from './types';

export const Tab: React.FC<TabProps> = ({ isActive, onClick, children }) => (
  <button
    className={`liquid-glass-tab px-4 py-2 text-sm font-medium transition-all ${
      isActive
        ? 'active text-white'
        : 'text-white/70 hover:text-white'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);
