import React from 'react';
import type { TabProps } from './types';

export const Tab: React.FC<TabProps> = ({ isActive, onClick, children }) => (
  <button
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-white/10 text-white border border-white/20'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);
