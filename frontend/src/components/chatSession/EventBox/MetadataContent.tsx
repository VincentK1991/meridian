import React, { useState } from 'react';
import type { GroundingMetadata } from '@/types/event';
import { Tab } from './Tab';

export const MetadataContent: React.FC<{ metadata: GroundingMetadata }> = ({ metadata }) => {
  const [activeMetadataTab, setActiveMetadataTab] = useState<'overview' | 'rendered'>('overview');

  return (
    <div className="space-y-4">
      {/* Metadata Tabs */}
      <div className="flex gap-2">
        <Tab isActive={activeMetadataTab === 'overview'} onClick={() => setActiveMetadataTab('overview')}>
          Overview
        </Tab>
        {metadata.search_entry_point?.rendered_content && (
          <Tab isActive={activeMetadataTab === 'rendered'} onClick={() => setActiveMetadataTab('rendered')}>
            Reference links
          </Tab>
        )}
      </div>

      {/* Metadata Content */}
      {activeMetadataTab === 'overview' && (
        <div className="space-y-4">
          {metadata.grounding_chunks && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Grounding Chunks</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.grounding_chunks, null, 2)}
              </pre>
            </div>
          )}
          {metadata.grounding_supports && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Grounding Supports</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.grounding_supports, null, 2)}
              </pre>
            </div>
          )}
          {metadata.retrieval_metadata && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Retrieval Metadata</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.retrieval_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Rendered Content */}
      {activeMetadataTab === 'rendered' && metadata.search_entry_point?.rendered_content && (
        <div className="prose prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: typeof metadata.search_entry_point.rendered_content === 'string'
                ? metadata.search_entry_point.rendered_content
                : JSON.stringify(metadata.search_entry_point.rendered_content)
            }}
          />
        </div>
      )}
    </div>
  );
};
