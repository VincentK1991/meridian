import React from 'react';
import type { BaseEventBoxProps } from './types';
import { BaseEventBox } from './BaseEventBox';
import { PartsRenderer } from './PartsRenderer';

export const UserEventBox: React.FC<BaseEventBoxProps> = ({ event, className = '' }) => (
  <BaseEventBox event={event} className={`ml-auto w-4/5 ${className}`}>
    <div className="bg-blue-600/20 backdrop-blur-md text-white p-4 rounded-lg border border-blue-400/30">
      <div className="text-white text-right">
        <PartsRenderer parts={event.content.parts} />
      </div>
    </div>
  </BaseEventBox>
);
