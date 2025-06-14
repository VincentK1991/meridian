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
    <div className={`mb-4 ${className}`} id={`event-${event.id}`}>
      <div className="rounded-lg backdrop-blur-md border border-white/20 shadow-lg">
        {/* Tabs */}
        {hasMetadata && (
          <div className="flex gap-2 p-4 border-b border-white/20">
            <Tab isActive={activeTab === 'content'} onClick={() => setActiveTab('content')}>
              Content
            </Tab>
            <Tab isActive={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')}>
              Metadata
            </Tab>
          </div>
        )}

        {/* Content */}
        {activeTab === 'content' && children}

        {/* Metadata */}
        {activeTab === 'metadata' && hasMetadata && (
          <div className="p-4">
            <MetadataContent metadata={event.grounding_metadata!} />
          </div>
        )}
      </div>
    </div>
  );
};
