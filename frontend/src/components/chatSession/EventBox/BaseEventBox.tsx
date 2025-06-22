import React, { useState } from 'react';
import type { BaseEventBoxProps } from './types';
import { Tab } from './Tab';
import { MetadataContent } from './MetadataContent';

export const BaseEventBox: React.FC<BaseEventBoxProps & { children: React.ReactNode }> = ({
  event,
  className = '',
  children
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata'>('content');
  const hasMetadata = event.grounding_metadata !== null;

  return (
    <div className={`mb-6 ${className}`} id={`event-${event.id}`}>
      <div className="liquid-glass-event liquid-refraction">
        {/* Tabs */}
        {hasMetadata && (
          <div className="flex gap-3 p-4 border-b border-white/10">
            <Tab isActive={activeTab === 'content'} onClick={() => setActiveTab('content')}>
              Content
            </Tab>
            <Tab isActive={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')}>
              Metadata
            </Tab>
          </div>
        )}

        {/* Content */}
        {activeTab === 'content' && (
          <div className="liquid-refraction">
            {children}
          </div>
        )}

        {/* Metadata */}
        {activeTab === 'metadata' && hasMetadata && (
          <div className="p-4 liquid-refraction">
            <MetadataContent metadata={event.grounding_metadata!} />
          </div>
        )}
      </div>
    </div>
  );
};
