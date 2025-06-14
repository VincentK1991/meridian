import React from 'react';
import type { BaseEventBoxProps } from './types';
import { BaseEventBox } from './BaseEventBox';
import { PartsRenderer } from './PartsRenderer';

export const ModelEventBox: React.FC<BaseEventBoxProps> = ({ event, className = '' }) => (
  <BaseEventBox event={event} className={`mr-auto w-4/5 ${className}`}>
    <div className="bg-white/5 backdrop-blur-md border border-white/20 p-4 rounded-lg">
      <div className="text-gray-100 text-left">
        <PartsRenderer parts={event.content.parts} />
      </div>
    </div>
  </BaseEventBox>
);
