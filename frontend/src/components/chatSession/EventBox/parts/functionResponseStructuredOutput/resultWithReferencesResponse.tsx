import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ResultWithReferences } from '@/types/structuredOutput';

// Type guard to check if response is ResultWithReferences
export const isResultWithReferences = (response: any): response is ResultWithReferences => {
    return (
      response &&
      typeof response === 'object' &&
      'result' in response &&
      response.result &&
      typeof response.result === 'object' &&
      'paragraphs' in response.result &&
      Array.isArray(response.result.paragraphs)
    );
  };

interface ResultWithReferencesResponseProps {
  data: ResultWithReferences;
}

export const ResultWithReferencesResponse: React.FC<ResultWithReferencesResponseProps> = ({ data }) => {
  const { result } = data;

  return (
    <div className="space-y-4">
      {/* Paragraphs with References */}
      <div className="space-y-3">
        {result.paragraphs.map((paragraph, index) => (
          <div key={index} className="relative group">
            <div
              className="text-gray-200 leading-relaxed cursor-help text-left"
              title={paragraph.reference || ''}
            >
              <div className="prose prose-sm prose-invert max-w-none text-left">
                <ReactMarkdown
                  components={{
                    // Custom link styling
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-blue-400 hover:text-blue-300 underline transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    // Custom paragraph styling to remove default margins and ensure left alignment
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-0 text-left" />
                    ),
                    // Custom code styling
                    code: ({ node, ...props }) => (
                      <code {...props} className="bg-gray-700 px-1 py-0.5 rounded text-sm" />
                    ),
                    // Custom strong styling
                    strong: ({ node, ...props }) => (
                      <strong {...props} className="font-semibold text-white" />
                    ),
                    // Custom em styling
                    em: ({ node, ...props }) => (
                      <em {...props} className="italic text-gray-100" />
                    )
                  }}
                >
                  {paragraph.content}
                </ReactMarkdown>
              </div>
            </div>
            {paragraph.reference && (
              <div className="absolute left-0 top-full mt-2 bg-gray-800 text-gray-200 text-xs p-2 rounded-md shadow-lg border border-gray-600 max-w-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="font-medium text-blue-300 mb-1">Reference [{index + 1}]:</div>
                <div className="text-left">
                  <div className="prose prose-xs prose-invert max-w-none text-left">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-blue-300 hover:text-blue-200 underline text-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-0 text-left" />
                        )
                      }}
                    >
                      {paragraph.reference}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="border-t border-gray-600/50 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Summary</h4>
          <div className="text-gray-200 bg-gray-800/30 p-3 rounded-md border border-gray-700/50 text-left">
            <div className="prose prose-sm prose-invert max-w-none text-left">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-blue-400 hover:text-blue-300 underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p {...props} className="mb-2 last:mb-0 text-left" />
                  ),
                  code: ({ node, ...props }) => (
                    <code {...props} className="bg-gray-700 px-1 py-0.5 rounded text-sm" />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="font-semibold text-white" />
                  ),
                  em: ({ node, ...props }) => (
                    <em {...props} className="italic text-gray-100" />
                  )
                }}
              >
                {result.summary}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="border-t border-gray-600/50 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Sources</h4>
          <div className="space-y-2">
            {result.sources.map((source, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-400 font-medium text-sm min-w-[1.5rem]">
                  [{index + 1}]
                </span>
                <div className="text-gray-300 text-sm break-all text-left">
                  <div className="prose prose-xs prose-invert max-w-none text-left">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-blue-400 hover:text-blue-300 underline transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <span {...props} />
                        )
                      }}
                    >
                      {source}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
